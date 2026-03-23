import React, { useState } from 'react';
import { DetailedVehicle, VehicleType } from '../../types';
import { Search, Plus, Trash2, Edit2, Save, X, Truck, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export const FleetDatabase: React.FC = () => {
  const [vehicles, setVehicles] = useState<DetailedVehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<DetailedVehicle>>({});

  const parseVehicleDates = (v: any): DetailedVehicle => ({
    ...v,
    atveExpiry: new Date(v.atveExpiry),
    inspectionWeekly: new Date(v.inspectionWeekly),
    inspectionMonthly: new Date(v.inspectionMonthly),
    inspectionSemiannual: new Date(v.inspectionSemiannual),
    inspectionAnnual: new Date(v.inspectionAnnual),
    nextMaintenance: new Date(v.nextMaintenance)
  });

  React.useEffect(() => {
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(data => setVehicles(data.map(parseVehicleDates)))
      .catch(err => console.error('Failed to fetch vehicles:', err));
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.fleetNumber.includes(searchTerm) ||
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.atve.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (currentVehicle.id) {
      try {
        const res = await fetch(`/api/vehicles/${currentVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentVehicle)
        });
        const updated = await res.json();
        setVehicles(prev => prev.map(v => v.id === updated.id ? parseVehicleDates(updated) : v));
      } catch (err) {
        console.error('Failed to update vehicle:', err);
      }
    } else {
      try {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentVehicle, status: 'DISPONÍVEL' })
        });
        const created = await res.json();
        setVehicles(prev => [parseVehicleDates(created), ...prev]);
      } catch (err) {
        console.error('Failed to create vehicle:', err);
      }
    }
    setIsModalOpen(false);
    setCurrentVehicle({});
  };

  const handleEdit = (v: DetailedVehicle) => {
    setCurrentVehicle(v);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir veículo?')) {
      try {
        await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        setVehicles(prev => prev.filter(v => v.id !== id));
      } catch (err) {
        console.error('Failed to delete vehicle:', err);
      }
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONÍVEL': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'OCUPADO': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'ENCHIMENTO': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'INATIVO': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'MANUTENÇÃO': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-orange-500" /> Gestão de Frotas
          </h2>
          <p className="text-slate-400 text-sm">Controle de veículos, manutenções e documentação</p>
        </div>
        <button 
          onClick={() => { setCurrentVehicle({}); setIsModalOpen(true); }}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Veículo
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por frota, placa ou ATVE..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-orange-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-orange-500/50 transition-all group relative">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(v)} className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(v.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={14} /></button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg font-mono">{v.fleetNumber}</h3>
                <p className="text-slate-400 text-xs uppercase">{v.type}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded border mt-1 inline-block ${getStatusColor(v.status)}`}>
                  {v.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Modelo:</span>
                <span className="text-slate-200 font-medium">{v.manufacturer} {v.model}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Placa:</span>
                <span className="text-slate-200 font-mono">{v.plate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>ATVE (GRU):</span>
                <span className="text-slate-200 font-mono">{v.atve}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Venc. ATVE:</span>
                <span className={`font-mono ${v.atveExpiry < new Date() ? 'text-red-500 font-bold' : 'text-emerald-400'}`}>
                  {v.atveExpiry.toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 bg-slate-950 rounded p-2 border border-slate-800">
              <p className="text-[10px] uppercase text-slate-500 font-bold mb-2 flex items-center gap-1">
                <Calendar size={10} /> Próximas Inspeções
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Semanal:</span>
                  <span className="text-slate-300">{v.inspectionWeekly.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mensal:</span>
                  <span className="text-slate-300">{v.inspectionMonthly.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Semestral:</span>
                  <span className="text-slate-300">{v.inspectionSemiannual.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Anual:</span>
                  <span className="text-slate-300">{v.inspectionAnnual.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {currentVehicle.id ? <Edit2 size={20} className="text-orange-500" /> : <Plus size={20} className="text-orange-500" />}
                {currentVehicle.id ? 'Editar Veículo' : 'Novo Veículo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Vehicle Info */}
              <section>
                <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 border-b border-orange-500/20 pb-2">Dados do Veículo</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Fabricante</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.manufacturer || ''} onChange={e => setCurrentVehicle({...currentVehicle, manufacturer: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Modelo</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.model || ''} onChange={e => setCurrentVehicle({...currentVehicle, model: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Tipo</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.type || ''} onChange={e => setCurrentVehicle({...currentVehicle, type: e.target.value as VehicleType})}>
                      <option value="">Selecione</option>
                      <option value="SERVIDOR">SERVIDOR (SRV)</option>
                      <option value="CTA">CTA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Placa</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.plate || ''} onChange={e => setCurrentVehicle({...currentVehicle, plate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Frota (Nº)</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.fleetNumber || ''} onChange={e => setCurrentVehicle({...currentVehicle, fleetNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Status</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.status || 'DISPONÍVEL'} onChange={e => setCurrentVehicle({...currentVehicle, status: e.target.value as any})}>
                      <option value="DISPONÍVEL">DISPONÍVEL</option>
                      <option value="OCUPADO">OCUPADO</option>
                      <option value="ENCHIMENTO">ENCHIMENTO</option>
                      <option value="INATIVO">INATIVO</option>
                      <option value="MANUTENÇÃO">MANUTENÇÃO</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Documentation */}
              <section>
                <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 border-b border-orange-500/20 pb-2">Documentação e Inspeções</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Matrícula GRU (ATVE)</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentVehicle.atve || ''} onChange={e => setCurrentVehicle({...currentVehicle, atve: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Vencimento ATVE</label>
                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={formatDate(currentVehicle.atveExpiry)} onChange={e => setCurrentVehicle({...currentVehicle, atveExpiry: new Date(e.target.value)})} />
                  </div>
                  <div></div> {/* Spacer */}

                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Inspeção Semanal</label>
                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={formatDate(currentVehicle.inspectionWeekly)} onChange={e => setCurrentVehicle({...currentVehicle, inspectionWeekly: new Date(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Inspeção Mensal</label>
                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={formatDate(currentVehicle.inspectionMonthly)} onChange={e => setCurrentVehicle({...currentVehicle, inspectionMonthly: new Date(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Inspeção Semestral</label>
                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={formatDate(currentVehicle.inspectionSemiannual)} onChange={e => setCurrentVehicle({...currentVehicle, inspectionSemiannual: new Date(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Inspeção Anual</label>
                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={formatDate(currentVehicle.inspectionAnnual)} onChange={e => setCurrentVehicle({...currentVehicle, inspectionAnnual: new Date(e.target.value)})} />
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">CANCELAR</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20">SALVAR DADOS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
