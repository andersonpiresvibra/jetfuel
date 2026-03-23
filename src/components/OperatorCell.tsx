
import React, { useState } from 'react';
import { MOCK_TEAM_PROFILES } from '../data/mockData';
import { User } from 'lucide-react';

interface OperatorCellProps {
  operatorName?: string;
  className?: string;
  showName?: boolean;
}

export const OperatorCell: React.FC<OperatorCellProps> = ({ 
  operatorName, 
  className = "",
  showName = true 
}) => {
  const [imageError, setImageError] = useState(false);

  if (!operatorName) return <span className="text-slate-600">---</span>;

  const profile = MOCK_TEAM_PROFILES.find(p => p.warName === operatorName);
  
  return (
    <div className={`flex items-center justify-start gap-2 ${className}`}>
      <div className="w-6 h-8 bg-slate-800 border border-slate-700 rounded overflow-hidden shrink-0 flex items-end justify-center">
        {profile?.photoUrl && !imageError ? (
          <img 
            src={profile.photoUrl} 
            alt={operatorName} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <User size={20} className="text-slate-500/50 mb-0.5" />
        )}
      </div>
      {showName && (
        <span className="text-slate-300 uppercase tracking-tight truncate text-[10px] font-medium leading-none mt-0.5">
          {operatorName}
        </span>
      )}
    </div>
  );
};
