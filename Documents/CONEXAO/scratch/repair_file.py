
import sys

path = r'c:\Users\moaci\OneDrive\Documentos\Conextbot\conexbot\Documents\CONEXAO\src\components\Dashboard\EditBotModal.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'tracking-w' in line and '{followupRules.length === 0 ?' in line:
        start_idx = i
    if '))' in line and i > 540 and i < 560:
        if i + 1 < len(lines) and ')}' in lines[i+1]:
            end_idx = i + 1

if start_idx != -1 and end_idx != -1:
    print(f"Found corrupted section from line {start_idx+1} to {end_idx+1}")
    
    new_content = """                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Regras Ativas</h4>
                                        {followupRules.length === 0 ? (
                                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-40">
                                                <Bell size={48} className="mx-auto mb-4" />
                                                <p className="text-xs uppercase tracking-widest font-black">Sem regras de acompanhamento</p>
                                            </div>
                                        ) : (
                                            followupRules.map(r => (
                                                <div key={r.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center group">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h5 className="font-bold text-indigo-400">{r.name}</h5>
                                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${r.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                {r.active ? 'ATIVA' : 'PAUSADA'}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-400 italic mb-2">"{r.message}"</p>
                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                            <span className="bg-white/5 px-2 py-0.5 rounded-full">{r.triggerType}</span>
                                                            <span className="bg-white/5 px-2 py-0.5 rounded-full">
                                                                {r.triggerDays} {
                                                                    r.triggerUnit === 'MINUTES' ? (Math.abs(r.triggerDays) === 1 ? 'minuto' : 'minutos') :
                                                                    r.triggerUnit === 'HOURS' ? (Math.abs(r.triggerDays) === 1 ? 'hora' : 'horas') :
                                                                    (Math.abs(r.triggerDays) === 1 ? 'dia' : 'dias')
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteFollowup(r.id)}
                                                        className="p-3 bg-red-500/10 text-red-400 rounded-xl opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
"""
    new_lines = lines[:start_idx] + [new_content] + lines[end_idx+1:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("File repaired successfully!")
else:
    print(f"Could not find exact markers. Start: {start_idx}, End: {end_idx}")
