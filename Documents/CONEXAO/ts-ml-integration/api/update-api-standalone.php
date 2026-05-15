<?php
/**
 * API de Atualizações TS-ML Integration (Standalone)
 * 
 * Este arquivo pode ser usado sem WordPress
 * Coloque em: https://seusite.com.br/api/update-api.php
 * 
 * CONFIGURE AS VARIÁVEIS ABAIXO CONFORME SEU SERVIDOR
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// ============================================
// CONFIGURAÇÕES - EDITE AQUI!
// ============================================

// Versão mais recente disponível
define('TS_ML_LATEST_VERSION', '1.1.0');

// URL base do seu site
define('TS_ML_SITE_URL', 'https://seusite.com.br');

// URL de download do ZIP (mude para seu servidor!)
define('TS_ML_DOWNLOAD_URL', TS_ML_SITE_URL . '/downloads/ts-ml-integration-' . TS_ML_LATEST_VERSION . '.zip');

// ============================================
// PROCESSAMENTO
// ============================================

// Aceitar apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('error' => 'Method not allowed'));
    exit;
}

// Obter dados da requisição
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$action = $input['action'] ?? '';
$plugin = $input['plugin'] ?? '';
$version = $input['version'] ?? '1.0.0';
$license_key = $input['license_key'] ?? '';
$site_url = $input['site_url'] ?? '';

// Validar plugin
if ($plugin !== 'ts-ml-integration') {
    http_response_code(400);
    echo json_encode(array('error' => 'Invalid plugin'));
    exit;
}

// Processar ação
switch ($action) {
    case 'version_check':
        handle_version_check($version, $license_key, $site_url);
        break;
        
    case 'update_success':
        // Log de atualização (opcional)
        log_update($site_url, $version);
        echo json_encode(array('success' => true));
        break;
        
    default:
        http_response_code(400);
        echo json_encode(array('error' => 'Invalid action'));
}

/**
 * Processar verificação de versão
 */
function handle_version_check($current_version, $license_key, $site_url) {
    $latest_version = TS_ML_LATEST_VERSION;
    
    // Verificar se há atualização disponível
    if (version_compare($current_version, $latest_version, '>=')) {
        echo json_encode(array(
            'version' => $latest_version,
            'update_available' => false
        ));
        return;
    }
    
    // Validar license (se necessário)
    // Para plugin gratuito, pode pular esta validação
    if (!empty($license_key)) {
        if (!validate_license($license_key, $site_url)) {
            http_response_code(403);
            echo json_encode(array('error' => 'Invalid or expired license'));
            return;
        }
    }
    
    // Retornar informações de atualização
    echo json_encode(array(
        'version' => $latest_version,
        'update_available' => true,
        'homepage' => TS_ML_SITE_URL,
        'download_url' => TS_ML_DOWNLOAD_URL,
        'requires' => '6.8',
        'tested' => '6.8',
        'requires_php' => '8.2',
        'last_updated' => date('Y-m-d'),
        'sections' => array(
            'description' => '<p>Integração completa entre WooCommerce e Mercado Livre com sincronização bidirecional, gestão de pedidos, mensagens, envios e muito mais.</p>',
            'changelog' => get_changelog($latest_version),
            'installation' => '<p>Instale via WordPress Admin > Plugins > Adicionar Novo > Enviar Plugin</p>',
        ),
    ));
}

/**
 * Validar license key
 * 
 * Para plugin gratuito: sempre retorna true
 * Para plugin comercial: implemente validação aqui
 */
function validate_license($license_key, $site_url) {
    // PLUGIN GRATUITO: Sempre válido
    if (empty($license_key)) {
        return true;
    }
    
    // PLUGIN COMERCIAL: Implementar validação
    // Exemplo básico:
    // - Conectar ao banco de dados
    // - Verificar se license existe e está ativa
    // - Verificar se não expirou
    // - Verificar limite de sites
    
    // Por enquanto, retorna true (implemente sua lógica)
    return true;
}

/**
 * Obter changelog da versão
 */
function get_changelog($version) {
    $changelogs = array(
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
    
    return isset($changelogs[$version]) ? $changelogs[$version] : '';
}

/**
 * Log de atualização (opcional)
 */
function log_update($site_url, $version) {
    // Log simples em arquivo
    $log_file = __DIR__ . '/update-log.txt';
    $log_entry = date('Y-m-d H:i:s') . " - {$site_url} atualizado para versão {$version}\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);
}
