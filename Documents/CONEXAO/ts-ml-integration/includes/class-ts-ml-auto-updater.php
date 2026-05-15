<?php
/**
 * Auto Updater Class
 * Handles automatic update checks from remote server
 * 
 * This is how commercial plugins detect updates automatically!
 *
 * @package TS_ML_Integration
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Auto Updater class
 */
class TS_ML_Auto_Updater {
    
    /**
     * API endpoint URL
     * Pode ser configurado via constante TS_ML_UPDATE_API_URL ou opção do plugin
     */
    private $api_url;
    
    /**
     * Plugin slug
     */
    private $plugin_slug = 'ts-ml-integration';
    
    /**
     * Plugin file
     */
    private $plugin_file;
    
    /**
     * License key (for commercial plugins)
     */
    private $license_key;
    
    /**
     * Initialize updater
     */
    public function __construct($plugin_file) {
        $this->plugin_file = $plugin_file;
        $this->license_key = $this->get_license_key();
        
        // Configurar URL da API
        $this->api_url = $this->get_api_url();
        
        $this->init();
    }
    
    /**
     * Get API URL
     */
    private function get_api_url() {
        // Prioridade 1: Constante definida no código
        if (defined('TS_ML_UPDATE_API_URL') && TS_ML_UPDATE_API_URL) {
            return TS_ML_UPDATE_API_URL;
        }
        
        // Prioridade 2: Opção do plugin (configurável nas settings)
        $settings = get_option('ts_ml_settings', array());
        if (isset($settings['update_api_url']) && !empty($settings['update_api_url'])) {
            return $settings['update_api_url'];
        }
        
        // Prioridade 3: Extrair do Update URI do header do plugin
        $update_uri = get_plugin_data(TS_ML_PLUGIN_FILE)['UpdateURI'] ?? '';
        if ($update_uri) {
            $update_uri = rtrim($update_uri, '/');
            
            // Se já é uma URL completa de API (standalone ou REST), usar diretamente
            if (strpos($update_uri, '/wp-json/') !== false || 
                strpos($update_uri, '/api/') !== false || 
                strpos($update_uri, '.php') !== false) {
                return $update_uri;
            }
            
            // Converter Update URI padrão para URL da API REST
            // Ex: https://seusite.com/updates/ts-ml-integration
            // Para: https://seusite.com/wp-json/ts-ml/v1/updates
            $parts = parse_url($update_uri);
            if ($parts) {
                $scheme = isset($parts['scheme']) ? $parts['scheme'] : 'https';
                $host = isset($parts['host']) ? $parts['host'] : '';
                return $scheme . '://' . $host . '/wp-json/ts-ml/v1/updates';
            }
        }
        
        // Fallback: Retorna false se não configurado (desabilita atualizações automáticas)
        // Configure Update URI no cabeçalho do plugin ou defina TS_ML_UPDATE_API_URL
        return false;
    }
    
    /**
     * Initialize hooks
     */
    private function init() {
        // Hook into WordPress update system
        add_filter('pre_set_site_transient_update_plugins', array($this, 'check_update'));
        
        // Hook for plugin information (changelog, etc)
        add_filter('plugins_api', array($this, 'plugin_info'), 10, 3);
        
        // Hook after update
        add_action('upgrader_process_complete', array($this, 'after_update'), 10, 2);
        
        // Add license key to update check
        add_filter('http_request_args', array($this, 'add_license_to_request'), 10, 2);
    }
    
    /**
     * Get license key from settings
     */
    private function get_license_key() {
        // Get from plugin settings
        $settings = get_option('ts_ml_settings', array());
        return isset($settings['license_key']) ? $settings['license_key'] : '';
    }
    
    /**
     * Check for updates
     * 
     * This is called by WordPress automatically!
     */
    public function check_update($transient) {
        // Only check if transient is set
        if (empty($transient->checked)) {
            return $transient;
        }
        
        // Se API URL não está configurada, não verificar atualizações
        if (!$this->api_url) {
            return $transient;
        }
        
        // Get plugin info
        $plugin_info = $this->get_remote_version();
        
        if ($plugin_info && version_compare(TS_ML_VERSION, $plugin_info->version, '<')) {
            $obj = new stdClass();
            $obj->slug = $this->plugin_slug;
            $obj->plugin = $this->plugin_file;
            $obj->new_version = $plugin_info->version;
            $obj->url = $plugin_info->homepage;
            $obj->package = $plugin_info->download_url;
            $obj->icons = isset($plugin_info->icons) ? $plugin_info->icons : array();
            $obj->banners = isset($plugin_info->banners) ? $plugin_info->banners : array();
            $obj->banners_rtl = isset($plugin_info->banners_rtl) ? $plugin_info->banners_rtl : array();
            $obj->tested = isset($plugin_info->tested) ? $plugin_info->tested : '';
            $obj->requires_php = isset($plugin_info->requires_php) ? $plugin_info->requires_php : '';
            $obj->compatibility = isset($plugin_info->compatibility) ? $plugin_info->compatibility : new stdClass();
            
            $transient->response[$this->plugin_file] = $obj;
        }
        
        return $transient;
    }
    
