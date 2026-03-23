
import React from 'react';
import { Book, ShieldCheck, Zap, Droplet, AlertTriangle, BusFront, Anchor, Ruler, Thermometer, CheckCircle2, RefreshCw } from 'lucide-react';

export const OpsManual: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#020611] overflow-y-auto custom-scrollbar p-12 selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in duration-700 font-sans">
        
        {/* HEADER DOCUMENT */}
        <div className="border-b border-slate-800 pb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 text-emerald-500 mb-4">
              <Book size={32} />
              <span className="font-mono text-sm font-black tracking-[0.5em]">JETFUEL-SIM STANDARD</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Nomenclatura e Infraestrutura</h1>
            <p className="text-slate-500 font-mono text-sm mt-4 uppercase tracking-widest">Base de Conhecimento Operacional Vibra / BR Aviation</p>
          </div>
          <div className="text-right">
             <span className="block text-[10px] font-black text-slate-600 uppercase mb-1">Status do Documento</span>
             <span className="text-emerald-500 font-mono text-sm font-bold uppercase border border-emerald-500/20 px-3 py-1 rounded-full bg-emerald-500/5">Protocolo Ativo</span>
          </div>
        </div>

        {/* SEÇÃO: TERMINOLOGIA OFICIAL */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white flex items-center gap-3 border-l-4 border-emerald-500 pl-6 uppercase tracking-widest mb-8">
            <RefreshCw className="text-emerald-500" /> 01. Glossário Operacional
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 group hover:border-emerald-500/30 transition-all">
               <h3 className="text-white font-black text-sm uppercase mb-4 tracking-widest text-emerald-500">Pátio</h3>
               <p className="text-xs text-slate-400 leading-relaxed">Área macro de movimentação de aeronaves. Ex: Pátio 2, Pátio 3 (SBGR). Não utilize "Terminal".</p>
            </div>
            <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 group hover:border-blue-500/30 transition-all">
               <h3 className="text-white font-black text-sm uppercase mb-4 tracking-widest text-blue-500">Posição</h3>
               <p className="text-xs text-slate-400 leading-relaxed">Ponto exato de estacionamento da aeronave (Ex: Posição 204). Substitui definitivamente "Gate" ou "Portão".</p>
            </div>
            <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 group hover:border-amber-500/30 transition-all">
               <h3 className="text-white font-black text-sm uppercase mb-4 tracking-widest text-amber-500">Pit</h3>
               <p className="text-xs text-slate-400 leading-relaxed">Ponto de conexão física com a rede de hidrantes pressurizada. Cada posição pode ter múltiplos Pits.</p>
            </div>
          </div>
        </section>

        {/* SEÇÃO: INFRAESTRUTURA DE PITS */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white flex items-center gap-3 border-l-4 border-amber-500 pl-6 uppercase tracking-widest">
            <Anchor className="text-amber-500" /> 02. Gestão de Integridade de Pits
          </h2>
          <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">Identificação de Pit (Real SBGR)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pits são identificados pela Posição seguida de um sufixo numérico (Ex: 204-1, 204-2). 
                  A inatividade de um único Pit exige o uso de **CTA** se a Posição não possuir Pits redundantes operacionais.
                </p>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                <h4 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={16} /> Protocolo de Inatividade
                </h4>
                <p className="text-[10px] text-red-500/70 font-bold uppercase mt-2">
                  É PROIBIDA A DESIGNAÇÃO DE SERVIDORES PARA POSIÇÕES COM TODOS OS PITS SINALIZADOS COMO INATIVOS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER METADATA */}
        <div className="pt-12 border-t border-slate-800 flex justify-between items-center opacity-30">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">JETFUEL-SIM V12.02.26</span>
          </div>
          <span className="font-mono text-[10px]">VIBRA_TECHNICAL_CORE</span>
        </div>
      </div>
    </div>
  );
};
