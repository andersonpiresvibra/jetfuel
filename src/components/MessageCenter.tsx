import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Send, Paperclip, Users, Building2, Wrench, Crown, Globe, 
  Loader2, Shield, Lock, CheckCheck, ChevronRight, Target, Radio,
  Activity, ClipboardList
} from 'lucide-react';
import { MOCK_TEAM_PROFILES, MOCK_FLIGHTS } from '../data/mockData';
import { ChatMessage } from '../types';

// Atualização das categorias conforme solicitado
type ChatCategory = 'OPERADORES' | 'COMPANHIAS' | 'MANUTENÇÃO' | 'GESTÃO' | 'GERAL';

interface ChatTarget {
  id: string;
  name: string;
  subtext: string;
  category: ChatCategory;
  status?: 'DISPONÍVEL' | 'OCUPADO' | 'DESCONECTADO' | 'CRÍTICO' | 'ENCHIMENTO' | 'INTERVALO';
  icon?: any;
  avatarText?: string;
  hasUnread?: boolean;
}

export const MessageCenter: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('GERAL');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref para o input de arquivo

  // Definição das abas com ícones e cores - REORDENADO
  const tabs = [
    { id: 'GERAL', label: 'GERAL', icon: Globe, color: 'text-slate-200' },
    { id: 'OPERADORES', label: 'OPER', icon: Users, color: 'text-emerald-400' },
    { id: 'COMPANHIAS', label: 'CIAS', icon: Building2, color: 'text-blue-400' },
    { id: 'MANUTENÇÃO', label: 'MANUT', icon: Wrench, color: 'text-amber-500' },
    { id: 'GESTÃO', label: 'GESTÃO', icon: Crown, color: 'text-indigo-400' },
  ] as const;

  // --- GERAÇÃO DE DADOS (TARGETS) ---
  const operatorChats: ChatTarget[] = useMemo(() => MOCK_TEAM_PROFILES.map((op, idx) => ({
    id: op.id,
    name: op.warName.toUpperCase(),
    subtext: op.category,
    category: 'OPERADORES',
    status: op.status as any,
    avatarText: op.warName.charAt(0),
    hasUnread: idx === 1 || idx === 3
  })), []);

  const companyChats: ChatTarget[] = useMemo(() => [
    { id: 'cia_latam', name: 'LATAM_OPS', subtext: 'Terminal 2', category: 'COMPANHIAS', avatarText: 'LA', hasUnread: true },
    { id: 'cia_gol', name: 'GOL_FUEL', subtext: 'Base GRU', category: 'COMPANHIAS', avatarText: 'G3' },
    { id: 'cia_tap', name: 'TAP_LOGISTICS', subtext: 'Intercontinental', category: 'COMPANHIAS', avatarText: 'TP' },
  ], []);

  const maintenanceChats: ChatTarget[] = useMemo(() => [
    { id: 'mnt_oficina', name: 'OFICINA_MNT', subtext: 'Manutenção de Frotas', category: 'MANUTENÇÃO', icon: Wrench, hasUnread: false },
    { id: 'mnt_lab', name: 'LAB_FUEL', subtext: 'Análise de Qualidade', category: 'MANUTENÇÃO', icon: Activity, hasUnread: true },
  ], []);

  const managementChats: ChatTarget[] = useMemo(() => [
    { id: 'mgmt_com', name: 'COMANDO GERAL', subtext: 'Gestão Operacional', category: 'GESTÃO', icon: Crown },
    { id: 'mgmt_coord', name: 'COORDENAÇÃO', subtext: 'Supervisão Regional', category: 'GESTÃO', icon: ClipboardList },
  ], []);

  const allTargets = useMemo(() => [
    ...operatorChats, ...companyChats, ...maintenanceChats, ...managementChats,
  ], [operatorChats, companyChats, maintenanceChats, managementChats]);

  // --- LÓGICA DE FILTRAGEM ---
  const currentList = useMemo(() => {
    let list: ChatTarget[] = [];
    if (activeCategory === 'GERAL') {
      list = allTargets;
    } else {
      list = allTargets.filter(t => t.category === activeCategory);
    }
    if (searchTerm) {
      list = list.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [activeCategory, allTargets, searchTerm]);

  const categoryHasUnread = (catId: string) => {
    if (catId === 'GERAL') return allTargets.some(t => t.hasUnread);
    return allTargets.some(t => t.category === catId && t.hasUnread);
  };

  const activeChat = useMemo(() => 
    allTargets.find(t => t.id === activeChatId), 
    [activeChatId, allTargets]
  );

  const activeMissionData = useMemo(() => {
    if (!activeChat || activeChat.category !== 'OPERADORES') return null;
    const mission = MOCK_FLIGHTS.find(f => 
        f.operator && f.operator.toLowerCase() === activeChat.name.toLowerCase() && 
        f.status !== 'FINALIZADO'
    );
    return mission;
  }, [activeChat]);

  // Mensagens Humanizadas
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'op_horacio': [{ id: '1', sender: 'HORÁCIO', text: 'Terminei o abastecimento da 204. Estou liberado.', timestamp: new Date(), isManager: false }],
    'op_carlos': [{ id: '2', sender: 'CARLOS', text: 'Não achei o avião na posição indicada, confirma pra mim?', timestamp: new Date(), isManager: false }],
    'cia_latam': [{ id: '3', sender: 'LATAM_OPS', text: 'Precisamos de prioridade no voo LA-4540, atraso de conexão.', timestamp: new Date(), isManager: false }]
  });

  const handleSelectChat = (id: string) => {
    setIsDecrypting(true);
    setActiveChatId(id);
    setTimeout(() => setIsDecrypting(false), 300);
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeChatId) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'COORDENAÇÃO',
      text: inputText,
      timestamp: new Date(),
      isManager: true
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), msg]
    }));

    setInputText('');
    if (inputRef.current) {
        inputRef.current.style.height = 'auto'; // Reset height
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeChatId) {
          // Simulação de envio de arquivo como mensagem de texto por enquanto
          const msg: ChatMessage = {
              id: Date.now().toString(),
              sender: 'COORDENAÇÃO',
              text: `Arquivo enviado: ${file.name}`,
              timestamp: new Date(),
              isManager: true
          };
           setMessages(prev => ({
              ...prev,
              [activeChatId]: [...(prev[activeChatId] || []), msg]
          }));
      }
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`; // Max height 100px
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChatId, isDecrypting]);

  const renderChatItem = (target: ChatTarget) => {
    const isActive = activeChatId === target.id;
    return (
      <button 
        key={target.id}
        onClick={() => handleSelectChat(target.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all border group relative mb-1 ${
          isActive 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-white' 
          : 'bg-transparent border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border transition-all relative ${
          isActive 
            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-neon' 
            : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:border-slate-700'
        }`}>
          {target.icon ? <target.icon size={14} /> : target.avatarText}
          {target.hasUnread && !isActive && (
             <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black tracking-tight truncate uppercase font-mono ${isActive ? 'text-emerald-400' : ''}`}>
              {target.name}
            </span>
            {(target.status === 'DISPONÍVEL' || target.status === 'ENCHIMENTO') && (
                <div className={`w-1.5 h-1.5 rounded-full ${target.status === 'ENCHIMENTO' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 shadow-neon'}`}></div>
            )}
          </div>
          <span className="text-[8px] font-black opacity-40 truncate block uppercase tracking-[0.2em]">{target.subtext}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden selection:bg-emerald-500/30">
      
      {/* 1. CABEÇALHO DA SEÇÃO (Abas + Busca) */}
      <div className="h-16 border-b border-slate-900 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-30 shadow-2xl relative">
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-900 overflow-x-auto no-scrollbar max-w-[60%]">
          {tabs.map((tab) => {
            const hasNotification = categoryHasUnread(tab.id);
            return (
                <button 
                key={tab.id}
                onClick={() => { setActiveCategory(tab.id as ChatCategory); setActiveChatId(null); }}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[9px] font-black tracking-[0.1em] uppercase border whitespace-nowrap ${
                    activeCategory === tab.id 
                    ? 'bg-slate-800 text-white border-slate-700 shadow-lg' 
                    : 'text-slate-600 border-transparent hover:text-slate-300 hover:bg-white/5'
                }`}
                >
                <tab.icon size={10} className={activeCategory === tab.id ? tab.color : 'opacity-30'} />
                <span>{tab.label}</span>
                {hasNotification && (
                    <div className="absolute top-1 right-1 w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
                </button>
            );
          })}
        </div>
        
        {/* CAIXA DE PESQUISA LEGÍVEL */}
        <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-300 font-medium outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-600"
            />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. COLUNA LATERAL (LISTA) */}
        <div className="w-72 border-r border-slate-900 bg-slate-900/40 flex flex-col shrink-0 relative z-20">
          <div className="h-16 flex items-center px-6 border-b border-slate-900/60 bg-slate-900 shrink-0">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                 <div className="w-1 h-3 bg-emerald-500 rounded-sm"></div>
                 LISTA DE {activeCategory}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {currentList.map(target => renderChatItem(target))}
            {currentList.length === 0 && (
                <div className="text-center py-10 opacity-30">
                    <Users size={24} className="mx-auto mb-2 text-slate-500" />
                    <span className="text-[9px] font-black uppercase text-slate-500">Vazio</span>
                </div>
            )}
          </div>
        </div>

        {/* 3. ÁREA DE CONVERSA (CHAT) */}
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(rgba(16,185,129,1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          {activeChat ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500 relative z-10">
              
              {/* CABEÇALHO DO CHAT (Sincronizado h-16) */}
              <div className="h-16 border-b border-slate-900/80 flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur-xl z-20 shadow-2xl shrink-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-neon border border-emerald-400/50">
                        {activeChat.icon ? <activeChat.icon size={16} /> : activeChat.avatarText}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 shadow-neon ${
                        activeChat.status === 'OCUPADO' ? 'bg-amber-500' :
                        activeChat.status === 'ENCHIMENTO' ? 'bg-blue-500' :
                        'bg-emerald-500'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tighter uppercase leading-none font-mono">{activeChat.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {activeMissionData ? (
                             <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-px rounded border border-emerald-500/20 animate-pulse">
                                EM OPERAÇÃO
                             </span>
                        ) : (
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                {activeChat.status || 'CONECTADO'}
                             </span>
                        )}
                    </div>
                  </div>
                </div>

                <div>
                    {activeMissionData && (
                        <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800 px-4 py-1.5 rounded-lg">
                             <div className="flex flex-col items-center border-r border-slate-800 pr-4">
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-px">Voo</span>
                                <span className="text-sm font-black text-white font-mono leading-none">{activeMissionData.flightNumber}</span>
                             </div>
                             <div className="flex flex-col items-center border-r border-slate-800 pr-4">
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-px">Prefixo</span>
                                <span className="text-sm font-black text-white font-mono leading-none">{activeMissionData.registration}</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-px">Posição</span>
                                <span className="text-sm font-black text-emerald-500 font-mono leading-none">{activeMissionData.positionId}</span>
                             </div>
                        </div>
                    )}
                </div>
              </div>

              {/* FEED DE MENSAGENS */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-transparent relative"
              >
                {isDecrypting && (
                  <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    <span className="text-[9px] font-black text-emerald-500 tracking-[0.4em] uppercase animate-pulse">Sincronizando Canal</span>
                  </div>
                )}

                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 px-4 py-1.5 rounded-full">
                        <Lock size={10} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Canal Registrado • GRU_OPS_NET</span>
                    </div>
                </div>

                {(messages[activeChatId!] || []).map((msg, i) => (
                  <div key={i} className={`flex ${msg.isManager ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className="max-w-[85%] space-y-1">
                      <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-700 ${msg.isManager ? 'flex-row-reverse' : ''}`}>
                         <span className={msg.isManager ? 'text-emerald-500' : 'text-blue-500'}>{msg.sender}</span>
                         <span className="opacity-30">/</span>
                         <span className="font-mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      {/* BALÃO DE MENSAGEM ESTILO BADGE COMPACTO */}
                      <div className={`px-4 py-2 rounded-2xl text-[13px] font-medium leading-relaxed border shadow-sm relative group ${
                        msg.isManager 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white rounded-tr-sm shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-200 rounded-tl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        
                        {msg.isManager && (
                            <div className="absolute -bottom-3 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-60 transition-opacity">
                                <CheckCheck size={10} className="text-emerald-500" />
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AREA DE INPUT REALINHADA PARA DIREITA */}
              <div className="p-4 bg-slate-900 shrink-0 border-t border-slate-900/50">
                <div className="max-w-3xl ml-auto flex items-end gap-2">
                  
                  {/* INPUT INVISÍVEL DE ARQUIVO */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,image/png,image/jpeg,image/jpg" 
                    onChange={handleFileSelect}
                  />

                  {/* CAIXA DE TEXTO */}
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center px-2 shadow-inner focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/10 transition-all min-h-[40px]">
                      <textarea
                        ref={inputRef}
                        rows={1}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-transparent border-none text-[13px] text-white outline-none py-2.5 px-3 placeholder:text-slate-500 font-medium resize-none overflow-hidden max-h-[100px]"
                        value={inputText}
                        onChange={handleInputResize}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                      />
                  </div>

                  {/* BOTÕES DE AÇÃO (CLIPE + ENVIAR) FORA DA CAIXA */}
                  <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                        title="Anexar (TXT, PNG, JPG)"
                      >
                          <Paperclip size={18} />
                      </button>

                      <button 
                        onClick={() => handleSend()}
                        disabled={!inputText.trim()}
                        className={`p-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center shrink-0 ${
                          inputText.trim() 
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20' 
                          : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Send size={18} />
                      </button>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center select-none opacity-20 group relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.05)_0%,_transparent_70%)]"></div>
              <Radio size={120} className="text-emerald-500 mb-8 animate-pulse" />
              <div className="text-center space-y-4 relative z-10">
                  <h2 className="text-2xl font-black text-white uppercase tracking-[1em] leading-relaxed">Jet Ops Hub</h2>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Aguardando Seleção</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
