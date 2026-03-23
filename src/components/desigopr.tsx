import React, { useState, useEffect, useMemo } from 'react';
import { OperatorProfile, FlightData, Vehicle } from '../types';
import { UserPlus, AlertTriangle, X, Check, User, Clock, Briefcase } from 'lucide-react';

interface DesigOprProps {
    isOpen: boolean;
    onClose: () => void;
    flight?: FlightData | null;
    vehicle?: Vehicle | null;
    operators: OperatorProfile[];
    onConfirm: (operatorId: string) => void;
}

type Tab = 'DISPONIVEIS' | 'DESIGNADOS' | 'OCUPADOS';

export const DesigOpr: React.FC<DesigOprProps> = ({ isOpen, onClose, flight, vehicle, operators, onConfirm }) => {
    const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('DISPONIVEIS');

    const handleConfirm = () => {
        if (selectedOperatorId) {
            onConfirm(selectedOperatorId);
            setSelectedOperatorId(null);
        }
    };

    const handleClose = () => {
        setSelectedOperatorId(null);
        onClose();
    };

    // Reset tab when opening
    useEffect(() => {
        if (isOpen) {
            setActiveTab('DISPONIVEIS');
            setSelectedOperatorId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && isOpen && selectedOperatorId) {
                handleConfirm();
            }
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedOperatorId, handleConfirm]);

    const categorizedOperators = useMemo(() => {
        return {
            DISPONIVEIS: operators.filter(op => op.status === 'DISPONÍVEL'),
            DESIGNADOS: operators.filter(op => op.status === 'DESIGNADO' || (op.status as any) === 'ALOCADO'), // Assuming DESIGNADO status exists or mapping logic handles it
            OCUPADOS: operators.filter(op => op.status === 'OCUPADO' || op.status === 'ENCHIMENTO'),
        };
    }, [operators]);

    // Fallback logic if statuses aren't exactly matching, or to ensure everyone is somewhere
const OperatorImage = ({ op, isSelected }: { op: OperatorProfile, isSelected: boolean }) => {
    const [error, setError] = useState(false);
    return (
        <div className={`w-9 h-12 rounded-lg flex items-end justify-center text-sm font-black border overflow-hidden shrink-0 ${
            isSelected 
                ? 'bg-white text-indigo-600 border-white' 
                : 'bg-slate-950 text-slate-400 border-slate-800 group-hover:border-slate-600'
        }`}>
            {op.photoUrl && !error ? (
                <img src={op.photoUrl} alt={op.warName} className="w-full h-full object-cover" onError={() => setError(true)} referrerPolicy="no-referrer" />
            ) : (
                <User size={24} className="text-slate-500/50 mb-1" />
            )}
        </div>
    );
};

    const currentList = categorizedOperators[activeTab];

    if (!isOpen || (!flight && !vehicle)) return null;

    const title = "Designação de Operador";
    let subtitle = "";
    if (flight) {
        subtitle = `Voo ${flight.flightNumber} • ${flight.vehicleType === 'CTA' ? 'REQ. CTA' : 'REQ. SERVIDOR'}`;
    } else if (vehicle) {
        subtitle = `Frota ${vehicle.id} • ${vehicle.type}`;
    }

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div 
                className="bg-[#0f172a] border border-slate-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER FINO */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#020617]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                            <UserPlus size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">{title}</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* TABS */}
                <div className="flex border-b border-slate-800 bg-slate-900/50">
                    {(['DISPONIVEIS', 'DESIGNADOS', 'OCUPADOS'] as Tab[]).map(tab => {
                        const count = categorizedOperators[tab].length;
                        const isActive = activeTab === tab;
                        
                        let activeColor = 'text-emerald-500 border-emerald-500';
                        if (tab === 'DESIGNADOS') activeColor = 'text-blue-500 border-blue-500';
                        if (tab === 'OCUPADOS') activeColor = 'text-amber-500 border-amber-500';

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
                                    isActive 
                                        ? `bg-slate-900 ${activeColor}` 
                                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                }`}
                            >
                                {tab === 'DISPONIVEIS' && <Check size={12} />}
                                {tab === 'DESIGNADOS' && <Briefcase size={12} />}
                                {tab === 'OCUPADOS' && <Clock size={12} />}
                                {tab}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${isActive ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* LISTA DE OPERADORES */}
                <div className="flex-1 p-4 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar bg-[#0f172a]">
                    {currentList.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {currentList.map(op => {
                                const isSelected = selectedOperatorId === op.id;
                                const isBusy = op.status !== 'DISPONÍVEL';
                                
                                let statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                                if (op.status === 'DESIGNADO') statusColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                if (op.status === 'OCUPADO' || op.status === 'ENCHIMENTO') statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';

                                return (
                                    <button 
                                        key={op.id}
                                        onClick={() => setSelectedOperatorId(op.id)}
                                        className={`group w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all relative overflow-hidden ${
                                            isSelected 
                                                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20' 
                                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <OperatorImage op={op} isSelected={isSelected} />
                                            <div className="text-left">
                                                <div className={`text-xs font-black uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                                    {op.warName}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${isSelected ? 'bg-indigo-500 text-indigo-100 border-indigo-400' : statusColor}`}>
                                                        {op.status}
                                                    </span>
                                                    {op.assignedVehicle && (
                                                        <span className={`text-[9px] font-mono opacity-60 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                            {op.assignedVehicle}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {isSelected && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                                                <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                                                    <Check size={14} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 py-10">
                            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center">
                                <User size={20} className="opacity-20" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Nenhum operador nesta categoria</span>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-800 bg-[#020617] flex gap-3">
                    <button 
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold text-[10px] hover:bg-slate-800 hover:text-white transition-all uppercase tracking-wider"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedOperatorId}
                        className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-black text-[10px] hover:bg-indigo-500 transition-all uppercase tracking-wider shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <span>Confirmar Designação</span>
                        <Check size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
