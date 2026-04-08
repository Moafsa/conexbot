<?php
define('WP_USE_THEMES', false);
require_once('../../../wp-load.php');

$openai = get_option('conext_writer_openai_key');
$gemini = get_option('conext_writer_gemini_key');

echo "OpenAI Key: " . (!empty($openai) ? "DEFINED" : "EMPTY") . "\n";
echo "Gemini Key: " . (!empty($gemini) ? "DEFINED" : "EMPTY") . "\n";
