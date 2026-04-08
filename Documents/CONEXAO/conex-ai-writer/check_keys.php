<?php
define('WP_USE_THEMES', false);
require_once('../../../wp-load.php');

$openai = get_option('conex_ai_openai_key');
$gemini = get_option('conex_ai_gemini_key');

echo "OpenAI Key: " . (!empty($openai) ? "DEFINED" : "EMPTY") . "\n";
echo "Gemini Key: " . (!empty($gemini) ? "DEFINED" : "EMPTY") . "\n";
