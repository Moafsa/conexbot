import re
import os

AFFILIATE_LINK = "http://localhost/go/9096bets"

CSS_INJECTION = """
<!-- CSS Original -->
<link rel="stylesheet" href="https://9096bets.com/template/cassino/252bet-sites/static/css/styles.css">
<!-- FontAwesome novo pro CORS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
body { margin: 0; padding: 0; background: #051670 !important; font-family: sans-serif; overflow-x: hidden; }
.side-menu { left: -100%; transition: left 0.3s ease; width: 280px; max-width: 80vw; position: fixed; height: 100vh; z-index: 9999; }
.side-menu.active { left: 0; }
.container { max-width: 768px; margin: 0 auto; overflow: hidden; background: #051670; min-height: 100vh; position: relative; box-shadow: 0 0 50px rgba(0,0,0,0.8); padding-top: 60px; padding-bottom: 70px; }
.header { width: 100%; max-width: 768px; position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 1000; margin: 0; }
.bottom-nav { width: 100%; max-width: 768px; position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 1000; margin: 0; }
.main-banner { width: 100% !important; background: linear-gradient(119deg, #e61ae7, #03297e) !important; }
</style>
"""

JS_INJECTION = """
<!-- Script Menu -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script>
$(document).ready(function() {
    $('.menu-button, .close-btn').click(function(e) {
        e.preventDefault();
        $('.side-menu').toggleClass('active');
    });
});
</script>
"""

def extract_body(html):
    match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if not match:
        return html
    return match.group(1)

def apply_overrides(content):
    # Fix paths
    content = content.replace('src="/pictures/', 'src="https://9096bets.com/pictures/')
    content = content.replace('href="/', 'href="https://9096bets.com/')
    
    # Fix broken affiliate links
    content = content.replace('https://t.jogo99.win/redirect/', AFFILIATE_LINK)
    # The original site might have /login/ or /redirect/ as internal links
    content = content.replace('https://9096bets.com/login/', AFFILIATE_LINK)
    
    # Fix Internal Page links for Sidebar and Navigation
    content = content.replace('https://9096bets.com/cassino/', 'http://localhost/cassino/')
    content = content.replace('https://9096bets.com/slots/', 'http://localhost/slots/')
    # For homepage loopbacks
    content = content.replace('href="https://9096bets.com/"', 'href="http://localhost/"')
    content = content.replace("href='https://9096bets.com'", "href='http://localhost/'")
    content = content.replace('href="https://9096bets.com"', 'href="http://localhost/"')
    
    # Menus to affiliate as requested
    # Removing hidden iframe and extra scripts
    content = re.sub(r'<iframe id="hidden-iframe".*?</iframe>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script.*?</script>', '', content, flags=re.DOTALL)
    
    return content

# 1. Process Cassino
with open('9096bets_cassino_dom.html', 'r', encoding='utf-8') as f:
    cassino_html = f.read()

body_cassino = extract_body(cassino_html)
body_cassino = apply_overrides(body_cassino)

php_cassino = f"<?php\n/* Template Name: Cassino Clone */\nget_header(); ?>\n{CSS_INJECTION}\n{body_cassino}\n{JS_INJECTION}\n<?php get_footer(); ?>\n"
with open('wp-content/themes/conexbot-theme/page-cassino.php', 'w', encoding='utf-8') as f:
    f.write(php_cassino)


# 2. Process Slots
with open('9096bets_slots_dom.html', 'r', encoding='utf-8') as f:
    slots_html = f.read()

body_slots = extract_body(slots_html)
body_slots = apply_overrides(body_slots)

php_slots = f"<?php\n/* Template Name: Slots Clone */\nget_header(); ?>\n{CSS_INJECTION}\n{body_slots}\n{JS_INJECTION}\n<?php get_footer(); ?>\n"
with open('wp-content/themes/conexbot-theme/page-slots.php', 'w', encoding='utf-8') as f:
    f.write(php_slots)


# 3. Fix Front Page sidebar color
with open('wp-content/themes/conexbot-theme/front-page.php', 'r', encoding='utf-8') as f:
    fp = f.read()
    
# Remover a forçação the background #051670 que eu apliquei, para herdar o roxo original
fp = fp.replace('background: #051670;', '') 
fp = fp.replace('background:#051670;', '')

# Fix href on front page
fp = fp.replace('href="https://9096bets.com/"', 'href="http://localhost/"')
fp = fp.replace('href="https://9096bets.com"', 'href="http://localhost/"')
fp = fp.replace('href="https://9096bets.com/cassino/"', 'href="http://localhost/cassino/"')
fp = fp.replace('href="https://9096bets.com/slots/"', 'href="http://localhost/slots/"')
fp = fp.replace('https://9096bets.com/login/', AFFILIATE_LINK)

with open('wp-content/themes/conexbot-theme/front-page.php', 'w', encoding='utf-8') as f:
    f.write(fp)

print("Sub-paginas criadas com sucesso. Front page consertada.")
