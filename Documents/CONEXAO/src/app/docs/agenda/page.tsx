import { Calendar, Clock, Globe, ShieldCheck, Mail, Bot, Smartphone, Settings2, PlayCircle, ArrowRight } from "lucide-react";

export default function AgendaDocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Calendar className="text-blue-500" size={32} />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic tracking-tighter">
                        Agenda & Agendamentos
                    </h1>
                </div>
                <p className="text-gray-400 leading-relaxed text-lg max-w-2xl">
                    Automatize sua agenda pessoal e empresarial. O ConextBot permite que seus clientes marquem reuniões e horários diretamente pelo chat, sincronizando tudo com seu **Google Calendar**.
                </p>
            </section>

            {/* Core Features Grid */}
            <section className="grid md:grid-cols-3 gap-6">
                <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-blue-500/5 group hover:border-blue-500/40 transition-all">
                    <Clock className="text-blue-400 mb-6" size={24} />
                    <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Slots Inteligentes</h4>
                    <p className="text-xs text-gray-500 leading-relaxed italic">Defina a duração padrão (30/60min) e intervalos entre reuniões.</p>
                </div>
                <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-purple-500/5 group hover:border-purple-500/40 transition-all">
                    <Globe className="text-purple-400 mb-6" size={24} />
                    <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Google Sync Pro</h4>
                    <p className="text-xs text-gray-500 leading-relaxed italic">Integração bidirecional total. Mudou no Google? O bot já sabe.</p>
                </div>
                <div className="p-8 glass rounded-[2.5rem] border border-white/5 bg-emerald-500/5 group hover:border-emerald-500/40 transition-all">
                    <ShieldCheck className="text-emerald-400 mb-6" size={24} />
                    <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">Anti-Conflito IA</h4>
                    <p className="text-xs text-gray-500 leading-relaxed italic">O robô só oferece horários realmente livres na sua agenda real.</p>
                </div>
            </section>

            {/* Step by Step Setup */}
            <section className="space-y-10 max-w-3xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-4 italic font-black underline decoration-indigo-500 underline-offset-8">
                    <Settings2 className="text-gray-400" /> Configuração (Passo a Passo)
                </h2>
                
                <div className="space-y-6">
                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs border-4 border-white/5 shadow-2xl">01.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-3">Horário de Disponibilidade</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">"Segunda a Sexta, das 09h às 18h". Configure os limites de atuação do bot em **Configurações &gt; Geral**.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs border-4 border-white/5 shadow-2xl">02.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-3">Vínculo Google Calendar</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Em **Meus Bots &gt; Google Setup**, autorize o acesso à sua conta. Isso permitirá a leitura e escrita automática de eventos.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-start">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs border-4 border-white/5 shadow-2xl">03.</div>
                        <div>
                            <h4 className="font-black text-gray-200 uppercase text-xs tracking-[0.2em] mb-3">Duração e Margem (Buffer)</h4>
                            <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">Escolha a duração fixa de cada slot e o intervalo mínimo (ex: 15 minutos) entre reuniões para evitar conflitos.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Interaction Example Card */}
            <section className="bg-black/40 border border-white/10 rounded-[3rem] p-10 space-y-6 shadow-2xl group border-l-indigo-500/40 border-l-[12px]">
                <h3 className="text-2xl font-black text-white flex items-center gap-3 italic">
                    <PlayCircle className="text-emerald-500 animate-pulse" /> Experiência do Cliente
                </h3>
                <div className="space-y-6 border-l-2 border-white/5 pl-8 ml-3 py-2">
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black text-emerald-500 tracking-[0.2em]">Cliente:</p>
                        <p className="text-sm text-gray-300 italic">"Gostaria de marcar uma reunião para amanhã."</p>
                    </div>
                    <div className="space-y-2 text-right">
                        <p className="text-[10px] uppercase font-black text-blue-400 tracking-[0.2em]">Bot:</p>
                        <p className="text-sm text-gray-300 italic group-hover:text-blue-200 transition-colors">"Claro! Tenho estes horários livres para amanhã: 10h, 14:30 e 16h. Qual prefere?"</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase font-black text-emerald-500 tracking-[0.2em]">Cliente:</p>
                        <p className="text-sm text-gray-300 italic">"Pode ser às 14:30."</p>
                    </div>
                    <div className="space-y-2 text-right">
                        <p className="text-[10px] uppercase font-black text-blue-400 tracking-[0.2em]">Bot:</p>
                        <p className="text-sm text-gray-300 italic font-black group-hover:text-indigo-400 transition-colors">"Perfeito! Agendado. Acabei de enviar o convite para seu e-mail e salvei no meu Google Calendar."</p>
                    </div>
                </div>
            </section>

            {/* Lembretes e Notificações Section */}
            <section className="p-8 glass rounded-[2.5rem] border border-white/10 bg-indigo-500/5 max-w-2xl shadow-xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6 italic font-black text-indigo-400 underline decoration-indigo-500 underline-offset-8">
                    <Mail className="text-indigo-400" /> Lembretes Inteligentes
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="p-4 border border-white/5 rounded-2xl bg-black/40">
                        <Smartphone className="text-blue-400 mb-3" size={20} />
                        <h5 className="text-white font-black text-[10px] uppercase tracking-widest mb-1">WhatsApp (1h antes)</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Mensagem de lembrete enviada 1 hora antes para reduzir o "no-show".</p>
                    </div>
                    <div className="p-4 border border-white/5 rounded-2xl bg-black/40">
                        <Bot className="text-purple-400 mb-3" size={20} />
                        <h5 className="text-white font-black text-[10px] uppercase tracking-widest mb-1">E-mail Automático</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Convite oficial do Google Calendar enviado instantaneamente ao cliente.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
