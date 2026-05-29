<?php
/**
 * Conext Writer Auto Updater Class
 * Handles automatic update checks from remote server
 *
 * @package Conext_Writer
 */

if (!defined('ABSPATH')) {
    exit;
}

class Conext_Writer_Auto_Updater {
    
    private $api_url = 'https://app.conext.click/api/v1/ml/update';
    private $plugin_slug = 'conext-writer';
    private $plugin_file;

    public function __construct($plugin_file) {
        $this->plugin_file = $plugin_file;
        $this->init();
    }

    private function init() {
        add_filter('pre_set_site_transient_update_plugins', array($this, 'check_update'));
        add_filter('plugins_api', array($this, 'plugin_info'), 10, 3);
    }

    public function check_update($transient) {
        if (empty($transient->checked)) {
            return $transient;
        }

        $plugin_info = $this->get_remote_version();

        if ($plugin_info && version_compare(CONEXT_WRITER_VERSION, $plugin_info->version, '<')) {
            $obj = new stdClass();
            $obj->slug = $this->plugin_slug;
            $obj->plugin = $this->plugin_file;
            $obj->new_version = $plugin_info->version;
            $obj->url = $plugin_info->homepage;
            $obj->package = $plugin_info->download_url;
            
            $transient->response[$this->plugin_file] = $obj;
        }

        return $transient;
    }

    private function get_remote_version() {
        $cache_key = 'conext_writer_remote_version';
        $version_info = get_transient($cache_key);

        if (false === $version_info) {
            $response = wp_remote_post($this->api_url, array(
                'timeout' => 10,
                'body' => array(
                    'action' => 'version_check',
                    'plugin' => $this->plugin_slug,
                    'version' => CONEXT_WRITER_VERSION,
                    'site_url' => home_url(),
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
                set_transient($cache_key, $version_info, 12 * HOUR_IN_SECONDS);
            } else {
                return false;
            }
        }

        return $version_info;
    }

    public function plugin_info($false, $action, $args) {
        if ($action !== 'plugin_information' || !isset($args->slug) || $args->slug !== $this->plugin_slug) {
            return $false;
        }

        $plugin_info = $this->get_remote_version();

        if (!$plugin_info) {
            return $false;
        }

        $args = new stdClass();
        $args->name = 'Conext Writer';
        $args->slug = $this->plugin_slug;
        $args->version = $plugin_info->version;
        $args->author = 'Conext';
        $args->author_profile = 'https://app.conext.click';
        $args->homepage = $plugin_info->homepage;
        $args->download_link = $plugin_info->download_url;
        $args->sections = array(
            'description' => isset($plugin_info->sections->description) ? $plugin_info->sections->description : '',
            'changelog' => isset($plugin_info->sections->changelog) ? $plugin_info->sections->changelog : '',
        );

        return $args;
    }
}
