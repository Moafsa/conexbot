with open('wp-content/themes/conexbot-theme/front-page.php', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('src="/pictures/', 'src="https://9096bets.com/pictures/')
content = content.replace('href="/', 'href="https://9096bets.com/')
with open('wp-content/themes/conexbot-theme/front-page.php', 'w', encoding='utf-8') as f:
    f.write(content)
