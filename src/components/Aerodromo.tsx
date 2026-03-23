
import React, { useState, useMemo } from 'react';
import { MOCK_FLIGHTS } from '../data/mockData';
import { FlightData, FlightStatus } from '../types';
import { OperatorCell } from './OperatorCell';
import { 
  Search, LayoutGrid, Power, Anchor, Ban, AlertTriangle, BusFront, User
} from 'lucide-react';

interface AerodromoProps {}

// === CONFIGURAÇÃO DE POSIÇÕES REAIS (SBGR HARDCODED) ===
const POSITIONS_BY_PATIO: Record<string, string[]> = {
    '1': [
        '101L', '101', '101R', '102', '103L', '103R', '104', '105L', '105R', 
        '106', '107L', '107R', '108L', '108R', '109', '110', '111', 
        '112L', '112', '112R', '113', '113L', '113R', '114', '115'
    ],
    '2': [
        '201', '202', '202L', '202R', '203', '204L', '204', '204R', '205', 
        '206', '207', '208', '209', '210', '211L', '211', '211R', '212L', '212R'
    ],
    '3': [
        '301', '302L', '302R', '303L', '303R', '304', '305', '306', '307', 
        '308', '309', '310', '311', '312'
    ],
    '4': [
        '401', '402L', '402', '402R', '403', '404', '405', '406', '407', 
        '408', '409', '410L', '410R', '411', '411L', '411R', '412'
    ],
    '5': [
        '501L', '502', '502R', '503', '504L', '504', '504R', '505', '505R', 
        '506', '507L', '507', '507R', '508L', '508R', '509L', '509', '509R', 
        '510L', '510R', '510', '511L', '511', '511R', '512', '513'
    ],
    '6': [
        '601L', '601R', '602L', '602R', '603L', '603R', '604L', '604R', 
        '605L', '605R', '606L', '606', '606R', '607L', '607R', '608L', '608R', 
        '609L', '609R', '610L', '610R', '611L', '611R', '612L', '612R'
    ],
    '7': [
        '701L', '701R', '702L', '702R', '703L', '703R', 
        '713L', '713R', '714L', '714R', '715L', '715R'
    ]
};

const PATIO_LABELS = [
    { id: '1', label: 'PÁTIO 1' },
    { id: '2', label: 'PÁTIO 2' },
    { id: '3', label: 'PÁTIO 3' },
    { id: '4', label: 'PÁTIO 4' },
    { id: '5', label: 'PÁTIO 5' },
    { id: '6', label: 'PÁTIO 6' },
    { id: '7', label: 'PÁTIO 7' },
];

