
import React, { useState, useMemo, useEffect } from 'react';
import { FlightStatus, FlightData, OperatorProfile } from '../types';
import { MOCK_FLIGHTS } from '../data/mockData';
import { MOCK_VEHICLES } from '../data/mockVehicleData';
import { 
  Plane, Sparkles, BrainCircuit, RefreshCw, TrendingUp, 
  ArrowRight, Gauge, AlertTriangle, ShieldCheck, Activity,
  LayoutDashboard, Map as MapIcon, Calendar, Clock
} from 'lucide-react';
import { generateShiftBriefing } from '../services/geminiService';
import { FlightDetailsModal } from './FlightDetailsModal';
import { StatusBadge, FuelBar } from './SharedStats';

// Micro-gráfico SVG para os KPIs
const Sparkline: React.FC<{ color: string }> = ({ color }) => (
  <svg className="w-16 h-8 opacity-50" viewBox="0 0 100 40">
    <path
      d="M0 35 L10 25 L25 32 L40 10 L55 20 L75 5 L100 15"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Dashboard: React.FC = () => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const text = await generateShiftBriefing({} as OperatorProfile, MOCK_FLIGHTS);
      setBriefing(text);
    } catch (e) {
      console.error(e);
      setBriefing("ERRO DE CONEXÃO COM O NÚCLEO DE IA. VERIFIQUE O PROTOCOLO DE REDE.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  // Lógica para o Mapa de Posições
  const positionStatus = useMemo(() => {
    const positions = ['201', '202', '203', '204', '207', '208', '210', '301', '305', '308', '312', '315', 'P01', 'P05', 'P08'];
    return positions.map(pos => {
      const flight = MOCK_FLIGHTS.find(f => f.positionId === pos);
      return { pos, flight };
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-transparent selection:bg-emerald-500/30">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <LayoutDashboard className="text-emerald-500" size={32} />
            Command Center
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Pátio Hub SBGR • Centralized Logistics</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl shadow-sm">
            <div className="flex flex-col items-end border-r border-slate-100 dark:border-slate-800 pr-4">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status do Sistema</span>
                <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> OPERACIONAL
                </span>
            </div>
            <div className="pl-2">
                <span className="text-xl font-mono font-black text-slate-900 dark:text-white">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            </div>
        </div>
      </div>

      {/* 2. KPI HUD WITH TRENDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Movimentação Hoje', value: '142', change: '+12.4%', color: '#10b981', icon: Plane, trend: 'up' },
          { label: 'Volume JET-A1 Disp.', value: '48.2k L', change: '+5.1%', color: '#3b82f6', icon: Gauge, trend: 'up' },
          { label: 'Avg Turnaround', value: '42m', change: '-8.2%', color: '#10b981', icon: RefreshCw, trend: 'down' },
          { label: 'Alertas Críticos', value: '03', change: '+1', color: '#ef4444', icon: AlertTriangle, trend: 'up' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] shadow-sm hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</span>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 transition-colors">
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter block">{kpi.value}</span>
                <div className={`text-[10px] font-black flex items-center gap-1 mt-2 ${kpi.trend === 'up' && kpi.color !== '#ef4444' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-emerald-500' : 'text-red-500'}`}>
                    <TrendingUp size={12} className={kpi.trend === 'down' ? 'rotate-180' : ''} />
                    {kpi.change} <span className="text-slate-400 font-bold ml-1">LAST 24H</span>
                </div>
              </div>
              <Sparkline color={kpi.color} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. MIDDLE SECTION: POSITION MAP & AI CORE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* POSITION MAP (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-[0.3em] uppercase flex items-center gap-3">
                    <MapIcon size={18} className="text-emerald-500" />
                    Pátio em Tempo Real
                </h3>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                        <span className="text-[9px] font-black text-slate-500 uppercase">Livre</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-[9px] font-black text-slate-500 uppercase">Ocupado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black text-slate-500 uppercase">Abastecendo</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {positionStatus.map((item, idx) => (
                    <div 
                        key={idx}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group/pos
                            ${item.flight 
                                ? item.flight.status === FlightStatus.ABASTECENDO 
                                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-500 shadow-emerald-500/10' 
                                    : 'bg-blue-500/5 border-blue-500/20 text-blue-500 shadow-blue-500/10'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }
                        `}
                        onClick={() => item.flight && setSelectedFlight(item.flight)}
                    >
                        <span className="text-[10px] font-black font-mono opacity-50 uppercase">Pos {item.pos}</span>
                        {item.flight ? (
                            <Plane size={18} className="animate-in zoom-in" />
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20"></div>
                        )}
                        <span className="text-[8px] font-black font-mono truncate px-2 w-full text-center">
                            {item.flight?.flightNumber || '---'}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* AI TACTICAL CORE (5 Columns) */}
        <div className="lg:col-span-5 bg-[#0a0f1d] border border-emerald-500/20 rounded-[32px] p-8 relative overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <BrainCircuit className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Briefing Operacional</h3>
                        <p className="text-[8px] text-emerald-500/60 font-black uppercase tracking-widest mt-1">Sincronizado via Gemini AI</p>
                    </div>
                </div>
                <button 
                    onClick={handleGenerateBriefing}
                    disabled={loadingBriefing}
                    className="p-3 bg-white/5 hover:bg-white/10 text-emerald-500 rounded-xl transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                >
                    {loadingBriefing ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </button>
            </div>

            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-6 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(16,185,129,1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                <div className="relative z-10 h-full overflow-y-auto custom-scrollbar">
                    {briefing ? (
                        <p className="text-[12px] text-slate-300 font-mono leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-bottom-2">
                            {briefing}
                        </p>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10 opacity-40">
                            <Activity size={32} className="text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-[200px]">
                                {loadingBriefing ? 'Processando dados da malha...' : 'Clique no ícone de faísca para analisar o turno'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest px-2">
                <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500" /> AES-256 Encrypted</span>
                <span>v12.02_AI_CORE</span>
            </div>
        </div>
      </div>

      {/* 4. RECENT MONITORING LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center px-10">
          <div className="flex items-center gap-4">
              <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-[0.3em] uppercase">Monitoramento Ativo</h2>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-800"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{MOCK_FLIGHTS.length} Missões Rastreadas</span>
          </div>
          <button className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-2 group transition-all">
            Ficha Completa <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-5 dark:bg-slate-950/50 text-slate-500 text-[9px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-10 py-4">Missão / Prefixo</th>
                <th className="px-8 py-4">Logística Pátio</th>
                <th className="px-8 py-4">Timing ETA</th>
                <th className="px-8 py-4 text-center">Posição</th>
                <th className="px-8 py-4">Abastecimento</th>
                <th className="px-10 py-4">Status Logístico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-5 dark:divide-slate-800/50">
              {MOCK_FLIGHTS.map((flight) => (
                <tr 
                  key={flight.id} 
                  className="hover:bg-slate-50 dark:hover:bg-emerald-500/[0.02] transition-all cursor-pointer group" 
                  onClick={() => setSelectedFlight(flight)}
                >
                  <td className="px-10 py-5">
                    <div className="flex flex-col">
                        <span className="text-slate-900 dark:text-white font-mono font-black text-sm group-hover:text-emerald-500 transition-colors">{flight.flightNumber}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{flight.registration} • {flight.model}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{flight.origin}</span>
                        <div className="w-4 h-[1px] bg-slate-200 dark:bg-slate-800"></div>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{flight.destination}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                        <Clock size={12} className="opacity-40" />
                        {flight.eta}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-black border border-slate-200 dark:border-slate-700 uppercase">
                        {flight.positionId}
                    </span>
                  </td>
                  <td className="px-8 py-5 w-56">
                    <FuelBar value={flight.fuelStatus} status={flight.status} />
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex justify-end lg:justify-start">
                        <StatusBadge status={flight.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFlight && (
        <FlightDetailsModal 
            flight={selectedFlight} 
            onClose={() => setSelectedFlight(null)} 
            onUpdate={(updated) => {
                setSelectedFlight(null);
            }} 
            vehicles={MOCK_VEHICLES}
        />
      )}
    </div>
  );
};
