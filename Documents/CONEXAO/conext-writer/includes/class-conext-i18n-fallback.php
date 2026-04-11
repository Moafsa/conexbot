<?php

if (!defined('ABSPATH')) {
    exit;
}

class Conext_i18n_Fallback {
    
    private static $translations = [
        'en_US' => [
            'Uso de Créditos Mensais' => 'Monthly Credit Usage',
            'créditos restantes de' => 'credits remaining of',
            'Licenciamento' => 'Licensing',
            'Configurações' => 'Settings',
            'Ativar Licença Premium' => 'Activate Premium License',
            'Controle total sobre a orquestração de 5 agentes e SEO Nível Yoast.' => 'Full control over 5-agent orchestration and Yoast-level SEO.',
            'Ativar Agora' => 'Activate Now',
            'Não tem uma licença ou quer fazer Upgrade?' => 'Don\'t have a license or want to Upgrade?',
            'mês' => 'month',
            'Posts/mês' => 'Posts/month',
            'Palavras' => 'Words',
            'Yoast SEO Nível Pro' => 'Yoast SEO Pro Level',
            'Assinar Plano' => 'Subscribe to Plan',
            'Carregando planos da plataforma... Se não aparecerem,' => 'Loading plans from the platform... If they don\'t appear,',
            'clique aqui' => 'click here',
            'OpenAI API Key' => 'OpenAI API Key',
            'Google Gemini API Key' => 'Google Gemini API Key',
            'Frequência de Postagens' => 'Posting Frequency',
            'A cada' => 'Every',
            'Hora(s)' => 'Hour(s)',
            'Dia(s)' => 'Day(s)',
            'Define quando a IA deve gerar um novo post automaticamente.' => 'Defines when the AI should automatically generate a new post.',
            'Assunto Principal' => 'Main Subject',
            'Notícias, Tendências e Dicas (Aleatórias)' => 'News, Trends and Tips (Random)',
            'Meus Produtos / Serviços (Via WooCommerce e Lista)' => 'My Products / Services (Via WooCommerce and List)',
            'Marque ambas para a IA sortear (50/50) a cada postagem.' => 'Check both for the AI to pick (50/50) for each post.',
            'Termos de Pesquisa Extras' => 'Extra Search Terms',
            'Ex: RPG, Ação, Playstation, Jogos de Tabuleiro, Poker...' => 'Ex: RPG, Action, Playstation, Board Games, Poker...',
            'Obriga a IA a focar nesses nichos durante a criação dos posts e das imagens.' => 'Forces the AI to focus on these niches during post and image creation.',
            'Meus Produtos/Serviços' => 'My Products/Services',
            'Se você escolheu \'Meus Produtos/Serviços\', descreva aqui os produtos ou temas que quer abordar...' => 'If you chose \'My Products/Services\', describe the products or themes you want to cover here...',
            'Explique o que você vende ou os assuntos específicos que deseja tratar. A IA focará neles.' => 'Explain what you sell or the specific topics you want to cover. The AI will focus on them.',
            'Tom de Escrita' => 'Writing Tone',
            'Persuasivo e Vendedor' => 'Persuasive and Sales-oriented',
            'Informativo e Direto' => 'Informative and Direct',
            'Descontraído e Casual' => 'Relaxed and Casual',
            'Agressivo (Gatilhos Mentais)' => 'Aggressive (Mental Triggers)',
            'Tamanho Médio (Palavras)' => 'Average Size (Words)',
            'Curto (500-1000 palavras)' => 'Short (500-1000 words)',
            'Médio/Longo (1500-3000 palavras)' => 'Medium/Long (1500-3000 words)',
            'Muito Longo (3000-5000 palavras)' => 'Very Long (3000-5000 words)',
            'Número de Imagens' => 'Number of Images',
            'Máximo recomendado: 3 imagens (Evita limites de API).' => 'Recommended maximum: 3 images (Avoids API limits).',
            'Estilo das Imagens' => 'Image Style',
            '3D Render (Moderno e Vibrante)' => '3D Render (Modern and Vibrant)',
            'Fotorealista (Alta Qualidade)' => 'Photorealistic (High Quality)',
            'Ilustração Flat (Minimalista)' => 'Flat Illustration (Minimalist)',
            'Futurista / Cyberpunk (Neon)' => 'Futuristic / Cyberpunk (Neon)',
            'Isométrico (Limpo e Técnico)' => 'Isometric (Clean and Technical)',
            'Escolha como a IA deve "desenhar" as imagens do seu post.' => 'Choose how the AI should "draw" the images for your post.',
            'Fontes de Notícias ou RSS' => 'News Sources or RSS',
            'Cole URLs de fontes (uma por linha) ou deixe em branco para busca 100% automática' => 'Paste source URLs (one per line) or leave blank for 100% automatic search',
            'Insira a URL de um feed RSS, o link direto de um site/domínio, ou deixe em branco para o Agente pesquisar na Web livremente sobre os assuntos.' => 'Enter a RSS feed URL, a direct website link, or leave blank for the Agent to search the Web freely.',
            'Teste de Geração' => 'Generation Test',
            'Clique no botão abaixo para forçar o Orquestrador a pesquisar, escrever e publicar um post agora.' => 'Click the button below to force the Orchestrator to research, write and publish a post now.',
            'Gerar Post AGORA (Manual)' => 'Generate Post NOW (Manual)',
            'Post gerado e publicado com sucesso!' => 'Post successfully generated and published!',
            'Erro na geração do post. Verifique os logs.' => 'Error generating post. Check the logs.',
            'Erro: Chaves de API não configuradas ou inválidas.' => 'Error: API keys not configured or invalid.',
            'Licença ativada com sucesso!' => 'License activated successfully!',
            'Chave de licença inválida.' => 'Invalid license key.',
            'Você atingiu o limite máximo de 5 posts no período de teste (trial). É necessário pagar a sua fatura para liberar o restante dos posts do seu plano.' => 'You have reached the maximum limit of 5 posts during the trial period. You must pay your invoice to unlock the remaining posts of your plan.',
            'Você não possui mais créditos este mês. Faça um upgrade!' => 'You have no more credits this month. Please upgrade!',
        ],
        'es_ES' => [
            'Uso de Créditos Mensais' => 'Uso de Créditos Mensales',
            'créditos restantes de' => 'créditos restantes de',
            'Licenciamento' => 'Licenciamiento',
            'Configurações' => 'Configuraciones',
            'Ativar Licença Premium' => 'Activar Licencia Premium',
            'Controle total sobre a orquestração de 5 agentes e SEO Nível Yoast.' => 'Control total sobre a orquestração de 5 agentes e SEO Nível Yoast.',
            'Ativar Agora' => 'Activar Ahora',
            'Não tem uma licença ou quer fazer Upgrade?' => '¿No tienes una licencia ou quieres fazer Upgrade?',
            'mês' => 'mes',
            'Posts/mês' => 'Posts/mes',
            'Palavras' => 'Palavras',
            'Yoast SEO Nível Pro' => 'Yoast SEO Nivel Pro',
            'Assinar Plano' => 'Suscribirse al Plan',
            'Carregando planos da plataforma... Se não aparecerem,' => 'Cargando planos de la plataforma... Si no aparecen,',
            'clique aqui' => 'clique aquí',
            'OpenAI API Key' => 'Clave API de OpenAI',
            'Google Gemini API Key' => 'Clave API de Google Gemini',
            'Frequência de Postagens' => 'Frecuencia de Publicación',
            'A cada' => 'Cada',
            'Hora(s)' => 'Hora(s)',
            'Dia(s)' => 'Día(s)',
            'Define quando a IA deve gerar um novo post automaticamente.' => 'Define cuándo la IA debe generar un nuevo post automáticamente.',
            'Assunto Principal' => 'Asunto Principal',
            'Notícias, Tendências e Dicas (Aleatórias)' => 'Noticias, Tendencias y Consejos (Aleatorios)',
            'Meus Produtos / Serviços (Via WooCommerce e Lista)' => 'Mis Productos / Servicios (Vía WooCommerce y Lista)',
            'Marque ambas para a IA sortear (50/50) a cada postagem.' => 'Marque ambas para que a IA elija (50/50) en cada publicación.',
            'Termos de Pesquisa Extras' => 'Términos de Búsqueda Extras',
            'Ex: RPG, Ação, Playstation, Jogos de Tabuleiro, Poker...' => 'Ej: RPG, Acción, Playstation, Juegos de Mesa, Poker...',
            'Obriga a IA a focar nesses nichos durante a criação dos posts e das imagens.' => 'Obliga a la IA a enfocarse en estos nichos durante la creación de posts e imagens.',
            'Meus Produtos/Serviços' => 'Mis Productos/Servicios',
            'Se você escolheu \'Meus Produtos/Serviços\', descreva aqui os produtos ou temas que quer abordar...' => 'Si elegiste \'Mis Productos/Servicios\', describe los productos o temas que quieres tratar aquí...',
            'Explique o que você vende ou os assuntos específicos que deseja tratar. A IA focará neles.' => 'Explica lo que vendes o los temas específicos que deseas tratar. La IA se centrará en ellos.',
            'Tom de Escrita' => 'Tono de Escritura',
            'Persuasivo e Vendedor' => 'Persuasivo y Vendedor',
            'Informativo e Direto' => 'Informativo y Directo',
            'Descontraído e Casual' => 'Relajado y Casual',
            'Agressivo (Gatilhos Mentais)' => 'Agresivo (Gatillos Mentales)',
            'Tamanho Médio (Palavras)' => 'Tamaño Promedio (Palabras)',
            'Curto (500-1000 palavras)' => 'Corto (500-1000 palabras)',
            'Médio/Longo (1500-3000 palavras)' => 'Medio/Largo (1500-3000 palabras)',
            'Muito Longo (3000-5000 palavras)' => 'Muy Largo (3000-5000 palabras)',
            'Número de Imagens' => 'Número de Imágenes',
            'Máximo recomendado: 3 imagens (Evita limites de API).' => 'Máximo recomendado: 3 imágenes (Evita límites de API).',
            'Estilo das Imagens' => 'Estilo de las Imágenes',
            '3D Render (Moderno e Vibrante)' => '3D Render (Moderno y Vibrante)',
            'Fotorealista (Alta Qualidade)' => 'Fotorealista (Alta Calidad)',
            'Ilustração Flat (Minimalista)' => 'Ilustración Flat (Minimalista)',
            'Futurista / Cyberpunk (Neon)' => 'Futurista / Cyberpunk (Neon)',
            'Isométrico (Limpio e Técnico)' => 'Isométrico (Limpio y Técnico)',
            'Escolha como a IA deve "desenhar" as imagens do seu post.' => 'Elige cómo la IA debe "dibujar" las imágenes de tu post.',
            'Fontes de Notícias ou RSS' => 'Fuentes de Noticias o RSS',
            'Cole URLs de fontes (uma por linha) ou deixe em branco para busca 100% automática' => 'Pega URLs de fuentes (una por línea) o deja en blanco para búsqueda automática',
            'Insira a URL de um feed RSS, o link direto de um site/domínio, ou deixe em branco para o Agente pesquisar na Web livremente sobre os assuntos.' => 'Ingresa la URL de um feed RSS, el enlace directo de um sitio, o deja en blanco para que el Agente busque en la Web.',
            'Teste de Geração' => 'Prueba de Generación',
            'Clique no botão abaixo para forçar o Orquestrador a pesquisar, escrever e publicar um post agora.' => 'Haz clic en el botón de abajo para forzar al Orquestrador a buscar, escribir y publicar un post ahora.',
            'Gerar Post AGORA (Manual)' => 'Generar Post AHORA (Manual)',
            'Post gerado e publicado com sucesso!' => '¡Post generado y publicado con éxito!',
            'Erro na geração do post. Verifique os logs.' => 'Error en la generación del post. Verifique los registros.',
            'Erro: Chaves de API não configuradas ou inválidas.' => 'Error: Claves de API no configuradas o inválidas.',
            'Licença ativada com sucesso!' => '¡Licencia activada con éxito!',
            'Chave de licença inválida.' => 'Clave de licencia inválida.',
            'Você atingiu o limite máximo de 5 posts no período de teste (trial). É necessário pagar a sua fatura para liberar o restante dos posts do seu plano.' => 'Has alcanzado el límite máximo de 5 publicaciones durante el período de prueba (trial). Debes pagar tu factura para desbloquear el resto de las publicaciones de tu plan.',
            'Você não possui mais créditos este mês. Faça um upgrade!' => 'No tienes más créditos este mes. ¡Por favor, actualiza tu plan!',
        ]
    ];

    private static $active_locale = null;

    public static function init() {
        // Cacheia o idioma apenas uma vez para evitar recursão infinita no filtro gettext
        $setting = get_option('conext_writer_language', 'auto');
        self::$active_locale = ($setting !== 'auto') ? $setting : get_locale();

        add_filter('gettext', [self::class, 'handle_translations'], 10, 3);
    }

    public static function handle_translations($translated, $text, $domain) {
        if ($domain !== 'conext-writer') {
            return $translated;
        }

        $locale = self::$active_locale;

        // Se for português (default no código), não precisa mapear se o locale for pt
        if (strpos($locale, 'pt') === 0) {
            return $translated;
        }

        // Selecionar o mapa de tradução
        if (strpos($locale, 'es') === 0 && isset(self::$translations['es_ES'][$text])) {
            return self::$translations['es_ES'][$text];
        }
        
        if (strpos($locale, 'en') === 0 && isset(self::$translations['en_US'][$text])) {
            return self::$translations['en_US'][$text];
        }

        return $translated;
    }
}