export const Aerodromo: React.FC<AerodromoProps> = () => {
  const [activePatioId, setActivePatioId] = useState('2');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [disabledPositions, setDisabledPositions] = useState<Set<string>>(new Set(['208', '212L']));
  const [ctaOnlyPositions, setCtaOnlyPositions] = useState<Set<string>>(new Set([])); // Posições com Pit Quebrado -> CTA
  
  const [calcoInputPos, setCalcoInputPos] = useState<string | null>(null);
  const [calcoRegistration, setCalcoRegistration] = useState('');
  const [localFlights, setLocalFlights] = useState<FlightData[]>(MOCK_FLIGHTS);

  const currentPositions = useMemo(() => {
      return POSITIONS_BY_PATIO[activePatioId] || [];
  }, [activePatioId]);

  const positionData = useMemo(() => {
      const map = new Map<string, FlightData>();
      localFlights.forEach(f => {
          if (currentPositions.includes(f.positionId)) {
             map.set(f.positionId, f);
          } else {
             const exactMatch = currentPositions.find(p => p === f.positionId);
             if (exactMatch) map.set(exactMatch, f);
          }
      });
      return map;
  }, [currentPositions, localFlights]);

  const patioStats = useMemo(() => {
      let occupied = 0;
      let refueling = 0;
      let waiting = 0;
      let inactive = 0;
      
      currentPositions.forEach(pos => {
          if (disabledPositions.has(pos)) {
              inactive++;
              return;
          }
          const flight = positionData.get(pos);
          if (flight) {
              occupied++;
              if (flight.status === FlightStatus.ABASTECENDO) refueling++;
              if (flight.status === FlightStatus.AGUARDANDO) waiting++;
          }
      });

      return { total: currentPositions.length, occupied, refueling, waiting, inactive };
  }, [currentPositions, positionData, disabledPositions]);

  const toggleDisablePosition = (posId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      // REGRA: Não inativar se estiver abastecendo
      const flight = positionData.get(posId);
      if (flight && flight.status === FlightStatus.ABASTECENDO) {
          alert('NEGADO: Posição com abastecimento em curso.');
          return;
      }

      const next = new Set(disabledPositions);
      if (next.has(posId)) next.delete(posId);
      else next.add(posId);
      setDisabledPositions(next);
  };

  const toggleCtaRequest = (posId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const next = new Set(ctaOnlyPositions);
      if (next.has(posId)) next.delete(posId);
      else next.add(posId);
      setCtaOnlyPositions(next);
  };

  const startCalcoReport = (posId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setCalcoInputPos(posId);
      setCalcoRegistration('');
  };

  const submitCalcoReport = (posId: string) => {
      if (!calcoRegistration) {
          setCalcoInputPos(null);
          return;
      }
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const existingFlight = positionData.get(posId);

      if (existingFlight) {
          const updatedFlights = localFlights.map(f => f.id === existingFlight.id ? { 
              ...f, 
              eta: timeString, 
              status: FlightStatus.AGUARDANDO 
          } : f);
          setLocalFlights(updatedFlights);
      } else {
          const newFlight: FlightData = {
              id: `adhoc-${Date.now()}`,
              flightNumber: 'AD-HOC',
              airline: 'GEN',
              airlineCode: 'GEN',
              model: '???',
              registration: calcoRegistration.toUpperCase(),
              origin: '???',
              destination: '???',
              eta: timeString,
              etd: '--:--',
              positionId: posId,
              fuelStatus: 0,
              status: FlightStatus.DESIGNADO, 
              vehicleType: 'SERVIDOR',
              logs: []
          };
          setLocalFlights([...localFlights, newFlight]);
      }
      setCalcoInputPos(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">
      
      {/* HEADER PRINCIPAL */}
      <div className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center px-6 gap-4 shrink-0 z-30 shadow-sm relative justify-between">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <LayoutGrid className="text-emerald-500" size={20} />
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tighter leading-none">Mapa do Pátio</h2>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SBGR Ground Layout</span>
                    </div>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div className="flex items-center gap-1">
                    {PATIO_LABELS.map(patio => (
                        <button
                            key={patio.id}
                            onClick={() => { setActivePatioId(patio.id); }}
                            className={`
                                px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border
                                ${activePatioId === patio.id 
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white hover:border-slate-600'
                                }
                            `}
                        >
                            {patio.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="BUSCAR POS..." 
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-[10px] text-white font-mono uppercase focus:border-emerald-500/50 outline-none w-32 focus:w-48 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                />
            </div>
      </div>

      {/* KPI SUB-HEADER */}
      <div className="h-10 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 shrink-0 z-20">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                    Total: <span className="text-white font-mono">{patioStats.total}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Ocupados: <span className="text-white font-mono">{patioStats.occupied}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Aguardando: <span className="text-white font-mono">{patioStats.waiting}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Abastecendo: <span className="text-white font-mono">{patioStats.refueling}</span>
                </div>
             </div>
             <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                 Live Data Feed
             </div>
      </div>

      {/* GRID CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 pb-24">
              {currentPositions.filter(p => p.includes(searchTerm)).map(posId => {
                  const flight = positionData.get(posId);
                  const isOccupied = !!flight;
                  const isDisabled = disabledPositions.has(posId);
                  const isCtaReq = ctaOnlyPositions.has(posId);
                  const isReportingCalco = calcoInputPos === posId;
                  
                  const hasOperator = !!flight?.operator;
                  const isRefueling = flight?.status === FlightStatus.ABASTECENDO;
                  
                  let borderColor = 'border-slate-800';
                  let bgColor = 'bg-slate-900/20';
                  
                  if (isDisabled) {
                      borderColor = 'border-red-900/50';
                      bgColor = 'bg-[repeating-linear-gradient(45deg,rgba(15,23,42,0.8),rgba(15,23,42,0.8)_10px,rgba(69,10,10,0.2)_10px,rgba(69,10,10,0.2)_20px)]';
                  } else if (isReportingCalco) {
                      borderColor = 'border-amber-500';
                      bgColor = 'bg-amber-950/20';
                  } else if (isOccupied) {
                       if (isRefueling) {
                           borderColor = 'border-blue-500/50'; // Abastecendo Blue
                           bgColor = 'bg-blue-500/5';
                       } else if (!hasOperator) {
                           borderColor = 'border-slate-700'; // Designado Sem Operador
                           bgColor = 'bg-slate-900/40';
                       } else if (flight.status === FlightStatus.FINALIZADO) {
                           borderColor = 'border-emerald-500/50';
                           bgColor = 'bg-emerald-500/5';
                       } else {
                           borderColor = 'border-amber-500/30'; // Aguardando
                           bgColor = 'bg-amber-500/5';
                       }
                  }

                  return (
                      <div
                          key={posId}
                          className={`
                              relative aspect-[4/4] rounded-xl border-2 flex flex-col p-2.5 transition-all duration-300 group
                              ${borderColor} ${bgColor} hover:border-slate-600
                          `}
                          
                      >
                          {/* HEADER DO CARD: POSIÇÃO + CIA */}
                          <div className="flex justify-between items-start mb-1">
                              <span className={`text-xl font-black font-mono leading-none ${isOccupied && !isDisabled ? 'text-white' : 'text-slate-700'}`}>
                                  {posId}
                              </span>
                              
                              <div className="flex gap-1">
                                  {isCtaReq && !isDisabled && (
                                     <span className="text-[9px] font-black text-slate-950 bg-amber-500 px-1.5 py-0.5 rounded uppercase animate-pulse">CTA</span>
                                  )}
                                  
                                  {isDisabled ? (
                                      <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">OFF</span>
                                  ) : isOccupied ? (
                                      <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300`}>
                                          {flight.airline}
                                      </span>
                                  ) : null}
                              </div>
                          </div>

                          {/* CORPO DO CARD */}
                          <div className="flex-1 flex flex-col justify-center min-h-0">
                              {isDisabled ? (
                                  <div className="flex flex-col items-center justify-center">
                                      <Ban size={24} className="text-red-500 mb-1" />
                                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded">INATIVO</span>
                                  </div>
                              ) : isReportingCalco ? (
                                  <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                      <label className="text-[9px] font-bold text-amber-500 uppercase text-center">Informe Prefixo</label>
                                      <input 
                                          autoFocus
                                          className="w-full bg-slate-950 border border-amber-500/50 rounded text-center text-sm font-black text-white uppercase py-1 outline-none"
                                          placeholder="PR-..."
                                          value={calcoRegistration}
                                          onChange={e => setCalcoRegistration(e.target.value)}
                                          onKeyDown={e => e.key === 'Enter' && submitCalcoReport(posId)}
                                      />
                                      <div className="flex gap-1">
                                          <button onClick={() => submitCalcoReport(posId)} className="flex-1 bg-amber-500 text-slate-950 text-[9px] font-black py-1 rounded hover:bg-amber-400">OK</button>
                                          <button onClick={() => setCalcoInputPos(null)} className="flex-1 bg-slate-800 text-slate-400 text-[9px] font-black py-1 rounded hover:bg-slate-700">X</button>
                                      </div>
                                  </div>
                              ) : isOccupied ? (
                                  <div className="space-y-1.5">
                                      {/* Voo e Destino */}
                                      <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
                                          <span className="text-sm font-black text-white font-mono tracking-tight">{flight.flightNumber}</span>
                                          <span className="text-[10px] font-black text-slate-400 font-mono">{flight.destination}</span>
                                      </div>
                                      
                                      {/* Horários */}
                                      <div className="grid grid-cols-2 gap-1 text-[9px] font-mono leading-none">
                                          <div className="text-slate-500">
                                              CHG: <span className="text-slate-300">{flight.eta}</span>
                                          </div>
                                          <div className="text-right text-slate-500">
                                              ETD: <span className="text-emerald-500">{flight.etd}</span>
                                          </div>
                                      </div>

                                      {/* Status Lógica Principal */}
                                      <div className="pt-1">
                                          {hasOperator ? (
                                              <>
                                                  <OperatorCell operatorName={flight.operator} className="mb-1" />
                                                  <div className="flex justify-between items-center mt-0.5">
                                                       <span className="text-[8px] font-mono text-slate-500">{flight.fleet ? (isCtaReq && flight.vehicleType !== 'CTA' ? 'REQ-CTA' : `${flight.vehicleType === 'CTA' ? 'CTA' : 'SRV'}-${flight.fleet}`) : 'S/ VEÍCULO'}</span>
                                                       <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                                           flight.status === FlightStatus.ABASTECENDO ? 'text-blue-400 bg-blue-500/10' :
                                                           flight.status === FlightStatus.AGUARDANDO ? 'text-amber-500 bg-amber-500/10' :
                                                           'text-emerald-400 bg-emerald-500/10'
                                                       }`}>
                                                           {flight.status}
                                                       </span>
                                                  </div>
                                              </>
                                          ) : (
                                              // SEM OPERADOR (Posição Ocupada mas Operador não chegou)
                                              <div className="flex flex-col gap-0.5">
                                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase truncate opacity-50">
                                                      <User size={9} />
                                                      --
                                                  </div>
                                                  <div className="flex justify-between items-center mt-0.5">
                                                       <span className="text-[8px] font-mono text-slate-600">--</span>
                                                       <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-800 px-1 rounded border border-slate-700">
                                                           DESIGNADO
                                                       </span>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ) : (
                                  // VAZIO
                                  <div className="flex flex-col items-center justify-center opacity-5 gap-1">
                                      <div className="w-8 h-1 bg-slate-500 rounded-full"></div>
                                      <div className="w-8 h-1 bg-slate-500 rounded-full"></div>
                                  </div>
                              )}
                          </div>

                          {/* ACTIONS FOOTER */}
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                   onClick={(e) => startCalcoReport(posId, e)}
                                   disabled={isDisabled}
                                   title="Reportar Calço"
                                   className="flex items-center gap-1 text-[8px] font-black text-slate-400 hover:text-white uppercase disabled:opacity-20"
                               >
                                   <Anchor size={10} className="text-amber-500" /> CALÇO
                               </button>
                               
                               <div className="flex items-center gap-1">
                                   {/* BOTÃO REQ CTA */}
                                   <button 
                                       onClick={(e) => toggleCtaRequest(posId, e)}
                                       className={`p-1 rounded hover:bg-white/10 ${isCtaReq ? 'text-amber-500' : 'text-slate-600 hover:text-amber-400'}`}
                                       title="Pit Inoperante - Requer CTA"
                                   >
                                       <BusFront size={10} />
                                   </button>
                                   
                                   <button 
                                       onClick={(e) => toggleDisablePosition(posId, e)}
                                       className={`p-1 rounded hover:bg-white/10 ${isDisabled ? 'text-red-500' : 'text-slate-600 hover:text-red-400'}`}
                                   >
                                       <Power size={10} />
                                   </button>
                               </div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

    </div>
  );
};
