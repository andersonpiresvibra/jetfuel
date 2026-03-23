import React, { useState, useEffect } from 'react';
import { X, Plane, Calendar, Clock, MapPin, Hash, Tag, Globe } from 'lucide-react';
import { FlightData, FlightStatus, FlightLog } from '../types';

const createNewLog = (type: FlightLog['type'], message: string, author: string): FlightLog => ({
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp: new Date(),
    type,
    message,
    author
});

interface CreateFlightModalProps {
  onClose: () => void;
  onCreate: (flight: FlightData) => void;
}

export const CreateFlightModal: React.FC<CreateFlightModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    airlineCode: '',
    registration: '',
    model: '',
    flightNumber: '', // Chegada
    eta: '',
    departureFlightNumber: '', // Saída
    destination: '', // ICAO
    positionId: '',
    etd: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    // Basic validation
    if (!formData.registration) return;

    const newFlight: FlightData = {
      id: Date.now().toString(),
      airline: 'GOL', // Default or derived from code
      airlineCode: formData.airlineCode.toUpperCase(),
      registration: formData.registration.toUpperCase(),
      model: formData.model.toUpperCase(),
      flightNumber: formData.flightNumber.toUpperCase(),
      eta: formData.eta,
      departureFlightNumber: formData.departureFlightNumber.toUpperCase(),
      destination: formData.destination.toUpperCase(),
      positionId: formData.positionId,
      etd: formData.etd,
      origin: 'SBGL', // Default
      fuelStatus: 0,
      status: FlightStatus.CHEGADA, // Default status
      logs: [createNewLog('SISTEMA', 'Voo criado manualmente pelo gestor.', 'GESTOR_MESA')],
      messages: []
    };

    onCreate(newFlight);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // If an input is focused, let it handle its own Enter
        if (document.activeElement?.tagName === 'INPUT') return;
        handleCreate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, onCreate, onClose]);

  // Helper to calculate if priority queue warning is needed
  const isPriority = () => {
    if (!formData.etd) return false;
    const now = new Date();
    const [h, m] = formData.etd.split(':').map(Number);
    const etdDate = new Date();
    etdDate.setHours(h, m, 0, 0);
    const diffMins = (etdDate.getTime() - now.getTime()) / 60000;
    return diffMins < 60;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plane size={16} className="text-emerald-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-tighter">CRIAR VOO MANUAL</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Coluna 1 */}
            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nº Voo (Chegada)</label>
                <div className="relative">
                   <Plane size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleChange}
                    placeholder="RG-1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Comp. (Cia)</label>
                <div className="relative">
                   <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    name="airlineCode"
                    value={formData.airlineCode}
                    onChange={handleChange}
                    placeholder="RG"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Modelo</label>
                <div className="relative">
                   <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="B738"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">ETA (Chegada)</label>
                <div className="relative">
                   <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    type="time"
                    name="eta"
                    value={formData.eta}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-3">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Prefixo</label>
                <div className="relative">
                   <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    name="registration"
                    value={formData.registration}
                    onChange={handleChange}
                    placeholder="PR-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nº Voo (Saída)</label>
                <div className="relative">
                   <Plane size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 transform rotate-45" />
                   <input 
                    name="departureFlightNumber"
                    value={formData.departureFlightNumber}
                    onChange={handleChange}
                    placeholder="RG-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">ICAO (Destino)</label>
                    <div className="relative">
                       <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                       <input 
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        placeholder="SB..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Posição</label>
                    <div className="relative">
                       <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                       <input 
                        name="positionId"
                        value={formData.positionId}
                        onChange={handleChange}
                        placeholder="000"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                      />
                    </div>
                  </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">ETD (Partida)</label>
                <div className="relative">
                   <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    type="time"
                    name="etd"
                    value={formData.etd}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-[10px] font-bold text-white outline-none focus:border-emerald-500/50 uppercase placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {isPriority() && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-md text-amber-500">
                <Clock size={12} />
              </div>
              <div>
                <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Atenção: Prioridade Automática</h4>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                   Voos criados com ETD menor que 1h entrarão automaticamente na FILA de prioridade.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-all"
            >
              CANCELAR
            </button>
            <button 
              type="submit"
              className="flex-1 px-3 py-2 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              CRIAR VOO
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
