import React, { useState, useEffect } from 'react';
import { Sun, Moon, User, Edit2, Maximize, Minimize, Plane } from 'lucide-react';

interface DashboardHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [densityN, setDensityN] = useState(0.803);
  const [densityI, setDensityI] = useState(0.795);
    const [temperature, setTemperature] = useState(24.5);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'H');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }).toUpperCase();
  };

  return (
    <>
      <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <Plane className="text-white" size={20} />
            </div>
            <span className="font-black text-sm tracking-tighter text-white uppercase">
              JETFUEL-SIM
            </span>
          </div>

          <div className="w-px h-10 bg-slate-800"></div>

          <div>
              <h1 className="text-4xl font-bold text-white tracking-tighter font-mono">{formatTime(currentTime)}</h1>
              <p className="text-xs text-slate-400 font-bold tracking-widest">{formatDate(currentTime)}</p>
          </div>

          <div className="w-px h-10 bg-slate-800"></div>

          <div className="flex items-center gap-6">
              <div className="text-sm">
                  <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold text-xs">DENS. (N)</span>
                      <span className="font-mono font-bold text-emerald-400 text-lg">{densityN.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500 font-bold text-xs">DENS. (I)</span>
                      <span className="font-mono font-bold text-white">{densityI.toFixed(2)}</span>
                  </div>
              </div>
              <div>
                  <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold text-xs">TEMP.</span>
                      <span className="font-mono font-bold text-white text-lg">{temperature.toFixed(1)}°C</span>
                  </div>
                  <button onClick={() => setIsEditModalOpen(true)} className="mt-1 w-full text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/50 rounded-md py-1 transition-colors bg-slate-900/50 hover:bg-emerald-950/20">
                      Editar
                  </button>
              </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleFullscreen} className="p-2.5 text-slate-500 hover:text-amber-500 hover:bg-slate-900 rounded-md transition-all">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button onClick={toggleDarkMode} className="p-2.5 text-slate-500 hover:text-amber-500 hover:bg-slate-900 rounded-md transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="w-px h-8 bg-slate-800 mx-2"></div>
          <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-500 transition-colors">OPERADOR_ADMIN</span>
                  <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase block">Líder de Solo</span>
              </div>
              <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                  <User size={18} className="text-slate-400 group-hover:text-white" />
              </div>
          </div>
        </div>
      </header>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-md shadow-2xl w-full max-w-xs p-6">
            <h2 className="text-lg font-bold text-white text-center mb-1">Editar Parâmetros</h2>
            <p className="text-xs text-slate-400 text-center mb-6">Ajuste os valores de densidade e temperatura.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400">Densidade (N)</label>
                <input 
                  type="number"
                  step="0.001"
                  value={densityN}
                  onChange={(e) => setDensityN(parseFloat(e.target.value))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Densidade (I)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={densityI}
                  onChange={(e) => setDensityI(parseFloat(e.target.value))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400">Temperatura (°C)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-md text-sm font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={() => setIsEditModalOpen(false)} 
                    className="px-4 py-2 rounded-md text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-600 transition-colors"
                >
                    Salvar
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
