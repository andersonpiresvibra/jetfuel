import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return <span className="p-2 bg-slate-700 text-white rounded-md">{status}</span>;
};

interface FuelBarProps {
  value: number;
  status: string;
}

export const FuelBar: React.FC<FuelBarProps> = ({ value, status }) => {
  const isAbastecendo = status === 'ABASTECENDO';
  const colorClass = value < 30 ? 'bg-red-500' : value < 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 relative overflow-hidden">
      <div 
        className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${value}%` }}
      >
        {isAbastecendo && (
          <div className="absolute top-0 left-0 h-full w-full bg-white/30 animate-pulse"></div>
        )}
      </div>
    </div>
  );
};
