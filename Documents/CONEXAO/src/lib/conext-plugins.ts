// Single source of truth for every WordPress plugin Conext distributes. Both the
// auto-update API (src/app/api/v1/ml/update) and the plugin download page
// (src/app/dashboard/plugins) read from this list.

export interface ConextPluginMeta {
    id: string;
    folder: string;
    file: string;
    zip: string;
    name: string;
    desc: string;
    longDesc: string;
    highlights: string[];
    requires: string;
    category: "Atendimento" | "Marketplace" | "Conteúdo";
}

export const CONEXT_PLUGINS: Record<string, ConextPluginMeta> = {
    "conexbot-wp": {
        id: "conexbot-wp",
        folder: "conexbot-wp",
        file: "conexbot-wp.php",
        zip: "conexbot-wp.zip",
        name: "Conexbot Automação & CRM (WhatsApp)",
        desc: "Integre a Inteligência Artificial Conexão ao seu WooCommerce. O Bot mapeia seu estoque e interage com clientes via Chat e WhatsApp.",
        longDesc:
            "Conecta seu WooCommerce ao agente de IA da Conext: ele lê seu catálogo automaticamente, responde clientes pelo WhatsApp e pelo chat do site, e mantém tudo sincronizado com o painel do Conextbot.",
        highlights: [
            "Sincroniza produtos, preços e estoque do WooCommerce com o bot",
            "Atendimento via WhatsApp e widget de chat no site",
            "Histórico de conversas e CRM integrado ao painel Conextbot",
        ],
        requires: "WooCommerce",
        category: "Atendimento",
    },
    "ts-ml-integration": {
        id: "ts-ml-integration",
        folder: "ts-ml-integration",
        file: "ts-ml-integration.php",
        zip: "ts-ml-integration.zip",
        name: "Conextbot Mercado Livre Integration",
        desc: "Integração completa entre WooCommerce e Mercado Livre com sincronização bidirecional, gestão de pedidos, mensagens, envios e muito mais.",
        longDesc:
            "Conecta sua conta do Mercado Livre à sua loja WooCommerce em um clique, usando o app central do Conextbot (sem precisar criar credenciais próprias na Mercado Livre). Mantém produtos, preços, estoque e pedidos sincronizados nos dois sentidos.",
        highlights: [
            "Conexão da conta Mercado Livre em 1 clique, via OAuth central do Conextbot",
            "Sincronização bidirecional de produtos, preços e estoque",
            "Gestão de pedidos, mensagens e envios do Mercado Livre direto no WooCommerce",
        ],
        requires: "WooCommerce",
        category: "Marketplace",
    },
    "conext-writer": {
        id: "conext-writer",
        folder: "conext-writer",
        file: "conext-writer.php",
        zip: "conext-writer.zip",
        name: "Conext Writer",
        desc: "Multi-Agent AI Writer com fallbacks de OpenAI e Gemini para geração automatizada de conteúdo e otimização SEO.",
        longDesc:
            "Gera posts e páginas otimizadas para SEO diretamente no seu WordPress, usando múltiplos provedores de IA (com fallback automático entre eles) para nunca ficar sem gerar conteúdo por falha de uma única API.",
        highlights: [
            "Geração de artigos e páginas com IA, otimizados para SEO",
            "Fallback automático entre OpenAI e Gemini",
            "Publicação e agendamento direto no WordPress",
        ],
        requires: "WordPress 6.0+",
        category: "Conteúdo",
    },
};

export const CONEXT_PLUGIN_LIST = Object.values(CONEXT_PLUGINS);
