
import React, { useState, useMemo } from 'react';
import { 
    Search, ArrowLeft, Plane, MapPin, 
    Activity, Radar, User, ChevronRight, Droplet, Users, BusFront, Zap
} from 'lucide-react';
import { MOCK_TEAM_PROFILES, MOCK_FLIGHTS } from '../data/mockData';
import { OperatorProfile, ShiftCycle, OperatorCategory, FlightData } from '../types';

const OperatorAvatar: React.FC<{ op: OperatorProfile, isActive: boolean }> = ({ op, isActive }) => {
    const [error, setError] = useState(false);
    return (
        <div className="w-[67px] shrink-0 border-r border-slate-950/10 overflow-hidden relative flex items-end justify-center bg-slate-950/10">
            {op.photoUrl && !error ? (
                <img 
                    src={op.photoUrl} 
                    alt={op.warName} 
                    className={`w-full h-full object-cover transition-all ${isActive ? '' : 'grayscale'}`} 
                    onError={() => setError(true)}
                />
            ) : (
                <User size={48} className={`mb-2 ${isActive ? 'text-slate-950/25' : 'text-slate-400/25'}`} />
            )}
        </div>
    );
};

export const TeamManager: React.FC<{ flights: FlightData[] }> = ({ flights }) => {

  const [activeShift, setActiveShift] = useState<ShiftCycle>('MANHÃ');
  const [activeCategory, setActiveCategory] = useState<OperatorCategory>('AERODROMO');
  const [searchTerm, setSearchTerm] = useState('');

  const getActiveMission = (warName: string): FlightData | undefined => {
    return flights.find(f => f.operator?.toLowerCase() === warName.toLowerCase() && f.status !== 'FINALIZADO' && f.status !== 'CANCELADO');
  };

  const getCurrentShiftCycle = (): ShiftCycle => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'MANHÃ';
    if (hour >= 14 && hour < 22) return 'TARDE';
    return 'NOITE';
  };

  const teamMembers = useMemo(() => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    return MOCK_TEAM_PROFILES.map(p => {
      // Parse shift times
      const [startH, startM] = p.shift.start.split(':').map(Number);
      const [endH, endM] = p.shift.end.split(':').map(Number);
      
      let startTotal = startH * 60 + startM;
      let endTotal = endH * 60 + endM;

      // Handle overnight shifts (e.g. 21:00 - 06:00)
      if (endTotal < startTotal) {
        endTotal += 24 * 60;
      }

      // Adjust current time for overnight comparison if needed
      let checkTime = currentTotalMinutes;
      if (startTotal > endTotal) { // Should not happen with above logic but safety check
         // Logic for overnight is complex without full dates, but here we assume single day cycle for simplicity
         // If shift is 21:00 - 06:00 (start 1260, end 1800), and current is 02:00 (120), we add 1440 to current?
         // Let's stick to simple: if current < start and current < end (early morning), add 24h?
         // Actually, let's just use the fact that 14:07 is 847 minutes.
         // 05:00-14:00 -> 300-840. 847 is outside.
         // 06:00-15:00 -> 360-900. 847 is inside.
         // 21:00-06:00 -> 1260-1800. 847 is outside.
      }
      
      // Simple check for "wrapping" shifts:
      // If start < end: start <= current <= end
      // If start > end (overnight): current >= start OR current <= end
      
      let isActive = false;
      const [sH, sM] = p.shift.start.split(':').map(Number);
      const [eH, eM] = p.shift.end.split(':').map(Number);
      
      const nowMins = currentHour * 60 + currentMinute;
      const startMins = sH * 60 + sM;
      const endMins = eH * 60 + eM;

      if (startMins < endMins) {
          isActive = nowMins >= startMins && nowMins <= endMins;
      } else {
          // Overnight shift
          isActive = nowMins >= startMins || nowMins <= endMins;
      }

      // Correção do Mapa de Frotas para refletir a realidade SRV x CTA
      const fleetMap: Record<string, string> = {
        'Horácio': 'SRV-2125',
        'Carlos': 'SRV-2144',
        'Betão': 'CTA-1405',
        'Bruno': 'SRV-2160',
        'Marcelo': 'SRV-2177',
        'André': 'SRV-2177',
        'Thiago': 'CTA-1437',
        'Felipe': 'SRV-2113',
        'Rodrigo': 'SRV-2130',
        'Gabriel': 'SRV-2145',
        'Lucas': 'CTA-1425',
        'Mariana': 'CTA-1426',
        'Rafael': 'CTA-1428',
        'Beatriz': 'CTA-1439',
        'Juliano': 'CTA-1499',
        'Ricardo': 'SRV-2140',
        'Paulo': 'SRV-2101',
        'Alex': 'SRV-2102',
        'Douglas': 'SRV-2103',
        'Tavares': 'SRV-2104',
        'Julio': 'SRV-2105',
        'Sandro': 'SRV-2106',
        'Cléber': 'SRV-2107',
        'Jose': 'SRV-2108',
        'Calazans': 'SRV-2109',
        'Silva': 'SRV-2110',
        'Guilherme': 'SRV-2111',
        'Ildo': 'SRV-2112',
        'Peterson': 'SRV-2114',
        'Renilson': 'SRV-2115',
        'Vagner': 'SRV-2116',
        'Medeiros': 'SRV-2117',
        'Cesar': 'SRV-2118',
        'Flavio': 'SRV-2119',
        'Ramos': 'SRV-2120',
        'Belentani': 'SRV-2121',
        'Eules': 'SRV-2122',
        'Souza': 'SRV-2123',
        'Luna': 'SRV-2124',
        'Huan': 'SRV-2126',
        'Luis': 'SRV-2127',
        'Luciano': 'SRV-2128',
        'Idenilson': 'SRV-2129',
        'Manoel': 'CTA-1401',
        'Ronald': 'CTA-1402',
        'Kleysson': 'CTA-1403',
        'Vinicius': 'CTA-1404',
        'Bastos': 'CTA-1406',
        'Elton': 'CTA-1407',
        'Fernando': 'VIP-001',
        'Valdina': 'VIP-002',
        'Renata': 'VIP-003',
        'Zago': 'VIP-004',
        // Adicionando operadores da tarde/noite para sincronia completa
        'Rodolfo': 'SRV-2131',
        'Leonardo': 'SRV-2132',
        'Wesley': 'SRV-2133',
        'Junior': 'SRV-2134',
        'Caio': 'SRV-2136',
        'Pettinelli': 'SRV-2137',
        'Fredison': 'SRV-2138',
        'Alves': 'SRV-2139',
        'Leandro': 'SRV-2141',
        'Feitosa': 'SRV-2142',
        'Lopes': 'SRV-2143',
        'Givani': 'SRV-2146',
        'Renato': 'SRV-2147',
        'Costa': 'SRV-2148',
        'Gilvan': 'SRV-2149',
        'Marques': 'SRV-2150',
        'Horacio': 'SRV-2151',
        'Laercio': 'SRV-2152',
        'Milton': 'SRV-2153',
        'Norman': 'SRV-2154',
        'Dourado': 'SRV-2156',
        'Venancio': 'SRV-2157',
        'Diogo': 'SRV-2158',
        'Willian': 'SRV-2159',
        'Silverio': 'SRV-2162',
        'Regis': 'SRV-2163',
        'Cesario': 'SRV-2165',
        'Martinez': 'SRV-2166',
        'Paschoal': 'SRV-2167',
        'Spedini': 'SRV-2168',
        'Jonatana': 'SRV-2169',
        'Pereira': 'SRV-2170',
        'Gustavo': 'SRV-2171',
        'Torres': 'VIP-005',
        'Solange': 'VIP-006',
        'Loyola': 'VIP-007',
        'Norival': 'VIP-008',
        'Pires': 'VIP-009'
      };

      // Override status if inactive
      let finalStatus = isActive ? p.status : 'INATIVO';

      // Sync with flights
      const mission = getActiveMission(p.warName);
      if (isActive) {
          if (mission) {
              finalStatus = mission.status === 'ABASTECENDO' ? 'ENCHIMENTO' : 'OCUPADO';
          } else {
              // If previously occupied but no mission found, set to available (unless manually set to something else like INTERVALO)
              // For simplicity, we default to DISPONÍVEL if active and no mission
              if (finalStatus === 'OCUPADO' || finalStatus === 'ENCHIMENTO') {
                  finalStatus = 'DISPONÍVEL';
              }
          }
      }

      return {
        ...p,
        status: finalStatus,
        assignedVehicle: fleetMap[p.warName] || (p.category === 'AERODROMO' ? 'SRV-0000' : 'CTA-0000'),
      };
    });
  }, [flights]); // Add flights dependency

  // Removed internal getActiveMission since it's now defined above and used inside useMemo
  // const getActiveMission = (warName: string): FlightData | undefined => {
  //   return MOCK_FLIGHTS.find(f => f.operator?.toLowerCase() === warName.toLowerCase());
  // };

  // Cálculo de estatísticas globais do turno para o HUD
  const teamStats = useMemo(() => {
    const shiftOperators = activeShift === 'GERAL' 
      ? teamMembers 
      : teamMembers.filter(op => op.shift.cycle === activeShift);
    
    return {
      patio: shiftOperators.filter(op => op.category === 'AERODROMO').length,
      vip: shiftOperators.filter(op => op.category === 'VIP').length,
      ilha: shiftOperators.filter(op => op.category === 'ILHA').length,
      disponivel: shiftOperators.filter(op => op.status === 'DISPONÍVEL' && !getActiveMission(op.warName)).length,
      enchendo: shiftOperators.filter(op => op.status === 'ENCHIMENTO').length,
      designado: shiftOperators.filter(op => !!getActiveMission(op.warName) || op.status === 'OCUPADO').length,
      total: shiftOperators.length
    };
  }, [teamMembers, activeShift]);

  const filteredTeam = useMemo(() => {
    const baseList = teamMembers.filter(op => 
      (activeShift === 'GERAL' || op.shift.cycle === activeShift) &&
      op.category === activeCategory &&
      (op.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.warName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return [...baseList].sort((a, b) => {
      const missionA = getActiveMission(a.warName);
      const missionB = getActiveMission(b.warName);
      const isAvailA = a.status === 'DISPONÍVEL' && !missionA;
      const isAvailB = b.status === 'DISPONÍVEL' && !missionB;

      if (isAvailA && !isAvailB) return -1;
      if (!isAvailA && isAvailB) return 1;
      return 0;
    });
  }, [teamMembers, activeShift, activeCategory, searchTerm]);



  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden font-sans">
        
        {/* TOP HUD NAV */}
        <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-8 shrink-0 z-30">
            <div className="flex items-center gap-6">
                
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-md border border-slate-800 shadow-inner">
                    {['AERODROMO', 'VIP', 'ILHA'].map((cat) => (
                        <button 
                            key={cat} 
                            onClick={() => setActiveCategory(cat as OperatorCategory)} 
                            className={`px-5 py-2 rounded-md text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                                activeCategory === cat ? 'bg-emerald-500 text-slate-950 shadow-neon' : 'text-slate-600 hover:text-slate-400'
                            }`}
                        >
                            {cat === 'AERODROMO' ? 'PÁTIO' : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
                    <input 
                        type="text" 
                        placeholder="PESQUISAR..." 
                        className="bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-2 text-[11px] text-white outline-none focus:border-emerald-500/50 w-56 font-bold tracking-widest transition-all" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="flex bg-slate-950 p-1 rounded-md border border-slate-800 gap-1 shadow-sm">
                    {(['GERAL', 'MANHÃ', 'TARDE', 'NOITE'] as ShiftCycle[]).map(cycle => (
                        <button 
                            key={cycle} 
                            onClick={() => setActiveShift(cycle)} 
                            className={`px-4 py-2 rounded-md text-[9px] font-black tracking-widest transition-all ${
                                activeShift === cycle ? 'bg-slate-800 text-emerald-400 border border-emerald-500/10' : 'text-slate-700 hover:text-slate-500'
                            }`}
                        >
                            {cycle}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* TEAM TELEMETRY BAR */}
        <div className="h-16 bg-slate-950 border-b border-slate-800/40 px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-10">
                {/* Localização */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pátio</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white font-mono">{teamStats.patio}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Vip</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white font-mono">{teamStats.vip}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Ilha</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-white font-mono">{teamStats.ilha}</span>
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-800"></div>

                {/* Status Operacional */}
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 bg-emerald-500/5 px-4 py-1.5 rounded-md border border-emerald-500/10">
                        <div className="text-center">
                            <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest block mb-0.5">Disponíveis</span>
                            <span className="text-lg font-black text-emerald-500 font-mono leading-none">{teamStats.disponivel}</span>
                        </div>
                        <Users size={16} className="text-emerald-500 opacity-30" />
                    </div>
                    <div className="flex items-center gap-3 bg-yellow-500/5 px-4 py-1.5 rounded-md border border-yellow-500/10">
                        <div className="text-center">
                            <span className="text-[8px] font-black text-yellow-500/60 uppercase tracking-widest block mb-0.5">Ocupados</span>
                            <span className="text-lg font-black text-yellow-500 font-mono leading-none">{teamStats.enchendo + (teamStats.designado - teamStats.designado /* Ajuste se necessário, mas mantendo a lógica original de contagem */)}</span>
                        </div>
                        <Droplet size={16} className="text-yellow-500 opacity-30" />
                    </div>
                    <div className="flex items-center gap-3 bg-blue-500/5 px-4 py-1.5 rounded-md border border-blue-500/10">
                        <div className="text-center">
                            <span className="text-[8px] font-black text-blue-400/60 uppercase tracking-widest block mb-0.5">Designados</span>
                            <span className="text-lg font-black text-blue-400 font-mono leading-none">{teamStats.designado}</span>
                        </div>
                        <BusFront size={16} className="text-blue-400 opacity-30" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Turno Ativo</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 font-mono">{activeShift}</span>
                    <Zap size={12} className="text-emerald-500 animate-pulse" />
                </div>
            </div>
        </div>

        {/* OPERATIONAL GRID - DISPONÍVEIS NO TOPO */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {filteredTeam.map(op => {
                        const mission = getActiveMission(op.warName);
                        const flightsToday = Math.floor(op.stats.flightsWeekly / 6) + (mission ? 1 : 0);
                        
                        // LÓGICA DE CORES ATUALIZADA
                        const isAvailable = op.status === 'DISPONÍVEL' && !mission;
                        const isDesignated = mission && mission.status === 'DESIGNADO';
                        // "Mão na massa" = Amarelo
                        const isHandsOn = (mission && mission.status === 'ABASTECENDO') || op.status === 'ENCHIMENTO' || op.status === 'OCUPADO';
                        
                        let cardStyle = 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'; // Inativo/Default
                        let badgeStyle = 'bg-slate-800 text-slate-500 border-slate-800';
                        let statusLabel = op.status;

                        if (isAvailable) {
                            cardStyle = 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-[0_10px_25px_rgba(16,185,129,0.2)]';
                            badgeStyle = 'bg-slate-950 text-emerald-400 border-slate-950/5';
                            statusLabel = 'DISPONÍVEL';
                        } else if (isDesignated) {
                            cardStyle = 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_10px_25px_rgba(59,130,246,0.3)]';
                            badgeStyle = 'bg-slate-950 text-blue-400 border-slate-950/5';
                            statusLabel = 'DESIGNADO';
                        } else if (isHandsOn) {
                            cardStyle = 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-[0_10px_25px_rgba(250,204,21,0.3)]';
                            badgeStyle = 'bg-slate-950 text-yellow-400 border-slate-950/5';
                            statusLabel = op.status === 'ENCHIMENTO' ? 'ENCHIMENTO' : 'OCUPADO';
                        }
                        
                        return (
                            <div 
                                key={op.id}
                                className={`group relative flex items-stretch h-[90px] rounded-md border-2 transition-all duration-300 shadow-2xl overflow-hidden ${cardStyle}`}
                            >
                                {/* Foto/Ícone do Operador */}
                                <OperatorAvatar op={op} isActive={isAvailable || isDesignated || isHandsOn} />

                                {/* Conteúdo */}
                                <div className="flex-1 flex flex-col justify-center p-3 pl-4 min-w-0 text-left relative">
                                    
                                    {/* HUD SUPERIOR DIREITO: FROTA + CONTADOR */}
                                    <div className="absolute top-2 right-2 flex items-center gap-2">
                                        {op.assignedVehicle && (
                                            <span className={`text-xl font-mono font-black ${isAvailable || isDesignated || isHandsOn ? 'text-slate-950/60' : 'text-slate-600'}`}>
                                                {op.assignedVehicle.replace('SRV-', '').replace('CTA-', '')}
                                            </span>
                                        )}
                                        <div className={`flex items-center justify-center w-7 h-7 rounded-md font-mono font-black text-sm border shadow-sm ${
                                            isAvailable || isDesignated || isHandsOn
                                                ? 'bg-slate-950 text-white border-slate-900' 
                                                : 'bg-slate-900 text-slate-600 border-slate-800'
                                        }`}>
                                            {flightsToday}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start mb-1 pr-16">
                                        <h3 className="font-black tracking-tighter uppercase leading-none truncate w-full text-xl">
                                            {op.warName}
                                        </h3>
                                        <span className={`text-[7px] font-black uppercase tracking-[0.3em] opacity-40 mt-1 ${isAvailable || isDesignated || isHandsOn ? 'text-slate-950' : 'text-slate-500'}`}>
                                            {op.category}
                                        </span>
                                    </div>

                                    {/* Telemetria de Solo */}
                                    <div className="flex flex-col gap-0.5">
                                        {mission ? (
                                            <div className="flex items-center gap-1.5 font-mono text-base font-black tracking-tighter truncate">
                                                <span className="opacity-70">{mission.destination}</span>
                                                <span className="opacity-20">/</span>
                                                <span>{mission.registration}</span>
                                                <span className="opacity-20">/</span>
                                                <span className="bg-slate-950/10 px-1.5 rounded-md">{mission.positionId}</span>
                                            </div>
                                        ) : (
                                            <div className={`flex items-center gap-1.5 font-mono font-black tracking-tight ${isAvailable || isHandsOn ? 'text-sm' : 'text-xs'}`}>
                                                {isHandsOn ? (
                                                    <Droplet size={14} className="shrink-0 opacity-60 animate-pulse" />
                                                ) : (
                                                    <MapPin size={isAvailable ? 12 : 10} className="shrink-0 opacity-40" />
                                                )}
                                                
                                                <span className="truncate uppercase opacity-60">
                                                    {(() => {
                                                        const currentRealShift = getCurrentShiftCycle();
                                                        const isSameShift = op.shift.cycle === currentRealShift;
                                                        const isCurrentlyActive = op.status !== 'INATIVO'; // Baseado na lógica do useMemo

                                                        if (!isSameShift) return `TURNO ${op.shift.cycle}`;
                                                        if (!isCurrentlyActive) return 'FOLGA';
                                                        if (op.status === 'INTERVALO') return 'INTERVALO';
                                                        return op.lastPosition || 'PÁTIO';
                                                    })()}
                                                </span>

                                                <span className={`px-1.5 rounded-[4px] font-black uppercase border text-[10px] ${badgeStyle}`}>
                                                    {(() => {
                                                        const currentRealShift = getCurrentShiftCycle();
                                                        const isSameShift = op.shift.cycle === currentRealShift;
                                                        const isCurrentlyActive = op.status !== 'INATIVO';

                                                        if (!isSameShift) return op.shift.cycle;
                                                        if (!isCurrentlyActive) return 'FOLGA';
                                                        return statusLabel;
                                                    })()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Decorativo Dinâmico de Avião */}
                                {mission && (
                                    <div className="absolute bottom-[-15px] right-[-15px] opacity-10 pointer-events-none rotate-12 scale-75">
                                        <Plane size={80} className="text-slate-950" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
        </div>
    </div>
  );
};
