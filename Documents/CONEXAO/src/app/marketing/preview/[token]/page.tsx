import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
    CheckCircle2, 
    XCircle, 
    Instagram, 
    Facebook,
    Sparkles,
    Calendar,
    Clock,
    ArrowLeft
} from "lucide-react";

export default async function PublicPostPreview({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const post = await prisma.marketingPost.findUnique({
        where: { shareToken: token },
        include: { bot: { select: { name: true } } }
    });

    if (!post) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#0b0f1a] text-white selection:bg-emerald-500/30">
            {/* Header / Brand */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Sparkles size={20} className="text-black" />
                    </div>
                    <div>
                        <h1 className="font-black tracking-tight text-lg">Conext <span className="text-emerald-400">Marketing</span></h1>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Aprovação de Conteúdo</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> Criado em {post.createdAt.toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Instagram size={14} /> {post.platform}</span>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-6 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* Visual Preview */}
                    <div className="space-y-6 animate-fade-in">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[32px] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative aspect-square bg-black rounded-[28px] overflow-hidden border border-white/10 shadow-2xl">
                                {post.mediaType === "VIDEO" || post.videoUrl ? (
                                    <video 
                                        src={post.videoUrl || post.imageUrl} 
                                        controls 
                                        className="w-full h-full object-cover"
                                    />
                                ) : post.imageUrl ? (
                                    <img 
                                        src={post.imageUrl} 
                                        alt="AI Post Visual" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#161b22]">
                                        <Sparkles size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-medium">Visual sendo gerado...</p>
                                    </div>
                                )}
                                
                                {/* Status Overlay */}
                                <div className="absolute top-4 right-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                                        post.status === "DRAFT" ? "bg-amber-500/20 text-amber-400 border-amber-500/20" :
                                        post.status === "SCHEDULED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                                        "bg-blue-500/20 text-blue-400 border-blue-500/20"
                                    }`}>
                                        {post.status === "DRAFT" ? "Aguardando Aprovação" : post.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Agente Responsável</p>
                                <p className="text-sm font-bold text-gray-200">{post.bot?.name || "IA Conext"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content & Actions */}
                    <div className="space-y-8 lg:pt-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black leading-tight">Revise sua publicação</h2>
                            <p className="text-gray-400">Confira o texto gerado pela nossa inteligência artificial para sua marca.</p>
                        </div>

                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Sparkles size={120} />
                            </div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Legenda Proposta</h3>
                            <div className="relative text-gray-300 text-lg leading-relaxed whitespace-pre-wrap font-medium italic">
                                "{post.content}"
                            </div>
                        </div>

                        {post.status === "DRAFT" && !post.rejectionReason ? (
                            <div className="space-y-6 pt-4 animate-slide-up">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={12} />
                                        Solicitar Ajustes (Opcional)
                                    </label>
                                    <textarea 
                                        id="rejection-reason"
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-sm text-gray-400 outline-none focus:border-emerald-500/30 transition-all resize-none custom-scrollbar placeholder:text-gray-600"
                                        placeholder="Ex: 'Mude o tom para mais sério', 'Troque a imagem por uma de escritório'..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        id="approve-btn"
                                        className="h-16 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02]"
                                    >
                                        <CheckCircle2 size={24} />
                                        Aprovar Agora
                                    </button>
                                    <button 
                                        id="reject-btn"
                                        className="h-16 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Sparkles size={20} className="text-emerald-500" />
                                        Pedir Ajustes
                                    </button>
                                </div>
                            </div>
                        ) : post.status === "SCHEDULED" || post.status === "PUBLISHED" ? (
                            <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-2">
                                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-emerald-400">Post já aprovado!</h3>
                                <p className="text-gray-400 text-sm">Este conteúdo já está na nossa fila de processamento.</p>
                            </div>
                        ) : (
                            <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl text-center space-y-3 animate-fade-in">
                                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Sparkles size={32} className="text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-400">Solicitação Recebida!</h3>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sua Observação:</p>
                                    <p className="text-sm text-gray-300 italic">"{post.rejectionReason}"</p>
                                </div>
                                <div className="pt-4 border-t border-amber-500/10 mt-4">
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Nossa Inteligência Artificial e equipe já estão trabalhando nos ajustes solicitados. 
                                        Você receberá uma nova versão para aprovação em breve.
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-[10px] text-gray-600 font-medium">
                            Link de visualização segura. Expira após a publicação.
                        </p>
                    </div>

                </div>
            </main>

            {/* Script for buttons - Keep it simple for the preview */}
            <script dangerouslySetInnerHTML={{ __html: `
                // Captura o token diretamente da URL de forma robusta
                const getPostToken = () => {
                    const parts = window.location.pathname.split('/');
                    return parts[parts.length - 1];
                };

                document.getElementById('approve-btn')?.addEventListener('click', async () => {
                    if(!confirm('Deseja aprovar este post para publicação?')) return;
                    const token = getPostToken();
                    const res = await fetch(\`/api/marketing/public/approve/\${token}\`, {
                        method: 'POST',
                        body: JSON.stringify({ action: 'APPROVE' })
                    });
                    if(res.ok) {
                        alert('Sucesso! O post foi aprovado e será publicado em breve.');
                        window.location.reload();
                    } else {
                        alert('Erro ao aprovar post.');
                    }
                });

                document.getElementById('reject-btn')?.addEventListener('click', async () => {
                    const reason = document.getElementById('rejection-reason').value;
                    if(!reason) return alert('Por favor, descreva o que você gostaria de mudar na caixa de texto acima.');
                    
                    const token = getPostToken();
                    const btn = document.getElementById('reject-btn');
                    const originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = 'Enviando...';

                    try {
                        const res = await fetch(\`/api/marketing/public/approve/\${token}\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'REJECT', reason })
                        });
                        if(res.ok) {
                            alert('Feedback enviado! Nossa equipe/IA fará os ajustes.');
                            window.location.reload();
                        } else {
                            alert('Erro ao enviar feedback.');
                        }
                    } catch (e) {
                        alert('Erro de conexão.');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                });
            `}} />
        </div>
    );
}
