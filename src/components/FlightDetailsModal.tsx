
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FlightData, FlightLog, OperatorProfile, Vehicle, FlightStatus } from '../types';
import { MOCK_TEAM_PROFILES } from '../data/mockData';
import useOnClickOutside from '../hooks/useOnClickOutside';
import { StatusBadge } from './SharedStats';
import { DesigOpr } from './desigopr';
import { 
  Plane, X, MapPin, Clock, Hash, BusFront, Droplet, 
  UserPlus, RefreshCw, Pen, Anchor, Calendar, Tag, Activity, Users, AlertCircle, Globe, GripHorizontal,
  MessageCircle, UserCheck, Plus, FileText, History
} from 'lucide-react';

interface FlightDetailsModalProps {
  flight: FlightData;
  onClose: () => void;
  onUpdate: (updatedFlight: FlightData) => void;
  onOpenChat?: () => void;
  vehicles: Vehicle[];
}

export const FlightDetailsModal: React.FC<FlightDetailsModalProps> = ({ flight, onClose, onUpdate, onOpenChat, vehicles }) => {
  const [localFlight, setLocalFlight] = useState<FlightData>(flight);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const currentVehicle = useMemo(() => {
    if (!vehicles) return null;
    return vehicles.find(v => v.id === localFlight.fleet) || null;
  }, [vehicles, localFlight.fleet]);

  const vehicleForModal = useMemo(() => {
    if (currentVehicle) return currentVehicle;
    return {
      id: localFlight.fleet || "N/A",
      type: localFlight.vehicleType || 'SERVIDOR',
      status: 'DISPONÍVEL',
      manufacturer: '',
      maxFlowRate: 0,
      hasPlatform: false
    } as Vehicle;
  }, [currentVehicle, localFlight.vehicleType, localFlight.fleet]);

  const handleAssignOperator = (operatorId: string) => {
    const operator = MOCK_TEAM_PROFILES.find(op => op.id === operatorId);
    if (!operator) return;
    
    const updatedFlight = {
      ...localFlight,
      operator: operator.warName,
      status: FlightStatus.DESIGNADO,
      designationTime: new Date(),
    };
    
    const newLog: FlightLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'MANUAL',
      message: `Operador ${operator.warName} designado via modal.`,
      author: 'GESTOR_MESA'
    };
    updatedFlight.logs = [...(updatedFlight.logs || []), newLog];

    setLocalFlight(updatedFlight);
    onUpdate(updatedFlight);
    setIsAssignModalOpen(false);
  };
  
  // Window Position State for Draggable Popup - Lazy Initialization to prevent jumping
  const [position, setPosition] = useState(() => {
      if (typeof window !== 'undefined') {
          return { 
              x: Math.max(0, window.innerWidth / 2 - 220),
              y: Math.max(20, window.innerHeight / 2 - 180)
          };
      }
      return { x: 0, y: 0 };
  });

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  const designationRef = useRef<HTMLDivElement>(null);

  // Editing States
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [destInput, setDestInput] = useState(flight.destination);

  const [isEditingReg, setIsEditingReg] = useState(false);
  const [regInput, setRegInput] = useState(flight.registration);

  const [isEditingPos, setIsEditingPos] = useState(false);
  const [posInput, setPosInput] = useState(flight.positionId);
  
  const [isEditingChock, setIsEditingChock] = useState(false);
  const [chockInput, setChockInput] = useState(flight.eta); 

  const [isEditingEtd, setIsEditingEtd] = useState(false);
  const [etdInput, setEtdInput] = useState(flight.etd); 

  const [isEditingOperator, setIsEditingOperator] = useState(false);
  const [operatorInput, setOperatorInput] = useState(flight.operator || '');

  const [isEditingSupport, setIsEditingSupport] = useState(false);
  const [supportInput, setSupportInput] = useState(flight.supportOperator || '');

  const [showOperatorList, setShowOperatorList] = useState(false);
  const [showSupportOperatorList, setShowSupportOperatorList] = useState(false);

  const availableOperators = useMemo(() => {
    const isRemote = flight.positionId.startsWith('5') || flight.positionId.startsWith('6') || flight.positionId.startsWith('7');

    return MOCK_TEAM_PROFILES
      .filter(op => {
        if (op.status !== 'DISPONÍVEL') return false;
        if (isRemote && op.category !== 'ILHA' && op.category !== 'VIP') return false; // Simplificado para ILHA/VIP em remotas
        return true;
      })
      .sort((a, b) => {
        // Lógica de Sorteio: por enquanto, apenas alfabética.
        return a.warName.localeCompare(b.warName);
      });
  }, [flight.positionId]);

  useOnClickOutside(designationRef, () => {
    setShowOperatorList(false);
    setShowSupportOperatorList(false);
  });

  useEffect(() => {
    setLocalFlight(flight);
    setDestInput(flight.destination);
    setRegInput(flight.registration);
    setPosInput(flight.positionId);
    setChockInput(flight.eta);
    setEtdInput(flight.etd);
    setOperatorInput(flight.operator || '');
    setSupportInput(flight.supportOperator || '');
  }, [flight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // If an input is focused, let it handle its own Enter
        if (document.activeElement?.tagName === 'INPUT') return;
        onUpdate(localFlight);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localFlight, onUpdate, onClose]);

  // DRAG LOGIC
  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
        isDragging.current = true;
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
      });
  };

  const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
  };

  // Helper para gerar log de auditoria
  const generateAuditLog = (field: string, oldValue: string | number | undefined, newValue: string | number | undefined): FlightLog => ({
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'MANUAL',
      message: `${field} alterado manualmente: ${oldValue || '--'} > ${newValue || '--'}`,
      author: 'GESTOR_MESA'
  });

  const handleSaveDest = () => {
    const formatted = destInput.toUpperCase().slice(0, 4);
    if (formatted === localFlight.destination) { setIsEditingDest(false); return; }

    const newLog = generateAuditLog('Destino', localFlight.destination, formatted);
    const updated = { 
        ...localFlight, 
        destination: formatted,
        logs: [...localFlight.logs, newLog]
    };
    
    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingDest(false);
  };

  const handleSaveReg = () => {
    if (regInput === localFlight.registration) { setIsEditingReg(false); return; }

    const newLog = generateAuditLog('Prefixo', localFlight.registration, regInput);
    const updated = { 
        ...localFlight, 
        registration: regInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingReg(false);
  };

  const handleSavePos = () => {
    if (posInput === localFlight.positionId) { setIsEditingPos(false); return; }

    const newLog = generateAuditLog('Posição', localFlight.positionId, posInput);
    const updated = { 
        ...localFlight, 
        positionId: posInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingPos(false);
  };

  const handleSaveChock = () => {
      if (chockInput === localFlight.eta) { setIsEditingChock(false); return; }

      const newLog = generateAuditLog('Horário Calço', localFlight.eta, chockInput);
      const updated = { 
          ...localFlight, 
          eta: chockInput,
          logs: [...localFlight.logs, newLog]
      };

      setLocalFlight(updated);
      onUpdate(updated);
      setIsEditingChock(false);
  };

  const handleSaveEtd = () => {
    if (etdInput === localFlight.etd) { setIsEditingEtd(false); return; }

    const newLog = generateAuditLog('ETD', localFlight.etd, etdInput);
    const updated = { 
        ...localFlight, 
        etd: etdInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingEtd(false);
  };

  const handleSaveOperator = () => {
    if (operatorInput === localFlight.operator) { setIsEditingOperator(false); return; }

    const newLog = generateAuditLog('Operador (Líder)', localFlight.operator, operatorInput);
    const updated = { 
        ...localFlight, 
        operator: operatorInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingOperator(false);
  };

  const handleSaveSupport = () => {
    if (supportInput === localFlight.supportOperator) { setIsEditingSupport(false); return; }

    const newLog = generateAuditLog('Apoio Técnico', localFlight.supportOperator, supportInput);
    const updated = { 
        ...localFlight, 
        supportOperator: supportInput,
        logs: [...localFlight.logs, newLog]
    };

    setLocalFlight(updated);
    onUpdate(updated);
    setIsEditingSupport(false);
  };

  const isFinished = localFlight.status === FlightStatus.FINALIZADO || localFlight.status === FlightStatus.CANCELADO;

  return (
    <>
    <motion.div 
        ref={windowRef}
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ left: position.x, top: position.y }}
        className="fixed z-50 w-full max-w-[440px] flex flex-col rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] border border-white/10 bg-slate-900/98 backdrop-blur-2xl overflow-hidden"
    >
        {/* HEADER COMPACT & SOPHISTICATED */}
        <div 
            onMouseDown={handleMouseDown}
            className="bg-slate-950/60 backdrop-blur-xl p-3.5 flex justify-between items-center cursor-move select-none border-b border-white/5"
        >
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                    <Plane className="text-emerald-500" size={18} />
                </div>
                <div>
                    <div className="flex items-center gap-2 leading-none mb-0.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            {localFlight.airline} • {localFlight.model}
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-white font-mono tracking-tighter leading-none">
                        {localFlight.flightNumber}
                    </h2>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
            >
                <X size={18} />
            </button>
        </div>

        {/* CONTENT: TIGHT GRID */}
        <div className="p-5 space-y-6">
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">
                        Dados Operacionais
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                </div>
                
                <div className="grid grid-cols-3 gap-x-4 gap-y-5">
                    {/* DESTINO */}
                    <div className="space-y-1 group">
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Globe size={10} className="text-slate-600" /> Destino
                        </label>
                        {isEditingDest ? (
                            <input 
                                autoFocus
                                className="w-full bg-slate-950 border border-emerald-500/50 text-white text-sm px-2 py-1 rounded-lg font-mono outline-none uppercase"
                                value={destInput}
                                onChange={e => setDestInput(e.target.value.toUpperCase().slice(0, 4))}
                                onBlur={handleSaveDest}
                                onKeyDown={e => e.key === 'Enter' && handleSaveDest()}
                                maxLength={4}
                            />
                        ) : (
                            <div onClick={() => setIsEditingDest(true)} className="flex items-center gap-1.5 cursor-pointer group/item">
                                <span className="text-lg font-mono text-emerald-400 font-black tracking-tight">
                                    {localFlight.destination}
                                </span>
                                <Pen size={8} className="text-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>

                    {/* PREFIXO */}
                    <div className="space-y-1 group">
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Hash size={10} className="text-slate-600" /> Prefixo
                        </label>
                        {isEditingReg ? (
                            <input 
                                autoFocus
                                className="w-full bg-slate-950 border border-indigo-500/50 text-white text-sm px-2 py-1 rounded-lg font-mono outline-none uppercase"
                                value={regInput}
                                onChange={e => setRegInput(e.target.value.toUpperCase())}
                                onBlur={handleSaveReg}
                                onKeyDown={e => e.key === 'Enter' && handleSaveReg()}
                            />
                        ) : (
                            <div onClick={() => setIsEditingReg(true)} className="flex items-center gap-1.5 cursor-pointer group/item">
                                <span className="text-lg font-mono text-white font-black tracking-tight">
                                    {localFlight.registration}
                                </span>
                                <Pen size={8} className="text-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>

                    {/* POSIÇÃO */}
                    <div className="space-y-1 group">
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin size={10} className="text-slate-600" /> Posição
                        </label>
                        {isEditingPos ? (
                            <input 
                                autoFocus
                                className="w-full bg-slate-950 border border-indigo-500/50 text-white text-sm px-2 py-1 rounded-lg font-mono outline-none uppercase"
                                value={posInput}
                                onChange={e => setPosInput(e.target.value.toUpperCase())}
                                onBlur={handleSavePos}
                                onKeyDown={e => e.key === 'Enter' && handleSavePos()}
                            />
                        ) : (
                            <div onClick={() => setIsEditingPos(true)} className="flex items-center gap-1.5 cursor-pointer group/item">
                                <span className="text-lg font-mono text-white font-black tracking-tight">
                                    {localFlight.positionId}
                                </span>
                                <Pen size={8} className="text-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>

                    {/* ETD */}
                    <div className="space-y-1 group">
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} className="text-slate-600" /> ETD
                        </label>
                        {isEditingEtd ? (
                            <input 
                                autoFocus
                                type="time"
                                className="w-full bg-slate-950 border border-amber-500/50 text-white text-sm px-2 py-1 rounded-lg font-mono outline-none"
                                value={etdInput}
                                onChange={e => setEtdInput(e.target.value)}
                                onBlur={handleSaveEtd}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEtd()}
                            />
                        ) : (
                            <div onClick={() => setIsEditingEtd(true)} className="flex items-center gap-1.5 cursor-pointer group/item">
                                <span className="text-lg font-mono text-amber-400 font-black tracking-tight">
                                    {localFlight.etd}
                                </span>
                                <Pen size={8} className="text-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>

                    {/* CALÇO */}
                    <div className="space-y-1 group">
                        <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Anchor size={10} className="text-slate-600" /> Calço
                        </label>
                        {isEditingChock ? (
                            <input 
                                autoFocus
                                type="time"
                                className="w-full bg-slate-950 border border-indigo-500/50 text-white text-sm px-2 py-1 rounded-lg font-mono outline-none"
                                value={chockInput}
                                onChange={e => setChockInput(e.target.value)}
                                onBlur={handleSaveChock}
                                onKeyDown={e => e.key === 'Enter' && handleSaveChock()}
                            />
                        ) : (
                            <div onClick={() => setIsEditingChock(true)} className="flex items-center gap-1.5 cursor-pointer group/item">
                                <span className="text-lg font-mono text-white font-black tracking-tight">
                                    {chockInput}
                                </span>
                                <Pen size={8} className="text-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>

                    {/* OPERADOR (Only if FINALIZADO) */}
                    {isFinished && localFlight.operator && (
                        <div className="space-y-1 group">
                            <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <UserCheck size={10} className="text-slate-600" /> Operador
                            </label>
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg font-mono text-emerald-400 font-black tracking-tight uppercase">
                                    {localFlight.operator}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>

        {/* FOOTER: ACTION ORIENTED DESIGNATION */}
        <div className="p-5 bg-slate-950/40 border-t border-white/5">
            {isFinished ? (
                <div className="grid grid-cols-2 gap-4">
                    {/* RELATÓRIO */}
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText size={10} className="text-indigo-500" /> Relatório
                        </label>
                        <button 
                            onClick={() => {/* TODO: Implementar visualização de relatório */}}
                            className="w-full h-[46px] border border-dashed border-white/10 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                            <FileText size={14} /> Ver Relatório
                        </button>
                    </div>

                    {/* REFORÇO */}
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <History size={10} className="text-emerald-500" /> Reforço
                        </label>
                        <button 
                            onClick={() => {
                                const newLog: FlightLog = {
                                    id: Date.now().toString(),
                                    timestamp: new Date(),
                                    type: 'MANUAL',
                                    message: 'Voo redirecionado para REFORÇO (Fila).',
                                    author: 'GESTOR_MESA'
                                };
                                const updatedFlight = {
                                    ...localFlight,
                                    status: FlightStatus.FILA,
                                    operator: undefined,
                                    designationTime: undefined,
                                    logs: [...(localFlight.logs || []), newLog]
                                };
                                onUpdate(updatedFlight);
                                onClose();
                            }}
                            className="w-full h-[46px] border border-dashed border-white/10 rounded-xl text-[9px] font-black text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                            <History size={14} /> Reforço
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* LÍDER */}
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <UserPlus size={10} className="text-indigo-500" /> Líder
                        </label>
                        {localFlight.operator ? (
                            <div className="flex items-center justify-between bg-slate-900 border border-white/5 p-2.5 rounded-xl group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black border border-indigo-500/20">
                                        {localFlight.operator.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase leading-none">{localFlight.operator}</div>
                                        <div className="text-[7px] text-slate-600 mt-1 font-bold uppercase tracking-widest">
                                            {localFlight.fleet || 'S/ FROTA'}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsAssignModalOpen(true)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                >
                                    <RefreshCw size={10} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsAssignModalOpen(true)}
                                className="w-full h-[46px] border border-dashed border-white/10 rounded-xl text-[9px] font-black text-slate-500 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <UserPlus size={14} /> Designar
                            </button>
                        )}
                    </div>

                    {/* APOIO */}
                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={10} className="text-emerald-500" /> Apoio
                        </label>
                        {localFlight.operator ? (
                            <div className="relative">
                                {showSupportOperatorList ? (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-xl p-1.5 shadow-2xl z-20 max-h-32 overflow-y-auto custom-scrollbar">
                                        {MOCK_TEAM_PROFILES.filter(op => op.status === 'DISPONÍVEL' && op.warName !== localFlight.operator).map(op => (
                                            <button 
                                                key={op.id}
                                                onClick={() => {
                                                    setSupportInput(op.warName);
                                                    handleSaveSupport();
                                                    setShowSupportOperatorList(false);
                                                }}
                                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-500 text-[9px] font-bold">{op.warName.charAt(0)}</div>
                                                    <div className="text-[9px] font-black text-white uppercase">{op.warName}</div>
                                                </div>
                                                <UserCheck size={10} className="text-emerald-500" />
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                                
                                {localFlight.supportOperator ? (
                                    <div className="flex items-center justify-between bg-slate-900 border border-white/5 p-2.5 rounded-xl group hover:border-emerald-500/30 transition-all">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-black border border-emerald-500/20">
                                                {localFlight.supportOperator.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-white uppercase leading-none">{localFlight.supportOperator}</div>
                                                <div className="text-[7px] text-slate-600 mt-1 font-bold uppercase tracking-widest">Auxiliar</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowSupportOperatorList(true)}
                                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                        >
                                            <RefreshCw size={10} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setShowSupportOperatorList(true)}
                                        className="w-full h-[46px] border border-dashed border-white/10 rounded-xl text-[9px] font-black text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        <Plus size={14} /> Adicionar
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-[46px] bg-slate-900/40 border border-white/5 rounded-xl flex items-center justify-center text-[9px] font-black text-slate-700 uppercase tracking-widest">
                                Aguardando
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ações (Cancelar / OK) */}
            <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
                <button 
                    onClick={() => {
                        if (isFinished) {
                            const newLog: FlightLog = {
                                id: Date.now().toString(),
                                timestamp: new Date(),
                                type: 'MANUAL',
                                message: 'Voo arquivado da visão geral pelo gestor.',
                                author: 'GESTOR_MESA'
                            };
                            const updatedFlight = {
                                ...localFlight,
                                isHiddenFromGrid: true,
                                logs: [...(localFlight.logs || []), newLog]
                            };
                            onUpdate(updatedFlight);
                        }
                        onClose();
                    }}
                    className="flex-1 px-4 py-3 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all"
                >
                    {isFinished ? 'Limpar da Fila' : 'Cancelar'}
                </button>
                <button 
                    onClick={() => {
                        onUpdate(localFlight);
                        onClose();
                    }}
                    className="flex-1 px-4 py-3 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                    OK
                </button>
            </div>
        </div>
    </motion.div>

    <DesigOpr 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        flight={localFlight}
        operators={MOCK_TEAM_PROFILES}
        onConfirm={handleAssignOperator}
    />
  </>
);
};
