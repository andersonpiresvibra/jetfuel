import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { X, UserPlus, Trash2, Power, PowerOff, Droplet, Edit2, Save } from 'lucide-react';
import { DesigOpr } from './desigopr';
import { OperatorProfile } from '../types';

interface VehicleActionModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
  density: number;
  operators: OperatorProfile[];
  showStatusOnly?: boolean;
}

export const VehicleActionModal: React.FC<VehicleActionModalProps> = ({ vehicle, onClose, onUpdateVehicle, density, operators, showStatusOnly = false }) => {
  const [currentVolume, setCurrentVolume] = useState(vehicle?.currentVolume || 0);
  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [activationReason, setActivationReason] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);


  useEffect(() => {
    if (vehicle) {
      setCurrentVolume(vehicle.currentVolume || 0);
    }

    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
        window.removeEventListener('keydown', handleKeyPress);
    };
  }, [vehicle]);

  if (!vehicle) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, '');
    if (/^\d{0,5}$/.test(value)) {
      setCurrentVolume(Number(value));
    }
  };

  const handleSave = () => {
    onUpdateVehicle({ ...vehicle, currentVolume });
    onClose();
  };
  
  const handleDeactivate = () => {
    onUpdateVehicle({ ...vehicle, isActive: false, status: 'INATIVO', observations: `Desativado: ${deactivationReason}` });
    setIsDeactivationModalOpen(false);
    onClose();
  };

  const handleActivate = () => {
    onUpdateVehicle({ ...vehicle, isActive: true, status: 'DISPONÍVEL', observations: `Ativado: ${activationReason}` });
    setIsActivationModalOpen(false);
    onClose();
  };

  const volumeKg = (currentVolume * density).toFixed(0);
  const volumeLbs = (currentVolume * density * 2.20462).toFixed(0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-amber-500 font-mono">{vehicle.id}</span>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white">Gerenciar Frota</h2>
              <p className="text-xs text-slate-500">{vehicle.manufacturer}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!showStatusOnly && (
            <>
              {/* Volume Section */}
              {vehicle.type === 'CTA' && (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Droplet size={14}/>Controle de Volume</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className='text-center bg-slate-900 p-2 rounded-lg'>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">V. Atual (L)</label>
                        <input type="text" value={currentVolume.toLocaleString('pt-BR')} onChange={handleVolumeChange} className="w-full bg-transparent text-center text-xl font-mono text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </div>
                    <div className='text-center bg-slate-900 p-2 rounded-lg'>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">V. Kg</p>
                        <p className="text-xl font-mono text-slate-400">{volumeKg}</p>
                    </div>
                    <div className='text-center bg-slate-900 p-2 rounded-lg'>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">V. Lbs</p>
                        <p className="text-xl font-mono text-slate-500">{volumeLbs}</p>
                    </div>
                </div>
              </div>
              )}

              {/* Operator Section */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus size={14}/>Gerenciar Operador</h3>
                 <div className="flex gap-4">
                    <button onClick={() => setIsAssignModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 p-3 rounded-lg text-xs font-bold transition-colors">
                        <UserPlus size={14}/> Designar Operador
                    </button>
                    <button 
                        onClick={() => {
                            onUpdateVehicle({ ...vehicle, operatorName: undefined, status: 'DISPONÍVEL' });
                            onClose();
                        }}
                        disabled={!vehicle.operatorName}
                        className="flex-1 flex items-center justify-center gap-2 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 p-3 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={14}/> Rem. Operador
                    </button>
                 </div>
              </div>
            </>
          )}



          {/* Actions */}
          <div className="flex gap-4">
            {vehicle.isActive !== false ? (
              <button onClick={() => setIsDeactivationModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 p-3 rounded-lg text-xs font-bold transition-colors">
                <PowerOff size={14}/> Desativar Frota
              </button>
            ) : (
              <button onClick={() => setIsActivationModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 p-3 rounded-lg text-xs font-bold transition-colors">
                <Power size={14}/> Ativar Frota
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        {!showStatusOnly && (
          <div className="flex gap-3 justify-end p-4 bg-slate-950/50 border-t border-slate-800 rounded-b-2xl">
              <button 
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-slate-400 hover:bg-slate-700 p-3 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
              >
                  Cancelar
              </button>
              <button 
                  onClick={handleSave} 
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 p-3 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
              >
                  <Save size={14}/> OK
              </button>
          </div>
        )}
      </div>

      {/* Deactivation Modal */}
      {isDeactivationModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setIsDeactivationModalOpen(false)}>
            <div className="bg-slate-900 border border-red-500/30 rounded-xl p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className='text-base font-bold text-red-400'>Justificar Desativação</h3>
                <select onChange={(e) => setDeactivationReason(e.target.value)} className='w-full bg-slate-800 p-2 rounded-lg text-white'>
                    <option>Manutenção</option>
                    <option>Testes</option>
                    <option>Diesel</option>
                    <option>ATVE</option>
                    <option>Outros</option>
                </select>
                <button onClick={handleDeactivate} className='w-full bg-red-500 text-white p-2 rounded-lg font-bold'>Confirmar</button>
            </div>
        </div>
      )}

      {/* Activation Modal */}
      {isActivationModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setIsActivationModalOpen(false)}>
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-6 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className='text-base font-bold text-emerald-400'>Liberado por?</h3>
                <input type="text" placeholder='Setor/Responsável...' onChange={(e) => setActivationReason(e.target.value)} className='w-full bg-slate-800 p-2 rounded-lg text-white' />
                <button onClick={handleActivate} className='w-full bg-emerald-500 text-white p-2 rounded-lg font-bold'>Confirmar Ativação</button>
            </div>
        </div>
      )}

      <DesigOpr 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        operators={operators}
        vehicle={vehicle}
        onConfirm={(operatorId) => {
            const operator = operators.find(op => op.id === operatorId);
            if (operator) {
                const updatedVehicle = { ...vehicle, operatorName: operator.warName, status: 'OCUPADO' as const };
                onUpdateVehicle(updatedVehicle as Vehicle);
            }
            setIsAssignModalOpen(false);
            onClose();
        }}
      />
    </div>
  );
};