    /**
     * Get remote version info
     */
    private function get_remote_version() {
        $cache_key = 'ts_ml_remote_version_' . md5($this->license_key);
        $version_info = get_transient($cache_key);
        
        if (false === $version_info) {
            $response = wp_remote_post($this->api_url, array(
                'timeout' => 10,
                'body' => array(
                    'action' => 'version_check',
                    'plugin' => $this->plugin_slug,
                    'version' => TS_ML_VERSION,
                    'license_key' => $this->license_key,
                    'site_url' => home_url(),
                    'wp_version' => get_bloginfo('version'),
                    'php_version' => PHP_VERSION,
                ),
                'headers' => array(
                    'Accept' => 'application/json'
                )
            ));
            
            if (is_wp_error($response)) {
                return false;
            }
            
            $body = wp_remote_retrieve_body($response);
            $version_info = json_decode($body);
            
            if ($version_info && isset($version_info->version)) {
                // Cache for 12 hours
                set_transient($cache_key, $version_info, 12 * HOUR_IN_SECONDS);
            } else {
                return false;
            }
        }
        
        return $version_info;
    }
    
    /**
     * Get plugin information for update screen
     */
    public function plugin_info($false, $action, $args) {
        // Only for our plugin
        if ($action !== 'plugin_information' || !isset($args->slug) || $args->slug !== $this->plugin_slug) {
            return $false;
        }
        
        $plugin_info = $this->get_remote_version();
        
        if (!$plugin_info) {
            return $false;
        }
        
        $args = new stdClass();
        $args->name = 'ToySport Mercado Livre Integration';
        $args->slug = $this->plugin_slug;
        $args->version = $plugin_info->version;
        $args->author = 'CONEXT';
        $args->author_profile = 'https://conext.com.br';
        $args->homepage = $plugin_info->homepage;
        $args->download_link = $plugin_info->download_url;
        $args->requires = isset($plugin_info->requires) ? $plugin_info->requires : '6.8';
        $args->tested = isset($plugin_info->tested) ? $plugin_info->tested : '6.8';
        $args->requires_php = isset($plugin_info->requires_php) ? $plugin_info->requires_php : '8.2';
        $args->last_updated = isset($plugin_info->last_updated) ? $plugin_info->last_updated : '';
        $args->sections = array(
            'description' => isset($plugin_info->sections->description) ? $plugin_info->sections->description : '',
            'installation' => isset($plugin_info->sections->installation) ? $plugin_info->sections->installation : '',
            'changelog' => isset($plugin_info->sections->changelog) ? $plugin_info->sections->changelog : '',
            'faq' => isset($plugin_info->sections->faq) ? $plugin_info->sections->faq : '',
        );
        
        if (isset($plugin_info->banners)) {
            $args->banners = (array) $plugin_info->banners;
        }
        
        if (isset($plugin_info->icons)) {
            $args->icons = (array) $plugin_info->icons;
        }
        
        return $args;
    }
    
    /**
     * Actions after update
     */
    public function after_update($upgrader_object, $options) {
        if ($options['action'] === 'update' && $options['type'] === 'plugin') {
            if (isset($options['plugins']) && in_array($this->plugin_file, $options['plugins'])) {
                // Clear cache
                delete_transient('ts_ml_remote_version_' . md5($this->license_key));
                
                // Notify server about successful update
                $this->notify_update_success();
                
                // Execute upgrade hooks
                do_action('ts_ml_updated', TS_ML_VERSION);
            }
        }
    }
    
    /**
     * Notify server about successful update
     */
    private function notify_update_success() {
        wp_remote_post($this->api_url, array(
            'timeout' => 5,
            'body' => array(
                'action' => 'update_success',
                'plugin' => $this->plugin_slug,
                'version' => TS_ML_VERSION,
                'license_key' => $this->license_key,
                'site_url' => home_url(),
            )
        ));
    }
    
    /**
     * Add license key to HTTP requests
     */
    public function add_license_to_request($args, $url) {
        if (strpos($url, $this->api_url) !== false) {
            $args['body']['license_key'] = $this->license_key;
        }
        return $args;
    }
}
