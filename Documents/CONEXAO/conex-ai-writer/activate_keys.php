<?php
// Load WordPress environment
require_once('/var/www/html/wp-load.php');

$openai = 'YOUR_OPENAI_API_KEY_HERE';
$gemini = 'YOUR_GEMINI_API_KEY_HERE';

update_option('conex_ai_openai_key', $openai);
update_option('conex_ai_gemini_key', $gemini);

echo "API Keys configured successfully.\n";
