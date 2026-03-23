import React from 'react';
import { FlightStatus } from './types';

interface StatusBadgeProps {
  status: FlightStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (s: FlightStatus) => {
    switch (s) {
      case FlightStatus.CHEGADA: return { label: 'CHEGADA', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case FlightStatus.FILA: return { label: 'FILA', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case FlightStatus.DESIGNADO: return { label: 'DESIGNADO', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case FlightStatus.ABASTECENDO: return { label: 'ABASTECENDO', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse' };
      case FlightStatus.FINALIZADO: return { label: 'FINALIZADO', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
      case FlightStatus.CANCELADO: return { label: 'CANCELADO', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
      default: return { label: s, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${config.color}`}>
      {config.label}
    </span>
  );
};
