import React, { useState, useEffect } from 'react';
import { ViewState, FlightData, Vehicle } from './types';
import { MOCK_FLIGHTS } from './data/mockData';
import { MOCK_VEHICLES } from './data/mockVehicleData';
import { MOCK_TEAM_PROFILES } from './data/mockData';
import { GridOps } from './components/GridOps';
import { Aerodromo } from './components/Aerodromo';
import { OperatorManager } from './components/OperatorManager';
import { TeamManager } from './components/TeamManager';
import { MessageCenter } from './components/MessageCenter';
import { LoginScreen } from './components/LoginScreen';

import { PoolManager } from './components/PoolManager';
import { ReportsView } from './components/ReportsView';
import { Radar } from './components/Radar';
import { DashboardHeader } from './components/DashboardHeader';
import { 
  Plane, Settings, Sun, Moon, Maximize, Minimize, User, Table, 
  LogOut, Users, BusFront, MapPin, Activity,
  Database, MessageSquare, FileBarChart, ListOrdered
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>('GRID_OPS');
  const [globalDensity, setGlobalDensity] = useState(0.803);

  // === ESTADO CENTRALIZADO (A VERDADE ÚNICA) ===
  // Todos os componentes filhos agora leem e escrevem nesta lista
  const [globalFlights, setGlobalFlights] = useState<FlightData[]>(MOCK_FLIGHTS);
  const [globalVehicles, setGlobalVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);



  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [gridOpsInitialTab, setGridOpsInitialTab] = useState<'GERAL' | 'CHEGADA' | 'FILA' | 'DESIGNADOS' | 'ABASTECENDO' | 'FINALIZADO'>('GERAL');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {

  }, []);

  // === SIMULAÇÃO DE VAZÃO DINÂMICA (5 SEGUNDOS) ===
  useEffect(() => {
    const flowTimer = setInterval(() => {
      setGlobalFlights(prev => prev.map(f => {
        if (f.status === 'ABASTECENDO') {
          const baseFlow = f.maxFlowRate || 1000;
          let nextFlow = f.currentFlowRate ?? baseFlow;

          if (nextFlow > 0) {
            // Flutuação natural de +/- 5%
            const fluctuation = (Math.random() - 0.5) * 0.05 * baseFlow;
            nextFlow = Math.max(100, Math.min(baseFlow, nextFlow + fluctuation));

            // Chance de 3% de pausar o abastecimento
            if (Math.random() < 0.03) nextFlow = 0;
          } else {
            // Chance de 15% de retomar o abastecimento
            if (Math.random() < 0.15) nextFlow = baseFlow * 0.7;
          }

          return { ...f, currentFlowRate: Math.round(nextFlow) };
        }
        return f;
      }));
    }, 5000);
    return () => clearInterval(flowTimer);
  }, []);





  const handleLogout = () => {
      setIsAuthenticated(false);
      setView('GRID_OPS');
  };



  const getSidebarClasses = () => {
    const base = "bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-900 flex flex-col justify-between transition-all duration-300 z-30 shadow-2xl overflow-x-hidden shrink-0"; // Removido absolute e h-full, ajustado z-index
    return `${base} ${isSidebarHovered ? "w-48" : "w-20"}`;
  };

  const textVisibilityClass = isSidebarHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 hidden';

  if (!isAuthenticated) return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;

  const handleSidebarNavigation = (target: ViewState, tab?: 'FILA') => {
      setView(target);
      if (tab) {
          setGridOpsInitialTab(tab);
      }
  };

  const NavButton = ({ target, icon: Icon, label, tab }: { target: ViewState, icon: any, label: string, tab?: 'FILA' }) => (
    <button 
      onClick={() => handleSidebarNavigation(target, tab)}
      className={`w-full flex items-center transition-all relative whitespace-nowrap overflow-hidden group h-14 
        hover:bg-emerald-500/[0.06] dark:hover:bg-emerald-500/[0.08] ${
        view === target && (!tab || gridOpsInitialTab === tab)
          ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/[0.03]' 
          : 'text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-300'
      }`}
    >
      <div className={`absolute left-0 w-[3px] transition-all duration-300 rounded-r-md ${
        view === target && (!tab || gridOpsInitialTab === tab)
          ? 'h-6 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] opacity-100' 
          : 'h-0 bg-slate-300 dark:bg-slate-800 opacity-0'
      }`}></div>

      <div className="w-20 flex items-center justify-center shrink-0">
        <Icon 
          size={20} 
          className={`transition-all duration-300 ${
              view === target && (!tab || gridOpsInitialTab === tab) ? 'drop-shadow-[0_0_5px_rgba(16,185,129,0.6)]' : 'group-hover:text-emerald-500'
          }`} 
        />
      </div>

      <span className={`font-black text-[10px] uppercase tracking-[0.1em] transition-all duration-300 ${textVisibilityClass} ${
          view === target && (!tab || gridOpsInitialTab === tab) ? 'text-white' : ''
      }`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen overflow-hidden flex flex-col`}>
      <DashboardHeader isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      <div className="flex flex-1 h-full w-full bg-slate-950 text-slate-200 transition-colors duration-500 font-sans overflow-hidden">

        <aside 
            className={getSidebarClasses()}
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
        >
          {/* O conteúdo da sidebar permanece o mesmo, mas agora ela está no fluxo correto */}
          <div className="flex flex-col h-full justify-between">
              <div>


                <nav className="py-4 space-y-1">
                  <NavButton target="GRID_OPS" icon={Table} label="Malha" />
                  <NavButton target="RADAR" icon={Activity} label="Radar" />
                  <NavButton target="AERODROMO" icon={MapPin} label="Aeródromo" />
                  <NavButton target="OPERATORS" icon={BusFront} label="Frotas" />
                  <NavButton target="TEAM" icon={Users} label="Equipe" />
                  <NavButton target="REPORTS" icon={FileBarChart} label="Relatórios" />
                  <NavButton target="MESSAGES" icon={MessageSquare} label="Mensagens" />
                </nav>
              </div>

              <div className="py-4 border-t border-slate-800 dark:border-slate-900 space-y-1">
                 <button className="w-full flex items-center text-slate-400 dark:text-slate-600 hover:text-white hover:bg-emerald-500/[0.06] transition-all overflow-hidden group h-14">
                    <div className="w-20 flex items-center justify-center shrink-0">
                      <Settings size={20} className="transition-colors duration-300 group-hover:text-emerald-500" />
                    </div>
                    <span className={`font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${textVisibilityClass}`}>
                        Ajustes
                    </span>
                 </button>
                 <button onClick={handleLogout} className="w-full flex items-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all overflow-hidden group h-14">
                    <div className="w-20 flex items-center justify-center shrink-0">
                      <LogOut size={20} className="transition-colors duration-300" />
                    </div>
                    <span className={`font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${textVisibilityClass}`}>
                        Sair
                    </span>
                 </button>
              </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* O DashboardHeader foi movido para cima */}
          <div className="flex-1 overflow-hidden relative">
              {/* PASSANDO O ESTADO GLOBAL PARA OS COMPONENTES */}
              {view === 'GRID_OPS' && (
                <GridOps 
                  flights={globalFlights} 
                  onUpdateFlights={setGlobalFlights} 
                  vehicles={globalVehicles}
                  onNavigate={setView}
                  initialTab={gridOpsInitialTab}
                />
              )}
              {view === 'RADAR' && <Radar flights={globalFlights} />}
              {view === 'AERODROMO' && <Aerodromo />}
              {view === 'OPERATORS' && <OperatorManager density={globalDensity} vehicles={globalVehicles} onUpdateVehicles={setGlobalVehicles} operators={MOCK_TEAM_PROFILES} flights={globalFlights} />}
              {view === 'TEAM' && <TeamManager flights={globalFlights} />}
              {view === 'MESSAGES' && <MessageCenter />}
              {/* RELATÓRIOS AGORA RECEBEM OS DADOS GLOBAIS */}
              {view === 'REPORTS' && <ReportsView flights={globalFlights} />}

          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
