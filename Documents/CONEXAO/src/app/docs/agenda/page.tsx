import { Calendar, Clock, Globe, ShieldCheck, Mail, Bot, Smartphone, Settings2, PlayCircle } from "lucide-react";

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
                <p className="text-gray-400 leading-relaxed text-lg">
                    Automatize sua agenda. O ConextBot permite que seus clientes marquem reuniões e horários diretamente pelo chat, sincronizando tudo com seu **Google Calendar**.
                </p>
            </section>

            {/* Core Features */}
            <section className="grid md:grid-cols-3 gap-6">
                <div className="p-6 glass rounded-2xl border border-white/5 bg-blue-500/5">
                    <Clock className="text-blue-400 mb-4" size={24} />
                    <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-widest">Slots de 30/60min</h4>
                    <p className="text-[11px] text-gray-500">Defina a duração padrão de cada atendimento.</p>
                </div>
                <div className="p-6 glass rounded-2xl border border-white/5 bg-purple-500/5">
                    <Globe className="text-purple-400 mb-4" size={24} />
                    <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-widest">Google Sync</h4>
                    <p className="text-[11px] text-gray-500">Integração bidirecional com sua agenda pessoal.</p>
                </div>
                <div className="p-6 glass rounded-2xl border border-white/5 bg-emerald-500/5">
                    <ShieldCheck className="text-emerald-400 mb-4" size={24} />
                    <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-widest">Anti-Conflito</h4>
                    <p className="text-[11px] text-gray-500">O robô só mostra horários que estão realmente livres.</p>
                </div>
            </section>

            {/* Step by Step Setup */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Settings2 className="text-gray-400" /> Configuração (Passo a Passo)
                </h2>
                
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs text-sm">1</div>
                        <div>
                            <h4 className="font-bold text-gray-200 uppercase text-xs tracking-widest mb-1">Horário de Atendimento</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">Vá em **Configurações {" > "} Geral** e defina os horários em que o bot está autorizado a agendar (ex: Seg-Sex, 09h às 18h).</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs text-sm">2</div>
                        <div>
                            <h4 className="font-bold text-gray-200 uppercase text-xs tracking-widest mb-1">Vínculo com Google Calendar</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">Em **Meus Bots {" > "} Google Setup**, autorize o acesso à sua conta. Isso permitirá que o bot leia seus compromissos existentes e crie novos eventos.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold text-white text-xs text-sm">3</div>
                        <div>
                            <h4 className="font-bold text-gray-200 uppercase text-xs tracking-widest mb-1">Duração & Folga</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">Escolha a duração fixa de cada slot (ex: 45 minutos) e o intervalo mínimo entre agendamentos para evitar correria.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Interaction Example */}
            <section className="bg-black/40 border border-white/10 rounded-3xl p-8 space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <PlayCircle className="text-emerald-500" /> Fluxo de Conversa
                </h3>
                <div className="space-y-4 border-l-2 border-emerald-500/20 pl-6 ml-2">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-emerald-500">Cliente:</p>
                        <p className="text-sm text-gray-300">"Gostaria de marcar uma reunião para amanhã."</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] uppercase font-bold text-blue-400">Bot:</p>
                        <p className="text-sm text-gray-300 italic">"Claro! Tenho estes horários livres para amanhã: 10h, 14:30 e 16h. Qual prefere?"</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-emerald-500">Cliente:</p>
                        <p className="text-sm text-gray-300">"Pode ser às 14:30."</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] uppercase font-bold text-blue-400">Bot:</p>
                        <p className="text-sm text-gray-300 italic">"Perfeito! Agendado. Acabei de enviar o convite para seu e-mail."</p>
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="p-8 glass rounded-3xl border border-white/10 bg-indigo-500/5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Mail className="text-indigo-400" /> Lembretes e Confirmação
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Além de agendar, o robô pode enviar notificações automáticas para que o cliente não esqueça do compromisso:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 border border-white/5 rounded-xl bg-white/5">
                        <Smartphone className="text-blue-400 mb-2" size={20} />
                        <h5 className="text-white font-bold text-xs uppercase mb-1">WhatsApp (1h antes)</h5>
                        <p className="text-[10px] text-gray-500">Mensagem automática de lembrete com opção de cancelamento.</p>
                    </div>
                    <div className="p-4 border border-white/5 rounded-xl bg-white/5">
                        <Bot className="text-purple-400 mb-2" size={20} />
                        <h5 className="text-white font-bold text-xs uppercase mb-1">E-mail Automático</h5>
                        <p className="text-[10px] text-gray-500">Convite oficial do Google Calendar enviado para o cliente.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
