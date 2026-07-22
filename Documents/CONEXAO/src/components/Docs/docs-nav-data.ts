import type { LucideIcon } from "lucide-react";
import {
    BookOpen,
    Rocket,
    Zap,
    Settings,
    Brain,
    Users,
    CreditCard,
    Calendar,
    Database,
    Cpu,
    PlayCircle,
    ShieldCheck,
    Instagram,
    ShoppingBag,
    Truck,
    Briefcase,
    Megaphone,
    Sparkles,
} from "lucide-react";

export const docsNavIconMap = {
    BookOpen,
    Settings,
    Zap,
    Rocket,
    Brain,
    Users,
    CreditCard,
    Calendar,
    Database,
    Cpu,
    PlayCircle,
    ShieldCheck,
    Instagram,
    ShoppingBag,
    Truck,
    Briefcase,
    Megaphone,
    Sparkles,
} as const satisfies Record<string, LucideIcon>;

export type DocsNavIconKey = keyof typeof docsNavIconMap;

export const docsNavSections: {
    title: string;
    items: { title: string; href: string; iconKey: DocsNavIconKey }[];
}[] = [
    {
        title: "Começando",
        items: [
            { title: "Manual Inicial", href: "/docs", iconKey: "BookOpen" },
            { title: "Criando seu Primeiro Bot", href: "/docs/bot-creation", iconKey: "Sparkles" },
            { title: "API Keys & Sistema", href: "/docs/settings", iconKey: "Settings" },
        ],
    },
    {
        title: "Canais de Conexão",
        items: [
            { title: "WhatsApp via QR Code (Uzapi)", href: "/docs/whatsapp", iconKey: "Zap" },
            { title: "WhatsApp Oficial (Meta)", href: "/docs/whatsapp-oficial", iconKey: "ShieldCheck" },
            { title: "Instagram Direct", href: "/docs/instagram", iconKey: "Instagram" },
            { title: "Mercado Livre", href: "/docs/mercado-livre", iconKey: "ShoppingBag" },
            { title: "Plugin WordPress", href: "/docs/wordpress", iconKey: "Rocket" },
            { title: "AI Writer (Auto-Posts)", href: "/docs/ai-writer", iconKey: "Rocket" },
            { title: "AI SEO Optimizer", href: "/docs/ai-seo-optimizer", iconKey: "Sparkles" },
        ],
    },
    {
        title: "Cérebro IA",
        items: [
            { title: "Arquiteto & Treino", href: "/docs/ai-training", iconKey: "Brain" },
            { title: "Simulador Vendas", href: "/docs/simulator", iconKey: "PlayCircle" },
            { title: "Supervisor Insights", href: "/docs/intelligence", iconKey: "Cpu" },
        ],
    },
    {
        title: "Fluxos de Venda",
        items: [
            { title: "CRM & Funil", href: "/docs/crm", iconKey: "Users" },
            { title: "Follow-up & Réguas", href: "/docs/automation", iconKey: "Zap" },
            { title: "Agenda & Booking", href: "/docs/agenda", iconKey: "Calendar" },
            { title: "Produtos & Catálogo", href: "/docs/catalog", iconKey: "Database" },
            { title: "Pagamentos Asaas", href: "/docs/payments", iconKey: "CreditCard" },
            { title: "Entregadores & Logística", href: "/docs/drivers", iconKey: "Truck" },
        ],
    },
    {
        title: "Para Agências",
        items: [
            { title: "Squads, Tarefas & Workflows", href: "/docs/agency-suite", iconKey: "Briefcase" },
            { title: "Marketing & Anúncios IA", href: "/docs/marketing", iconKey: "Megaphone" },
        ],
    },
];
