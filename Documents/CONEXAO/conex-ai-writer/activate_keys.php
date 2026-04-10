<?php
// Load WordPress environment
require_once('/var/www/html/wp-load.php');

$openai = '';
$gemini = '';

update_option('conex_ai_openai_key', $openai);
update_option('conex_ai_gemini_key', $gemini);

echo "API Keys configured successfully.\n";
