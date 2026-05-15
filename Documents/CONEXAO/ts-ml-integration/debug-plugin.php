<?php
/**
 * Debug file - Remove after fixing
 * Access: wp-content/plugins/ts-ml-integration/debug-plugin.php
 */

// Load WordPress
require_once('../../../wp-load.php');

echo "<h1>Debug Plugin TS-ML Integration</h1>";

// Check if plugin file exists
$plugin_file = __DIR__ . '/ts-ml-integration.php';
echo "<p><strong>Plugin file exists:</strong> " . (file_exists($plugin_file) ? 'SIM' : 'NÃO') . "</p>";

// Check file permissions
if (file_exists($plugin_file)) {
    echo "<p><strong>File readable:</strong> " . (is_readable($plugin_file) ? 'SIM' : 'NÃO') . "</p>";
    
    // Try to read plugin header
    $plugin_data = get_file_data($plugin_file, array(
        'Name' => 'Plugin Name',
        'Version' => 'Version',
        'Author' => 'Author'
    ));
    
    echo "<p><strong>Plugin Name:</strong> " . ($plugin_data['Name'] ?? 'NÃO ENCONTRADO') . "</p>";
    echo "<p><strong>Version:</strong> " . ($plugin_data['Version'] ?? 'NÃO ENCONTRADO') . "</p>";
}

// Check if plugin is in WordPress plugins list
$all_plugins = get_plugins();
echo "<h2>Plugins Detectados:</h2>";
echo "<ul>";
foreach ($all_plugins as $plugin_path => $plugin_info) {
    if (strpos($plugin_path, 'ts-ml-integration') !== false) {
        echo "<li style='color: green;'><strong>" . $plugin_info['Name'] . "</strong> - " . $plugin_path . "</li>";
    } else {
        echo "<li>" . $plugin_info['Name'] . "</li>";
    }
}
echo "</ul>";

// Check for PHP errors
echo "<h2>Verificação de Erros PHP:</h2>";
$error_log = ini_get('error_log');
echo "<p><strong>Error Log:</strong> " . ($error_log ?: 'Padrão do sistema') . "</p>";

// Try to include plugin file
echo "<h2>Teste de Inclusão:</h2>";
try {
    if (file_exists($plugin_file)) {
        ob_start();
        include_once($plugin_file);
        $output = ob_get_clean();
        echo "<p style='color: green;'>✓ Arquivo incluído com sucesso</p>";
        if ($output) {
            echo "<p><strong>Output:</strong> " . htmlspecialchars($output) . "</p>";
        }
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Erro: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p style='color: red;'>✗ Erro Fatal: " . $e->getMessage() . "</p>";
    echo "<p><strong>Arquivo:</strong> " . $e->getFile() . "</p>";
    echo "<p><strong>Linha:</strong> " . $e->getLine() . "</p>";
}
