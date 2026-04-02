import re

# Home Page SEO
HOME_SEO = """<div class="game-card tiger-theme" style="flex: auto;max-width: fit-content;padding: 10px;width: 100%; max-width: 100%;">
    <h1 class="ftwp-heading">9096bets: A Plataforma de Apostas Esportivas e Cassino Mais Confiável do Brasil 🏆</h1>
    <p>Se você busca a melhor <strong>plataforma de apostas online</strong> que garanta pagamentos imediatos via PIX e uma biblioteca completa de <em>slots que pagam de verdade</em>, a <a href="http://localhost/">9096bets</a> é o seu destino definitivo. Nós construímos um ecossistema projetado especificamente para o público brasileiro, combinando tecnologia de ponta, estabilidade de conexão e as licenças internacionais de segurança mais rigorosas do mercado de iGaming.</p>
    <img src="https://9096bets.com/pictures/casino/kO3sSg18.png" alt="Tela inicial do aplicativo móvel 9096bets com jogos VIP e bônus" class="content-img">
    
    <h2>Jogue Caça-Níqueis e Slots Com Alto RTP 🎰</h2>
    <p>Diferente de sistemas não regulados, nosso catálogo traz exclusividades diretas de provedores globais como PG Soft (criadora do famoso <strong>Jogo do Tigrinho</strong> - Fortune Tiger) e Pragmatic Play. Isso significa que na 9096bets você encontra <strong>jogos de slots com altas taxas de RTP (Retorno ao Jogador)</strong>, volatilidade justa, multiplicadores reais e rodadas grátis sem travas em saques.</p>
    
    <img src="https://9096bets.com/pictures/casino/K7V53l03.png" alt="Roleta e baralho de cartas do Live Casino da 9096bets Brasil" class="content-img">
    
    <h2>Cassino ao Vivo e Apostas Esportivas com Saque Rápido 🏦</h2>
    <p>Experimente a verdadeira adrenalina da nossa área de <strong>Live Casino (Dealers ao vivo em português)</strong>: sinta a emoção do Blackjack, Roleta Brasileira e Roleta VIP como se estivesse em Las Vegas. Além disso, nossos algoritmos processam suas vitórias na 9096bets instantaneamente. Ganhou grande? Solicite seu saque e receba o dinheiro diretamente na sua conta bancária em minutos.</p>
</div>"""

# Cassino SEO
CASSINO_SEO = """<div class="game-card tiger-theme" style="flex: auto;max-width: fit-content;padding: 10px;width: 100%; max-width: 100%;">
    <h1 class="ftwp-heading">Experiência Premium: Cassino ao Vivo 9096bets no Brasil 🎲</h1>
    <p>A seção oficial de <a href="http://localhost/cassino/">Cassino da 9096bets</a> redefiniu o conceito de imersão de mesa no Brasil. Ao invés de robôs programados, você aposta frente a frente com dealers reais profissionais, 24 horas por dia, 7 dias por semana. Com transmissões em Full HD e estúdios ao vivo, sinta a roleta girar e o baralho ser distribuído como nos resorts mais luxuosos do globo.</p>
    
    <img src="https://9096bets.com/pictures/casino/fj1a8z5H.png" alt="Torneios de cassino ao vivo e jogos de mesa da plataforma 9096bets" class="content-img">

    <h2>Os Melhores Jogos de Mesa e Roleta ao Vivo ♠️</h2>
    <p>Não importa se a sua paixão é Baccarat de alta velocidade, Poker ou as dezenas de modalidades de <strong>Roleta Brasileira</strong>. O cassino ao vivo 9096bets foi desenhado para garantir equidade total: com cartas reais físicas e dados físicos auditados. Escolha mesas com apostas mínimas acessíveis ou entre em nossas <em>Tendas VIP exclusivas</em> desenhadas para os grandes jogadores (High Rollers) que procuram maiores limites de apostas.</p>
    
    <img src="https://9096bets.com/pictures/casino/14bkuWTL.webp" alt="Fichas de apostas em mesa VIP com dealers dedicados no Brasil" class="content-img">
    
    <h2>Torneios de Cassino e Campeonatos Exclusivos 💰</h2>
    <p>Participe dos gigantescos torneios de classificação (Leaderboards) que acontecem toda semana dentro do ambiente de Live Casino. Concorra contra toda a rede para dividir prêmios acumulados que podem passar dos milhões de reais, com saques validados e processados na hora pelo time oficial da 9096bets!</p>
</div>"""

