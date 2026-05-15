<?php
/**
 * Update API Endpoint
 * 
 * This file should be placed on your server (not in the plugin)
 * It serves update information to WordPress
 * 
 * Place this at: https://toysport.com.br/wp-json/ts-ml/v1/updates
 * Or create a standalone PHP file that returns JSON
 *
 * @package TS_ML_Integration
 */

// This is an example of what your API endpoint should return
// You can create this as a WordPress REST API endpoint or standalone PHP file

/**
 * Example: WordPress REST API Endpoint
 * Add this to your theme's functions.php or a custom plugin
 */
add_action('rest_api_init', function() {
    register_rest_route('ts-ml/v1', '/updates', array(
        'methods' => 'POST',
        'callback' => 'ts_ml_update_api_handler',
        'permission_callback' => '__return_true'
    ));
});

function ts_ml_update_api_handler($request) {
    $action = $request->get_param('action');
    $plugin = $request->get_param('plugin');
    $version = $request->get_param('version');
    $license_key = $request->get_param('license_key');
    $site_url = $request->get_param('site_url');
    
    // Validate license key (for commercial plugins)
    $license_valid = ts_ml_validate_license($license_key, $site_url);
    
    if (!$license_valid && $action === 'version_check') {
        return new WP_Error('invalid_license', 'License key is invalid or expired', array('status' => 403));
    }
    
    switch ($action) {
        case 'version_check':
            return ts_ml_get_update_info($version, $license_key);
            
        case 'update_success':
            // Log successful update
            ts_ml_log_update($site_url, $version);
            return array('success' => true);
            
        default:
            return new WP_Error('invalid_action', 'Invalid action', array('status' => 400));
    }
}

/**
 * Get update information
 */
function ts_ml_get_update_info($current_version, $license_key) {
    // Get latest version from database or config file
    $latest_version = '1.1.0'; // This should come from your database/config
    
    // Check if update is available
    if (version_compare($current_version, $latest_version, '>=')) {
        return array(
            'version' => $latest_version,
            'update_available' => false
        );
    }
    
    // Return update information
    return array(
        'version' => $latest_version,
        'update_available' => true,
        'homepage' => 'https://toysport.com.br/plugin/ts-ml-integration',
        'download_url' => ts_ml_get_download_url($license_key, $latest_version),
        'requires' => '6.8',
        'tested' => '6.8',
        'requires_php' => '8.2',
        'last_updated' => '2026-01-20',
        'sections' => array(
            'description' => '<p>Integração completa entre WooCommerce e Mercado Livre...</p>',
            'changelog' => ts_ml_get_changelog($latest_version),
            'installation' => '<p>Instale via WordPress Admin > Plugins > Adicionar Novo</p>',
        ),
        'banners' => array(
            'low' => 'https://toysport.com.br/images/plugin-banner-772x250.jpg',
            'high' => 'https://toysport.com.br/images/plugin-banner-1544x500.jpg',
        ),
        'icons' => array(
            'default' => 'https://toysport.com.br/images/plugin-icon-256x256.png',
        ),
    );
}

/**
 * Validate license key
 */
function ts_ml_validate_license($license_key, $site_url) {
    // For free plugins, you can skip this
    // For commercial plugins, validate against your license server
    
    if (empty($license_key)) {
        // Free version - allow updates
        return true;
    }
    
    // Check license in database
    // This is a simplified example - implement your own license validation
    global $wpdb;
    $table = $wpdb->prefix . 'ts_ml_licenses';
    
    $license = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE license_key = %s AND status = 'active'",
        $license_key
    ));
    
    if (!$license) {
        return false;
    }
    
    // Check if license is expired
    if (isset($license->expires_at) && strtotime($license->expires_at) < time()) {
        return false;
    }
    
    // Check site limit (if applicable)
    if (isset($license->site_limit)) {
        $sites = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table WHERE license_key = %s",
            $license_key
        ));
        
        if ($sites >= $license->site_limit) {
            return false;
        }
    }
    
    return true;
}

/**
 * Get download URL (with license validation)
 */
function ts_ml_get_download_url($license_key, $version) {
    // For free plugins, return direct download URL
    if (empty($license_key)) {
        return 'https://toysport.com.br/downloads/ts-ml-integration-' . $version . '.zip';
    }
    
    // For commercial plugins, generate signed download URL
    $token = wp_generate_password(32, false);
    
    // Store token temporarily (expires in 1 hour)
    set_transient('ts_ml_download_' . $token, array(
        'license_key' => $license_key,
        'version' => $version,
        'expires' => time() + HOUR_IN_SECONDS
    ), HOUR_IN_SECONDS);
    
    return add_query_arg(array(
        'token' => $token,
        'version' => $version
    ), 'https://toysport.com.br/download/ts-ml-integration');
}

/**
 * Get changelog
 */
function ts_ml_get_changelog($version) {
    $changelog = array(
        '1.1.0' => '
            <h4>Versão 1.1.0 - 2026-01-20</h4>
            <ul>
                <li><strong>Novo:</strong> Suporte a variações de produtos</li>
                <li><strong>Novo:</strong> Sincronização melhorada de estoque</li>
                <li><strong>Correção:</strong> Bug na sincronização de preços</li>
                <li><strong>Melhoria:</strong> Performance otimizada</li>
            </ul>
        ',
        '1.0.0' => '
            <h4>Versão 1.0.0 - 2026-01-16</h4>
            <ul>
                <li>Lançamento inicial</li>
            </ul>
        ',
    );
    
    return isset($changelog[$version]) ? $changelog[$version] : '';
}

/**
 * Log successful update
 */
function ts_ml_log_update($site_url, $version) {
    // Log update for analytics
    global $wpdb;
    $table = $wpdb->prefix . 'ts_ml_update_logs';
    
    $wpdb->insert($table, array(
        'site_url' => $site_url,
        'version' => $version,
        'updated_at' => current_time('mysql')
    ));
}
