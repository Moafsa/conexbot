"use client";

import { useEffect, useState } from "react";
import {
    Package, Download, CheckCircle2, MessageCircle, ShoppingBag, PenTool, Loader2
} from "lucide-react";

interface PluginInfo {
    id: string;
    name: string;
    desc: string;
    longDesc: string;
    highlights: string[];
    requires: string;
    category: "Atendimento" | "Marketplace" | "Conteúdo";
    version: string | null;
    downloadUrl: string;
}

const CATEGORY_ICON: Record<string, any> = {
    Atendimento: MessageCircle,
    Marketplace: ShoppingBag,
    Conteúdo: PenTool,
};

const CATEGORY_COLOR: Record<string, string> = {
    Atendimento: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Marketplace: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Conteúdo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export default function PluginsPage() {
    const [plugins, setPlugins] = useState<PluginInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/plugins/list")
            .then((res) => res.json())
            .then((data) => setPlugins(Array.isArray(data.plugins) ? data.plugins : []))
            .catch(() => setPlugins([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8 space-y-8 bg-[#0b0f1a] min-h-screen text-white">
            <div className="pb-6 border-b border-white/5">
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Package size={28} className="text-emerald-400" />
                    Plugins WordPress
                </h1>
                <p className="text-gray-400 mt-2 max-w-2xl">
                    Baixe os plugins da Conext para conectar sua loja WooCommerce ao Conextbot. Cada um cobre uma parte
                    diferente da operação — instale só os que fizerem sentido para o seu negócio.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plugins.map((plugin) => {
                        const Icon = CATEGORY_ICON[plugin.category] || Package;
                        const colorCls = CATEGORY_COLOR[plugin.category] || "text-gray-400 bg-white/5 border-white/10";
                        return (
                            <div
                                key={plugin.id}
                                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${colorCls}`}>
                                        <Icon size={22} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${colorCls}`}>
                                        {plugin.category}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg leading-snug">{plugin.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{plugin.desc}</p>
                                </div>

                                <div className="space-y-2 flex-1">
                                    {plugin.highlights.map((h, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{h}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-white/5">
                                    <span>Requer: {plugin.requires}</span>
                                    <span>{plugin.version ? `v${plugin.version}` : ""}</span>
                                </div>

                                <a
                                    href={plugin.downloadUrl}
                                    download
                                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Download size={16} />
                                    Baixar Plugin
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-gray-400 leading-relaxed">
                <p className="font-bold text-white mb-2">Como instalar</p>
                <p>
                    No seu WordPress: <span className="text-gray-300">Plugins → Adicionar Novo → Enviar Plugin</span>, selecione o
                    arquivo <span className="text-gray-300">.zip</span> baixado e clique em <span className="text-gray-300">Instalar Agora</span>.
                    Depois de ativado, cada plugin tem sua própria tela de configurações para você conectar com sua conta Conextbot.
                </p>
            </div>
        </div>
    );
}