# Slots SEO
SLOTS_SEO = """<div class="game-card tiger-theme" style="flex: auto;max-width: fit-content;padding: 10px;width: 100%; max-width: 100%;">
    <h1 class="ftwp-heading">Slots Pagando Dinheiro Real na 9096bets 🍀</h1>
    <p>A categoria oficial de <a href="http://localhost/slots/">Slots da 9096bets</a> reúne os mais explosivos jogos caça-níqueis do universo iGaming. Pare de apostar no escuro! O nosso site apresenta as linhas diretas e originais dos jogos de slots mais consagrados da atualidade, como o <strong>Fortune Tiger</strong> (Jogo do Tigre), <strong>Fortune Rabbit</strong>, e os mega lançamentos do Fortune Dragon. Garantia de algoritmos limpos, sem manipulação de RNG (Gerador de Números Aleatórios).</p>
    
    <img src="https://9096bets.com/pictures/casino/86I69O4l.webp" alt="Grade de caça-níqueis exclusivos PG Soft, Pragmatic Play e Fortune Series na 9096bets" class="content-img">

    <h2>Variedade Absoluta: De Cilindros Clássicos aos MegaWays 🌋</h2>
    <p>Com milhares de opções em nosso catálogo, nossas parcerias estratégicas vão muito além do básico. Teste a sua sorte operando os visuais hipermodernos dos <strong>Video Slots 3D</strong> ou aposte com multiplicadores massivos dentro do sistema *MegaWays*, onde uma única rodada pode conectar dezenas de milhares de moedas em cascata!</p>

    <img src="https://9096bets.com/pictures/casino/A104z4K6.jpg" alt="Máquinas de jackpot diário revelando vitória milionária em caça-níquel" class="content-img">

    <h2>Jackpots Acumulados e Retiradas Descomplicadas 💸</h2>
    <p>Ao invés de se contentar apenas com bônus virtuais amarrados em <em>rollovers impossíveis</em>, jogar nos Slots da 9096bets permite que você almeje a queda dos grandes <strong>Jackpots Diários (Prêmios Acumulados Milionários)</strong>. E a promessa continua: caso os bônus Scatters conectem na sua tela ou sua rodada grátis atinja fama mundial, a retirada do seu ganho será sempre instantânea via PIX e com nota máxima em segurança criptográfica blindada contra fraudes.</p>
</div>"""

def inject_seo(filename, new_seo_content):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Usando regex para encontrar e substituir TUDO que houver dentro desse div específico
    # Cuidado: O regex busca a div tiger-theme e pega tudo até o próximo fechamento respectivo.
    pattern = r'<div class="game-card tiger-theme"[^>]*>.*?</div>'
    match = re.search(pattern, content, flags=re.DOTALL)
    
    if match:
        content = content[:match.start()] + new_seo_content + content[match.end():]
        # Remover os width extras
        content = content.replace('style="flex: auto;max-width: fit-content;padding: 10px;width: 100%; max-width: 100%;', 'style="flex: auto;padding: 0;width: 100%; max-width: 100%; margin-top:20px;')
    else:
        print(f"Alvo não encontrado em {filename}")
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"{filename} SEO atualizado!")


# 1. Front Page
inject_seo('wp-content/themes/conexbot-theme/front-page.php', HOME_SEO)

# 2. Cassino
inject_seo('wp-content/themes/conexbot-theme/page-cassino.php', CASSINO_SEO)

# 3. Slots
inject_seo('wp-content/themes/conexbot-theme/page-slots.php', SLOTS_SEO)
