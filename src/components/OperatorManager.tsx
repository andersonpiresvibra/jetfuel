import React, { useState, useMemo } from 'react';
import { 
    Truck, Search, Droplet, MousePointer2, 
    User, Layers, ShieldCheck, ShieldAlert, Wrench,
    LayoutGrid, List, ChevronUp, ChevronDown, Power
} from 'lucide-react';
import { Vehicle, VehicleType, VehicleStatus, OperatorProfile, FlightData } from '../types';
import { VehicleActionModal } from './VehicleActionModal';
import { OperatorCell } from './OperatorCell';

interface OperatorManagerProps {
  density: number;
  vehicles: Vehicle[];
  onUpdateVehicles: (vehicles: Vehicle[]) => void;
  operators: OperatorProfile[];
  flights: FlightData[];
}

export const OperatorManager: React.FC<OperatorManagerProps> = ({ density, vehicles, onUpdateVehicles, operators, flights }) => {
  const [activeTab, setActiveTab] = useState<VehicleType>('SERVIDOR');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  
  // Filters State
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');
  const [manufacturerFilter, setManufacturerFilter] = useState<string | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Vehicle | string; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isStatusModalOnly, setIsStatusModalOnly] = useState(false);

  const manufacturers = useMemo(() => {
    const set = new Set(vehicles.map(v => v.manufacturer));
    return Array.from(set);
  }, [vehicles]);

  // Sync vehicles with flights
  const syncedVehicles = useMemo(() => {
      return vehicles.map(v => {
          // Find if this vehicle is assigned to an active flight
          const activeFlight = flights.find(f => f.fleet === v.id && f.status !== 'FINALIZADO' && f.status !== 'CANCELADO');
          
          if (activeFlight) {
              return {
                  ...v,
                  status: activeFlight.status === 'ABASTECENDO' ? 'ENCHIMENTO' : 'OCUPADO',
                  operatorName: activeFlight.operator || v.operatorName,
                  currentPosition: activeFlight.positionId || v.currentPosition
              } as Vehicle;
          }
          
          // If not in active flight, but was marked occupied, check if we should free it?
          // For now, let's assume if no flight, it reverts to available or keeps manual status if not flight-related
          // But user asked for sync. So if no flight, it should probably be available if it was occupied by flight.
          if (v.status === 'OCUPADO' || v.status === 'ENCHIMENTO') {
               return {
                   ...v,
                   status: 'DISPONÍVEL',
                   // Keep operator name if assigned manually, or clear it? 
                   // Usually operator stays with vehicle.
               } as Vehicle;
          }

          return v;
      });
  }, [vehicles, flights]);

  const filteredVehicles = useMemo(() => {
    return syncedVehicles.filter(v => {
      const matchesTab = v.type === activeTab;
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = 
        v.id.toLowerCase().includes(lowerSearchTerm) || 
        v.manufacturer.toLowerCase().includes(lowerSearchTerm) ||
        (v.operatorName || '').toLowerCase().includes(lowerSearchTerm) ||
        (v.currentPosition || '').toLowerCase().includes(lowerSearchTerm) ||
        v.status.toLowerCase().includes(lowerSearchTerm);

      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      const matchesManufacturer = manufacturerFilter === 'ALL' || v.manufacturer === manufacturerFilter;
      
      return matchesTab && matchesSearch && matchesStatus && matchesManufacturer;
    });
  }, [vehicles, activeTab, searchTerm, statusFilter, manufacturerFilter]);

  const sortedVehicles = useMemo(() => {
    let sortableItems = [...filteredVehicles];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof Vehicle];
            const bValue = b[sortConfig.key as keyof Vehicle];

            if (aValue === undefined || bValue === undefined) return 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (aValue.toLowerCase() < bValue.toLowerCase()) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue.toLowerCase() > bValue.toLowerCase()) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                 if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
            }
            return 0;
        });
    }
    return sortableItems;
  }, [filteredVehicles, sortConfig]);

  const requestSort = (key: keyof Vehicle | string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    onUpdateVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'DISPONÍVEL': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'OCUPADO': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'INATIVO': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'ENCHIMENTO': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getCtaPosition = (vehicle: Vehicle) => {
    switch (vehicle.status) {
      case 'DISPONÍVEL':
        return vehicle.lastPosition || 'N/D';
      case 'ENCHIMENTO':
        return 'ILHA';
      case 'OCUPADO':
        return vehicle.currentPosition || 'N/D';
      case 'INATIVO':
        return vehicle.observations || 'MANUTENÇÃO';
      default:
        return 'N/D';
    }
  };

  const renderTankLevel = (vehicle: Vehicle) => {
    const current = vehicle.currentVolume || 0;
    const capacity = vehicle.capacity || 20000;
    const percentage = (current / capacity) * 100;
    const deadVolume = 300;
    const deadVolumePct = (deadVolume / capacity) * 100;
    
    let colorClass = 'bg-emerald-500';
    let isFlashing = false;

    if (current > capacity) {
        colorClass = 'bg-red-600';
        isFlashing = true;
    } else if (current <= 5000) {
        colorClass = 'bg-red-600';
        isFlashing = current <= deadVolume;
    } else if (percentage >= 75) {
        colorClass = 'bg-emerald-500';
    } else if (percentage >= 50) {
        colorClass = 'bg-blue-500';
    } else {
        colorClass = 'bg-amber-500';
    }

    return (
      <div className="relative w-16 h-full min-h-[12rem] bg-slate-900 rounded-lg border-2 border-slate-700 flex items-end overflow-hidden mx-auto">
        {/* Fuel Level */}
        <div 
          style={{ height: `${Math.min(percentage, 100)}%` }}
          className={`w-full ${colorClass} transition-all duration-700 z-0 ${isFlashing ? 'animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]' : ''}`}>
        </div>

        {/* Dead Volume Zone Marker */}
        <div 
          className={`absolute bottom-0 left-0 right-0 border-t-2 border-dashed z-10 transition-colors duration-500 ${current <= deadVolume ? 'bg-red-600/80 border-red-500' : 'bg-red-900/20 border-red-500/30'}`}
          style={{ height: `${Math.max(deadVolumePct, 2)}%` }}
        >
           {current <= deadVolume && (
               <div className="absolute -top-5 left-0 right-0 flex justify-center">
                 <span className="text-[7px] font-black uppercase tracking-widest px-1 rounded backdrop-blur-sm text-white bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                   V. Morto
                 </span>
               </div>
           )}
        </div>

        {/* Overcapacity Alert */}
        {current > capacity && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-20">
                <ShieldAlert className="w-8 h-8 text-red-500 animate-ping" />
            </div>
        )}

        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-white font-black text-xl" style={{ writingMode: 'vertical-rl', textShadow: '0 0 5px black' }}>
            {Math.min(percentage, 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">
      <VehicleActionModal 
        vehicle={selectedVehicle}
        onClose={() => { setSelectedVehicle(null); setIsStatusModalOnly(false); }}
        onUpdateVehicle={handleUpdateVehicle}
        density={density}
        operators={operators}
        showStatusOnly={isStatusModalOnly}
      />
      {/* HEADER & TABS */}
      <header className="px-8 py-3 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
        <div className="flex items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <Truck className="text-amber-500" size={24} /> MONITOR FROTAS
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-md border border-slate-800/50">
              <button 
                onClick={() => setActiveTab('SERVIDOR')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SERVIDOR' ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Layers size={12} /> SERVIDORES
              </button>
              <button 
                onClick={() => setActiveTab('CTA')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'CTA' ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Droplet size={12} /> CTAs
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800 mr-2">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-slate-800 text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('TABLE')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'TABLE' ? 'bg-slate-800 text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <List size={16} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text" 
                placeholder="Localizar frota..." 
                className="w-40 bg-slate-950 border border-slate-800 rounded-md pl-10 pr-4 py-2 text-[11px] text-white outline-none focus:border-amber-500/50 transition-all" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* FILTROS AVANÇADOS */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Status:</span>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold text-slate-400 outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="ALL">TODOS</option>
              <option value="DISPONÍVEL">DISPONÍVEL</option>
              <option value="OCUPADO">OCUPADO</option>
              <option value="INATIVO">INATIVO</option>
              <option value="ENCHIMENTO">ENCHIMENTO</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Fabricante:</span>
            <select 
              value={manufacturerFilter} 
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-slate-400 outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="ALL">TODOS</option>
              {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* CONTENT AREA - PURELY INFORMATIONAL */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'GRID' ? 'p-8' : 'px-8'}`}>
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {sortedVehicles.map((vehicle) => {
              if (activeTab === 'CTA') {
                return (
                  <div key={vehicle.id} onClick={() => setSelectedVehicle(vehicle)} className={`bg-[#0a0f1d] border rounded-md p-4 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer ${vehicle.isActive === false ? 'border-red-500/20 opacity-70' : 'border-slate-800 hover:border-amber-500/30'}`}>
                    {/* Top Section */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-3xl font-black text-white font-mono tracking-tighter leading-none">{vehicle.id}</span>
                        <p className="text-xs font-bold text-blue-400 font-mono mt-1">{getCtaPosition(vehicle)}</p>
                      </div>
                      <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider self-start ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </div>
                    </div>

                    {/* Middle Section */}
                    <div className="flex-1 flex items-stretch justify-center my-4">
                        <div className="flex gap-4 w-full items-stretch">
                            <div className="flex justify-center shrink-0">
                                {renderTankLevel(vehicle)}
                            </div>
                            <div className="flex-1 flex flex-col justify-between gap-2">
                                {/* Litros */}
                                <div className="bg-slate-900/40 rounded-lg p-2 border border-slate-800/60">
                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1 text-center tracking-widest">LITROS</div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-slate-500 uppercase font-bold">Contábil</span>
                                            <span className="font-mono text-white text-sm font-bold">{(vehicle.currentVolume || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[7px] text-slate-500 uppercase font-bold">Real</span>
                                            <span className="font-mono text-emerald-400 text-sm font-bold">{(Math.max(0, (vehicle.currentVolume || 0) - 300)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Kg */}
                                <div className="bg-slate-900/40 rounded-lg p-2 border border-slate-800/60">
                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1 text-center tracking-widest">KG</div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-slate-500 uppercase font-bold">Contábil</span>
                                            <span className="font-mono text-amber-500 text-sm font-bold">{((vehicle.currentVolume || 0) * density).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[7px] text-slate-500 uppercase font-bold">Real</span>
                                            <span className="font-mono text-amber-500 text-sm font-bold">{(Math.max(0, (vehicle.currentVolume || 0) - 300) * density).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Lbs */}
                                <div className="bg-slate-900/40 rounded-lg p-2 border border-slate-800/60">
                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1 text-center tracking-widest">LBS</div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] text-slate-500 uppercase font-bold">Contábil</span>
                                            <span className="font-mono text-blue-400 text-sm font-bold">{((vehicle.currentVolume || 0) * density * 2.20462).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[7px] text-slate-500 uppercase font-bold">Real</span>
                                            <span className="font-mono text-blue-400 text-sm font-bold">{(Math.max(0, (vehicle.currentVolume || 0) - 300) * density * 2.20462).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-3">
                        {vehicle.operatorName ? (
                          <OperatorCell operatorName={vehicle.operatorName} />
                        ) : (
                          <button onClick={() => setSelectedVehicle(vehicle)} className="text-xs font-black text-slate-600 uppercase hover:text-amber-500 transition-colors">DESIGNAR</button>
                        )}
                      </div>
                      <button className={`p-2 rounded-md transition-all duration-200 ${vehicle.isActive === false ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40'}`}>
                        <Power size={16} />
                      </button>
                    </div>
                  </div>
                )
              } else { // SERVIDOR card layout
                return (
                  <div key={vehicle.id} onClick={() => { setSelectedVehicle(vehicle); setIsStatusModalOnly(false); }} className={`bg-[#0a0f1d] border rounded-md flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer ${vehicle.status === 'INATIVO' ? 'border-red-500/30' : 'border-slate-800 hover:border-amber-500/30'}`}>
                    {/* Top Section */}
                    <div className="flex justify-between items-start p-4">
                      <div>
                        <span className="text-3xl font-black text-amber-500 font-mono tracking-tighter leading-none">{vehicle.id}</span>
                        <p className="text-xs font-bold text-slate-500 font-sans mt-1">{vehicle.manufacturer}</p>
                      </div>
                      <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider self-start ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </div>
                    </div>

                    {/* Operator Section */}
                    <div className="border-y border-dashed border-slate-800 px-4 py-2 flex items-center justify-center min-h-[60px]">
                      {vehicle.status === 'INATIVO' ? (
                        <div className="text-center">
                           <Wrench size={16} className="text-red-500 mx-auto mb-1"/>
                           <span className="text-[10px] font-black text-red-500 uppercase">MANUTENÇÃO</span>
                        </div>
                      ) : vehicle.operatorName ? (
                        <div className="flex items-center gap-3 w-full justify-start">
                            <OperatorCell operatorName={vehicle.operatorName} />
                            <span className="text-[10px] font-mono text-blue-400 truncate">| {vehicle.currentPosition || 'PÁTIO'}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <MousePointer2 size={16} className="text-slate-600 mx-auto mb-1"/>
                          <span className="text-[10px] font-black text-slate-600 uppercase">AGUARDANDO OPERADOR</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-2">
                      <div className="p-3 text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Vazão Máx</span>
                        <p className="text-white font-mono font-bold text-lg">{vehicle.maxFlowRate} <span className="text-xs text-slate-400">L/min</span></p>
                      </div>
                      <div className="p-3 text-center border-l border-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Plataforma</span>
                        <p className={`font-bold text-lg flex items-center justify-center gap-2 ${vehicle.hasPlatform ? 'text-emerald-500' : 'text-red-500'}`}>
                          <ShieldCheck size={14}/>
                          {vehicle.hasPlatform ? 'OPERANTE' : 'INOP'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#0a0f1d] z-10">
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('id')}>
                    <div className="flex items-center gap-1">
                      <span>Frota</span>
                      {sortConfig?.key === 'id' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('manufacturer')}>
                    <div className="flex items-center gap-1">
                      <span>Fabricante</span>
                      {sortConfig?.key === 'manufacturer' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('operatorName')}>
                    <div className="flex items-center gap-1">
                      <span>Operador</span>
                      {sortConfig?.key === 'operatorName' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('currentPosition')}>
                    <div className="flex items-center gap-1">
                      <span>Posição</span>
                      {sortConfig?.key === 'currentPosition' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  {activeTab === 'CTA' && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer text-right" onClick={() => requestSort('currentVolume')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>V. Atual</span>
                      {sortConfig?.key === 'currentVolume' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>}
                  {activeTab === 'CTA' && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">V. Real (L)</th>}
                  {activeTab === 'CTA' && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">V. Kg</th>}
                  {activeTab === 'CTA' && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">V. Lbs</th>}
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer text-right" onClick={() => requestSort('maxFlowRate')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Vazão Máx</span>
                      {sortConfig?.key === 'maxFlowRate' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  {activeTab === 'CTA' && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer text-right" onClick={() => requestSort('capacity')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>V. Litros</span>
                      {sortConfig?.key === 'capacity' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>}
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer" onClick={() => requestSort('status')}>
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedVehicles.map((v) => {
                  const currentVolumeKg = v.currentVolume ? (v.currentVolume * density).toFixed(0) : 0;
                  const currentVolumeLbs = v.currentVolume ? (v.currentVolume * density * 2.20462).toFixed(0) : 0;

                  return (
                  <tr key={v.id} onClick={() => { setSelectedVehicle(v); setIsStatusModalOnly(false); }} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group cursor-pointer`}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-black text-white font-mono">{v.id}</span>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">{v.manufacturer}</td>
                    <td className="px-4 py-3">
                      <OperatorCell operatorName={v.operatorName} />
                    </td>
                    <td className="px-4 py-3 text-[10px] font-black text-blue-400 font-mono">{v.currentPosition || '--'}</td>
                    
                    {/* CTA Columns */}
                    {activeTab === 'CTA' && <td className="px-4 py-3 text-sm font-mono text-white text-right">{v.currentVolume?.toLocaleString() || '0'}</td>}
                    {activeTab === 'CTA' && (
                        <td className="px-4 py-3 text-sm font-mono text-emerald-400 text-right font-bold">
                            {(Math.max(0, (v.currentVolume || 0) - 300)).toLocaleString()}
                        </td>
                    )}
                    {activeTab === 'CTA' && <td className="px-4 py-3 text-sm font-mono text-slate-400 text-right">{currentVolumeKg}</td>}
                    {activeTab === 'CTA' && <td className="px-4 py-3 text-sm font-mono text-slate-500 text-right">{currentVolumeLbs}</td>}

                    <td className="px-4 py-3 text-xs font-black text-white font-mono text-right">{v.maxFlowRate} L/min</td>
                    
                    {activeTab === 'CTA' && (
                      <td className="px-4 py-3 text-xs font-black text-amber-500 font-mono text-right">
                        {v.capacity?.toLocaleString()} L
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getStatusColor(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                       <button onClick={(e) => { e.stopPropagation(); setSelectedVehicle(v); setIsStatusModalOnly(true); }} className={`p-2 rounded-md transition-all duration-200 ${v.isActive === false ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40'}`}>
                          <Power size={14} />
                       </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {sortedVehicles.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
            <Truck size={64} className="text-slate-600 mb-6" />
            <p className="text-xl font-black text-slate-600 uppercase tracking-[0.5em]">NENHUM ATIVO ENCONTRADO</p>
          </div>
        )}
      </div>
    </div>
  );
};
