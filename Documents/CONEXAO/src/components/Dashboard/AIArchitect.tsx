"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, X, File, Image as ImageIcon, Check, Loader2, Edit, BookOpen, Mic, Square } from "lucide-react";
import EditBotModal from "./EditBotModal";
import FactsReview from "./FactsReview";
import { toast } from "sonner";

type Message = {
  role: "user" | "ai";
  content: string;
  type?: "text" | "options" | "success" | "confirmation";
  options?: string[];
  attachments?: { name: string; type: string; url?: string }[];
  payload?: any;
};

interface UploadedFile {
  file: File;
  processing: boolean;
  progress: number;
  extracted?: boolean;
  statusMsg?: string;
}

export default function AIArchitect() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFactsReviewOpen, setIsFactsReviewOpen] = useState(false);

  // States for immediate processing
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [botData, setBotData] = useState<any>({});

  const [globalKeysMissing, setGlobalKeysMissing] = useState(false);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionLoading, setTranscriptionLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize
  useEffect(() => {
    // Check for global keys
    fetch('/api/admin/config')
      .then(res => {
        if (res.status === 401 || res.status === 403) return { skipCheck: true };
        return res.json();
      })
      .then(data => {
        if (data.skipCheck) return;
        if (!data.openaiApiKey && !data.geminiApiKey && !data.openrouterApiKey) {
          setGlobalKeysMissing(true);
        }
      })
      .catch(() => {});

    if (editId) {
      fetch(`/api/bots/${editId}`)
        .then(res => res.json())
        .then(data => {
          setBotData(data);
          setMessages([
            { role: "ai", content: `Olá! Estou carregando o contexto de **${data.name}**. O que você gostaria de alterar hoje?` }
          ]);
        })
        .catch(err => console.error("Failed to load bot", err));
    } else if (messages.length === 0) {
      setMessages([
        { role: "ai", content: "Olá! Vamos criar seu atendente inteligente. Primeiro, **qual nome você quer dar para o seu agente?**" }
      ]);
    }
  }, [editId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles: UploadedFile[] = files.map(f => ({
      file: f,
      processing: true,
      progress: 10,
      statusMsg: 'Enviando...'
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (const fileObj of newFiles) {
      const formData = new FormData();
      formData.append('file', fileObj.file);
      if (editId) formData.append('botId', editId);

      let currentProgress = 10;
      const progressInterval = setInterval(() => {
        currentProgress += 15;
        if (currentProgress < 90) {
          setUploadedFiles(prev => prev.map(f =>
            f.file.name === fileObj.file.name ? { ...f, progress: currentProgress, statusMsg: 'Extraindo texto...' } : f
          ));
        }
      }, 600);

      try {
        const res = await fetch('/api/ai/architect/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        clearInterval(progressInterval);

        if (data.success && data.extractedText) {
          setExtractedTexts(prev => [...prev, data.extractedText]);
          setUploadedFiles(prev => prev.map(f =>
            f.file.name === fileObj.file.name ? {
              ...f,
              processing: false,
              extracted: true,
              progress: 100,
              statusMsg: 'Conteúdo Processado'
            } : f
          ));
        } else {
          setUploadedFiles(prev => prev.map(f =>
            f.file.name === fileObj.file.name ? { ...f, processing: false, statusMsg: 'Erro no OCR', progress: 0 } : f
          ));
        }
      } catch (err) {
        clearInterval(progressInterval);
        setUploadedFiles(prev => prev.map(f =>
          f.file.name === fileObj.file.name ? { ...f, processing: false, statusMsg: 'Falha na conexão', progress: 0 } : f
        ));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Gravando áudio...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Erro ao acessar microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (blob: Blob) => {
    setTranscriptionLoading(true);
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');

    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.text) {
        setInput(data.text);
        toast.success("Áudio transcrito!");
      } else {
        toast.error(data.error || "Erro na transcrição.");
      }
    } catch (err) {
      toast.error("Falha ao transcrever áudio.");
    } finally {
      setTranscriptionLoading(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() && uploadedFiles.length === 0) return;

    let userMessage = textToSend;
    const attachments: { name: string; type: string; url?: string }[] = [];

    if (uploadedFiles.length > 0) {
      userMessage += `\n\n📎 Arquivos anexados: ${uploadedFiles.map(f => f.file.name).join(', ')}`;
      for (const { file } of uploadedFiles) {
        attachments.push({ name: file.name, type: file.type.startsWith('image/') ? 'image' : 'pdf' });
      }
    }

    const userMsg: Message = { role: "user", content: userMessage, attachments: attachments.length > 0 ? attachments : undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const currentExtractedTexts = [...extractedTexts];
    const currentFiles = [...uploadedFiles];
    setUploadedFiles([]);
    setExtractedTexts([]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: [...messages, userMsg],
          extractedTexts: currentExtractedTexts,
          botId: editId
        })
      });

      const data = await res.json();
      if (data.extractedData) setBotData((prev: any) => ({ ...prev, ...data.extractedData }));

      const aiMsg: Message = { role: "ai", content: data.content || "Erro ao processar." };

      if (data.nextStep === 'done') {
        aiMsg.type = 'success';
        try {
          if (botData.creating) return;
          setBotData((prev: any) => ({ ...prev, creating: true }));

          const payload = {
            ...botData,
            name: data.extractedData?.name || botData.name || "Novo Agente",
            businessType: data.extractedData?.businessType || botData.businessType || "Geral",
            voiceId: botData.voiceId || "",
            knowledgeBase: data.extractedData?.knowledgeBase || botData.knowledgeBase,
            description: data.extractedData?.description || botData.description,
            systemPrompt: data.extractedData?.systemPrompt || botData.systemPrompt,
            webhookUrl: data.extractedData?.webhookUrl || botData.webhookUrl,
            webhookToken: data.extractedData?.webhookToken || botData.webhookToken,
            chatwootUrl: data.extractedData?.chatwootUrl || botData.chatwootUrl,
            chatwootToken: data.extractedData?.chatwootToken || botData.chatwootToken,
            chatwootAccountId: data.extractedData?.chatwootAccountId || botData.chatwootAccountId,
            aiProvider: data.extractedData?.aiProvider || botData.aiProvider || "openai",
            aiModel: data.extractedData?.aiModel || botData.aiModel || "gpt-4o-mini"
          };

          if (editId) {
            await fetch(`/api/bots/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            aiMsg.content = `✨ **${payload.name}** atualizado!`;
          } else {
            const createRes = await fetch('/api/bots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const createdBot = await createRes.json();
            if (currentFiles.length > 0) {
              for (const { file } of currentFiles) {
                const formData = new FormData();
                formData.append('file', file);
                await fetch(`/api/bots/${createdBot.id}/media`, { method: 'POST', body: formData });
              }
            }
            aiMsg.content = `🎉 **${payload.name}** criado!`;
            aiMsg.payload = { botId: createdBot.id };
          }
        } catch (e: any) {
          aiMsg.content = `Erro ao salvar: ${e.message}`;
          setBotData((prev: any) => ({ ...prev, creating: false }));
        }
      }
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Erro de conexão." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleManualSave = async (updatedData: any) => {
    try {
      if (editId) {
        const res = await fetch(`/api/bots/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });

        if (!res.ok) {
          const errData = await res.json();
          alert(`Erro ao salvar: ${errData.error || 'Erro desconhecido'}`);
          return;
        }

        const savedBot = await res.json();
        setBotData(savedBot);
        alert('Configurações salvas com sucesso!');
      } else {
        setBotData((prev: any) => ({ ...prev, ...updatedData }));
      }
      setIsEditModalOpen(false);
    } catch (e: any) {
      alert(`Erro de conexão: ${e.message}`);
    }
  };

  return (
    <div className="flex flex-col h-[600px] glass rounded-2xl border-white/10 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={() => setIsEditModalOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"><Edit size={18} /></button>
        {editId && (
          <button onClick={() => setIsFactsReviewOpen(!isFactsReviewOpen)} className={`p-2 rounded-full transition-colors ${isFactsReviewOpen ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}><BookOpen size={18} /></button>
        )}
      </div>

      <EditBotModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} botData={botData} onSave={handleManualSave} />

      {globalKeysMissing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-md text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Configuração Necessária</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Para começar a criar seus agentes, você precisa configurar uma chave de API da <strong>OpenAI</strong> ou <strong>Gemini</strong> nas Configurações Globais do sistema.
            </p>
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              Configurar Agora
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pt-12">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} `}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/10 text-gray-200 rounded-tl-sm border border-white/5"}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.attachments && (
                <div className="mt-3 space-y-2">
                  {msg.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm opacity-75">
                      {att.type === 'image' ? <ImageIcon size={16} /> : <File size={16} />}
                      <span>{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {msg.type === "success" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => router.push(`/dashboard/connect?botId=${msg.payload?.botId}`)} className="btn-primary flex-1 text-sm bg-green-600 hover:bg-green-700">📲 Conectar</button>
                  <button onClick={() => router.push('/dashboard/bots')} className="btn-secondary flex-1 text-sm">Ver Bots</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="p-4 bg-white/10 rounded-2xl w-fit animate-pulse">Processando...</div>}
        <div ref={messagesEndRef} />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="px-4 py-3 bg-black/30 border-t border-white/5 space-y-3">
          {uploadedFiles.map((fileObj, idx) => (
            <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {fileObj.file.type.startsWith('image/') ? <ImageIcon size={16} /> : <File size={16} />}
                  <div>
                    <p className="text-xs font-medium truncate max-w-[150px]">{fileObj.file.name}</p>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase">{fileObj.statusMsg}</p>
                  </div>
                </div>
                <button onClick={() => removeFile(idx)}><X size={14} /></button>
              </div>
              {fileObj.processing && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${fileObj.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf" multiple className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 rounded-xl"><Upload size={20} /></button>
        
        <button 
          onClick={isRecording ? stopRecording : startRecording} 
          className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
          disabled={transcriptionLoading}
        >
          {transcriptionLoading ? <Loader2 className="animate-spin" size={20} /> : isRecording ? <Square size={20} /> : <Mic size={20} />}
        </button>

        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && handleSend()} 
          placeholder={transcriptionLoading ? "Transcrevendo..." : "Diga algo..."} 
          className="flex-1 bg-black/40 rounded-xl px-4 outline-none" 
          disabled={transcriptionLoading}
        />
        <button onClick={() => handleSend()} disabled={uploadedFiles.some(f => f.processing) || transcriptionLoading} className="p-3 bg-indigo-600 rounded-xl">➤</button>
      </div>

      {isFactsReviewOpen && editId && (
        <div className="absolute inset-y-0 right-0 z-20 w-80 shadow-2xl animate-in slide-in-from-right">
          <FactsReview botId={editId} onClose={() => setIsFactsReviewOpen(false)} />
        </div>
      )}
    </div>
  );
}
