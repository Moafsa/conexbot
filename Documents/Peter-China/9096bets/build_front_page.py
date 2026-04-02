import re

with open('9096bets_dom.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Trocar URLs relativas
html = html.replace('src="/pictures/', 'src="https://9096bets.com/pictures/')
html = html.replace('href="/', 'href="https://9096bets.com/')

# Extrair body
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
if body_match:
    body_content = body_match.group(1)
    
    # Remover iframes escondidos
    body_content = re.sub(r'<iframe id="hidden-iframe".*?</iframe>', '', body_content, flags=re.DOTALL)
    
    # Substituir links pra # pra evitar navegação indesejada se não for o redirect
    # Mas já temos os URLs originais.
    
    # Injetar o PHP loop de AI news antes da bottom-nav
    ai_news_php = """
    <!-- AI News Integration -->
    <div class="blog-ai-section" style="padding: 20px; margin-top: 30px; background: rgba(255,255,255,0.03); border-radius: 15px;">
        <h2 style="color: #fff; text-align: center; margin-bottom: 15px; font-size: 20px;">Últimas Notícias VIP</h2>
        <?php
        $ai_query = new WP_Query(array('post_type' => 'post', 'posts_per_page' => 5));
        if ( $ai_query->have_posts() ) :
            while ( $ai_query->have_posts() ) :
                $ai_query->the_post();
                echo '<div class="blog-ai-post" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 15px 0;">';
                echo '<h3><a href="'.get_permalink().'" style="color: #db0df6; text-decoration: none; font-size: 18px; font-weight: bold;">'.get_the_title().'</a></h3>';
                echo '<div style="color: #aaa; font-size: 14px; margin-top: 5px;">';
                the_excerpt();
                echo '</div></div>';
            endwhile;
            wp_reset_postdata();
        else :
            echo '<p style="color:#aaa; text-align:center;">Nenhuma novidade encontrada no momento. O Agente IA publicará em breve.</p>';
        endif;
        ?>
    </div>
"""

    body_content = body_content.replace('<div class="bottom-nav">', ai_news_php + '\n<div class="bottom-nav">')
    
    # Remover scripts nativos de tracking que atrapalham
    body_content = re.sub(r'<script.*?</script>', '', body_content, flags=re.DOTALL)
    
    # Adicionar o script do menu e as calls do WP
    php_content = f"""<?php get_header(); ?>
<!-- CSS Original -->
<link rel="stylesheet" href="https://9096bets.com/template/cassino/252bet-sites/static/css/styles.css">
<!-- FontAwesome novo pro CORS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
body {{ margin: 0; padding: 0; background: #051670 !important; font-family: sans-serif; overflow-x: hidden; }}
.side-menu {{ left: -100%; transition: left 0.3s ease; width: 280px; max-width: 80vw; position: fixed; height: 100vh; z-index: 9999; background: #051670; }}
.side-menu.active {{ left: 0; }}
.container {{ max-width: 100vw; overflow-x: hidden; }}
</style>

{body_content}

<!-- Script Menu -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script>
$(document).ready(function() {{
    $('.menu-button, .close-btn, .header-login-btn').click(function(e) {{
        e.preventDefault();
        $('.side-menu').toggleClass('active');
    }});
}});
</script>
<?php get_footer(); ?>
"""

    with open('wp-content/themes/conexbot-theme/front-page.php', 'w', encoding='utf-8') as f:
        f.write(php_content)

