const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/marketing/page.tsx', 'utf-8');

const newModal = `function CampaignModal({ onClose, selectedClientId, onSuccess }: any) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [objective, setObjective] = useState("OUTREACH");
    const [budget, setBudget] = useState("50");
    const [ageMin, setAgeMin] = useState("18");
    const [ageMax, setAgeMax] = useState("65");
    const [locations, setLocations] = useState("BR");
    const [creativeUrl, setCreativeUrl] = useState("");

    const handleCreate = async () => {
        if (!name) return alert("Dê um nome para a campanha");
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/ads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name, 
                    objective, 
                    dailyBudget: parseFloat(budget) * 100,
                    clientId: selectedClientId,
                    targeting: {
                        age_min: parseInt(ageMin),
                        age_max: parseInt(ageMax),
                        geo_locations: { countries: locations.split(',').map(l => l.trim().toUpperCase()) }
                    },
                    creativeUrl
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert("Campanha criada com sucesso!");
                onSuccess();
            } else {
                alert(data.error || "Erro ao criar campanha. Verifique se suas credenciais da Meta Ads estão corretas na aba de Configurações.");
            }
        } catch (error) {
            alert("Erro de conexão ao tentar criar campanha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#0f172a] border border-white/10 rounded-[40px] w-full max-w-2xl p-10 space-y-8 shadow-2xl relative my-auto">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black flex items-center gap-3">
                            <Target className="text-blue-500" />
                            Nova Campanha Completa
                        </h2>
                        <p className="text-gray-400 mt-2">Crie anúncios segmentados do zero para a Meta.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 relative z-10">
                    {/* Básico */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nome da Campanha</label>
                            <input 
                                type="text"
                                placeholder="Ex: Lançamento Inverno 2026"
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50 transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Objetivo (Meta API)</label>
                            <select 
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                            >
                                <option value="OUTREACH">Alcance / Brand Awareness</option>
                                <option value="TRAFFIC">Tráfego no Site</option>
                                <option value="CONVERSIONS">Conversões</option>
                                <option value="LEAD_GEN">Geração de Cadastros (Leads)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Orçamento Diário (R$)</label>
                            <input 
                                type="number"
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500/50 font-mono"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Segmentação */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2"><Target size={16}/> Segmentação de Público</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Idade Mínima</label>
                                <input 
                                    type="number" min="13" max="65"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                                    value={ageMin}
                                    onChange={(e) => setAgeMin(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Idade Máxima</label>
                                <input 
                                    type="number" min="13" max="65"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                                    value={ageMax}
                                    onChange={(e) => setAgeMax(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-1 col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Países (Vírgula)</label>
                                <input 
                                    type="text" placeholder="Ex: BR, US, PT"
                                    className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50 uppercase"
                                    value={locations}
                                    onChange={(e) => setLocations(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Criativo */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={16}/> Criativo do Anúncio</h4>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-500">URL da Imagem / Biblioteca</label>
                            <input 
                                type="text"
                                placeholder="Cole o link da imagem (ex: https://...)"
                                className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-blue-500/50"
                                value={creativeUrl}
                                onChange={(e) => setCreativeUrl(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 relative z-10">
                    <button 
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-600/20 text-lg uppercase tracking-widest"
                    >
                        {loading ? "Processando API Meta..." : "Publicar Anúncio Completo"}
                    </button>
                </div>
            </div>
        </div>
    );
}`;

const pattern = /function CampaignModal\(\{\s*onClose,\s*selectedClientId,\s*onSuccess\s*\}\s*:\s*any\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);\n\}/m;
content = content.replace(pattern, newModal);
fs.writeFileSync('src/app/dashboard/marketing/page.tsx', content);
console.log('CampaignModal successfully replaced using node.');
