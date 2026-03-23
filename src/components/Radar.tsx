
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Radio, Search, Minimize2
} from 'lucide-react';
import { FlightData, FlightStatus } from '../types';
import { MOCK_FLIGHTS } from '../data/mockData';

interface RadarProps {
  flights?: FlightData[];
}

interface RadarTarget extends FlightData {
  angle: number;
  distance: number;
  lastDetected: number;
}

export const Radar: React.FC<RadarProps> = ({ flights = MOCK_FLIGHTS }) => {
  const [sweepAngle, setSweepAngle] = useState(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  
  // Simulação de posições baseada no status
  const radarTargets = useMemo(() => {
    return flights.map((f, index) => {
      const angle = (parseInt(f.id.replace(/\D/g, '') || '0') * 137.5) % 360;
      let distance = 80;
      
      switch (f.status) {
        case FlightStatus.ABASTECENDO: distance = 15 + (index % 10); break;
        case FlightStatus.AGUARDANDO:
        case FlightStatus.DESIGNADO: distance = 35 + (index % 15); break;
        case FlightStatus.FILA: distance = 60 + (index % 20); break;
        case FlightStatus.CHEGADA: distance = 85 + (index % 10); break;
        case FlightStatus.FINALIZADO: distance = 110 + (index % 30); break;
        default: distance = 150;
      }

      return {
        ...f,
        angle,
        distance,
        lastDetected: Date.now()
      };
    });
  }, [flights]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle(prev => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const filteredTargets = useMemo(() => {
    if (filter === 'ALL') return radarTargets;
    return radarTargets.filter(t => t.status === filter);
  }, [radarTargets, filter]);

  const selectedTarget = useMemo(() => 
    radarTargets.find(t => t.id === selectedTargetId), 
    [radarTargets, selectedTargetId]
  );

  return (
    <div className="w-full h-full flex bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      
      {/* ÁREA PRINCIPAL - MAPA FULL */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
        
         <div className="w-full h-full bg-white relative">
           <iframe 
             src="https://www.airnavradar.com/?widget=1&z=13&hideAirportWeather=true&hideAirportCard=true&hideFlightCard=true&showLabels=true&showAirlineLogo=true&showAircraftModel=true&showRegistration=true&airport=sbgr&class=A,C,M" 
             width="100%" 
             height="100%" 
             frameBorder="0"
             title="AirNav Radar Live Feed"
             className="w-full h-full"
             scrolling="no"
           ></iframe>
           
           {/* BUSCA OVERLAY */}
           <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
             <div className="relative group">
               <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
               <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex items-center px-4 py-3">
                 <Search size={18} className="text-slate-500 mr-3" />
                 <input 
                   type="text" 
                   placeholder="BUSCAR AERONAVE OU VOO (EX: PR-XMA)..." 
                   className="bg-transparent border-none outline-none text-sm font-black text-white placeholder:text-slate-600 w-full uppercase tracking-widest"
                 />
                 <div className="flex items-center gap-2 ml-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">LIVE</span>
                 </div>
               </div>
             </div>
           </div>

           <div className="absolute top-4 left-4 bg-emerald-500 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse z-20">
             AIRNAV LIVE: SBGR
           </div>
           <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-lg text-[9px] text-slate-400 font-mono z-20">
             FONTE: AIRNAV RADARBOX
           </div>
         </div>

        {/* INFO OVERLAY (Mesmo da versão anterior) */}
        <AnimatePresence>
          {selectedTarget && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="absolute right-8 top-8 w-72 bg-slate-950/80 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl p-6 z-30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-mono tracking-tighter leading-none">{selectedTarget.registration}</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">{selectedTarget.airline}</p>
                </div>
                <button onClick={() => setSelectedTargetId(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"><Minimize2 size={16} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Voo</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedTarget.flightNumber}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Posição</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedTarget.positionId}</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black text-white uppercase">{selectedTarget.status}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800 flex gap-2">
                  <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-black py-2.5 rounded-xl transition-all uppercase tracking-widest">Abrir Ficha</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

