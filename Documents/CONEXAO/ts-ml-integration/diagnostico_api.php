<?php
/**
 * ML API Connection Tester
 */
define('WP_USE_THEMES', false);
require_once('../../../wp-load.php');

if (!current_user_can('manage_woocommerce')) {
    wp_die('Acesso negado.');
}

header('Content-Type: text/plain; charset=utf-8');

echo "--- Diagnóstico da API Mercado Livre ---\n\n";

global $wpdb;
$table_accounts = $wpdb->prefix . 'ts_ml_accounts';
$accounts = $wpdb->get_results("SELECT id, account_name, country FROM $table_accounts WHERE is_active = 1");

if (empty($accounts)) {
    echo "Nenhuma conta ativa encontrada.\n";
    exit;
}

$api_handler = TS_ML_API_Handler::instance();

foreach ($accounts as $account) {
    echo "Testando conta: {$account->account_name} (ID: {$account->id})\n";
    
    $token = $api_handler->get_valid_token($account->id);
    if (is_wp_error($token)) {
        echo "ERRO ao obter token: " . $token->get_error_message() . "\n";
        continue;
    }
    
    echo "Token obtido com sucesso. (Prefixo: " . substr($token, 0, 10) . "...)\n";
    
    // 1. Get User Info
    echo "Chamando /users/me...\n";
    $user_info = $api_handler->api_request('/users/me', 'GET', array(), $token);
    if (is_wp_error($user_info)) {
        echo "ERRO /users/me: " . $user_info->get_error_message() . " (Status: " . ($user_info->get_error_data()['status'] ?? 'N/A') . ")\n";
    } else {
        echo "Sucesso: Olá, " . ($user_info['nickname'] ?? 'User') . " (ID: " . $user_info['id'] . ")\n";
        
        $user_id = $user_info['id'];
        
        // 2. Search Items
        echo "Chamando /users/{$user_id}/items/search...\n";
        $params = array('seller_id' => $user_id, 'limit' => 5);
        $search = $api_handler->api_request("/users/{$user_id}/items/search", 'GET', $params, $token);
        
        if (is_wp_error($search)) {
            echo "ERRO /items/search: " . $search->get_error_message() . " (Status: " . ($search->get_error_data()['status'] ?? 'N/A') . ")\n";
            echo "Raw Response: " . print_r($search, true) . "\n";
        } else {
            echo "Sucesso: Encontrados " . ($search['paging']['total'] ?? 0) . " itens.\n";
            if (!empty($search['results'])) {
                echo "Alguns IDs: " . implode(', ', $search['results']) . "\n";
            }
        }

        // 3. Test Global Search endpoint
        $site_id = $user_info['site_id'] ?? 'MLB';
        echo "Chamando /sites/{$site_id}/search?q=teste (COM TOKEN)...\n";
        $global_search = $api_handler->api_request("/sites/{$site_id}/search", 'GET', array('q' => 'teste', 'limit' => 1), $token);
        if (is_wp_error($global_search)) {
            echo "ERRO Global Search: " . $global_search->get_error_message() . " (Status: " . ($global_search->get_error_data()['status'] ?? 'N/A') . ")\n";
            // Check if we have more info
            if (isset($global_search->get_error_data()['body'])) {
                echo "Body: " . $global_search->get_error_data()['body'] . "\n";
            }
        } else {
            echo "Sucesso Global Search: " . ($global_search['paging']['total'] ?? 0) . " resultados encontrados.\n";
        }

        echo "Chamando /sites/{$site_id}/search?q=teste (SEM TOKEN)...\n";
        $global_search_no_token = $api_handler->api_request("/sites/{$site_id}/search", 'GET', array('q' => 'teste', 'limit' => 1), '');
        if (is_wp_error($global_search_no_token)) {
            echo "ERRO Global Search (Sem Token): " . $global_search_no_token->get_error_message() . " (Status: " . ($global_search_no_token->get_error_data()['status'] ?? 'N/A') . ")\n";
             if (isset($global_search_no_token->get_error_data()['body'])) {
                echo "Body: " . $global_search_no_token->get_error_data()['body'] . "\n";
            }
        } else {
            echo "Sucesso Global Search (Sem Token): " . ($global_search_no_token['paging']['total'] ?? 0) . " resultados encontrados.\n";
        }

        // 4. Test Public Item access
        echo "Chamando /items/MLB3531940984 (PÚBLICO)...\n";
        $public_item = $api_handler->api_request("/items/MLB3531940984", 'GET', array(), '');
        if (is_wp_error($public_item)) {
            echo "ERRO Item Público: " . $public_item->get_error_message() . " (Status: " . ($public_item->get_error_data()['status'] ?? 'N/A') . ")\n";
            if (isset($public_item->get_error_data()['body'])) {
                echo "Body: " . $public_item->get_error_data()['body'] . "\n";
            }
        } else {
            echo "Sucesso Item Público: " . ($public_item['title'] ?? 'Sem título') . "\n";
        }
    }
    echo "----------------------------------------\n\n";
}
