import React, { useState } from 'react';
import { StaticFlight } from '../../types';
import { Search, Plus, Trash2, Edit2, Save, X, Plane } from 'lucide-react';

export const FlightDatabase: React.FC = () => {
  const [flights, setFlights] = useState<StaticFlight[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StaticFlight | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFlight, setNewFlight] = useState<Partial<StaticFlight>>({});

  React.useEffect(() => {
    fetch('/api/flights')
      .then(res => res.json())
      .then(data => setFlights(data))
      .catch(err => console.error('Failed to fetch flights:', err));
  }, []);

  const filteredFlights = flights.filter(f => 
    f.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.airline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este voo?')) {
      try {
        await fetch(`/api/flights/${id}`, { method: 'DELETE' });
        setFlights(prev => prev.filter(f => f.id !== id));
      } catch (err) {
        console.error('Failed to delete flight:', err);
      }
    }
  };

  const handleEdit = (flight: StaticFlight) => {
    setIsEditing(flight.id);
    setEditForm(flight);
  };

  const handleSaveEdit = async () => {
    if (editForm) {
      try {
        const res = await fetch(`/api/flights/${editForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
        const updated = await res.json();
        setFlights(prev => prev.map(f => f.id === updated.id ? updated : f));
        setIsEditing(null);
        setEditForm(null);
      } catch (err) {
        console.error('Failed to update flight:', err);
      }
    }
  };

  const handleCreate = async () => {
    if (newFlight.flightNumber && newFlight.airline) {
      try {
        const res = await fetch('/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newFlight)
        });
        const created = await res.json();
        setFlights(prev => [created, ...prev]);
        setIsCreating(false);
        setNewFlight({});
      } catch (err) {
        console.error('Failed to create flight:', err);
      }
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plane className="text-emerald-500" /> Gestão de Voos
          </h2>
          <p className="text-slate-400 text-sm">Base de dados de voos regulares (Malha Estática)</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Voo
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por voo, destino ou cia..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-emerald-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <input 
              placeholder="Cia Aérea (Ex: LATAM)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newFlight.airline || ''}
              onChange={e => setNewFlight({...newFlight, airline: e.target.value})}
            />
            <input 
              placeholder="Nº Voo (Ex: LA-8039)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newFlight.flightNumber || ''}
              onChange={e => setNewFlight({...newFlight, flightNumber: e.target.value})}
            />
            <input 
              placeholder="Destino ICAO (Ex: SPJC)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newFlight.destination || ''}
              onChange={e => setNewFlight({...newFlight, destination: e.target.value})}
            />
            <input 
              placeholder="Cidade (Ex: LIMA)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newFlight.city || ''}
              onChange={e => setNewFlight({...newFlight, city: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-emerald-500 text-slate-900 font-bold rounded hover:bg-emerald-400">Salvar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="p-4 border-b border-slate-800">Cia Aérea</th>
                <th className="p-4 border-b border-slate-800">Nº Voo</th>
                <th className="p-4 border-b border-slate-800">Destino (ICAO)</th>
                <th className="p-4 border-b border-slate-800">Cidade</th>
                <th className="p-4 border-b border-slate-800 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {filteredFlights.map(flight => (
                <tr key={flight.id} className="hover:bg-slate-800/50 transition-colors group">
                  {isEditing === flight.id ? (
                    <>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.airline} onChange={e => setEditForm({...editForm!, airline: e.target.value})} /></td>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.flightNumber} onChange={e => setEditForm({...editForm!, flightNumber: e.target.value})} /></td>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.destination} onChange={e => setEditForm({...editForm!, destination: e.target.value})} /></td>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.city} onChange={e => setEditForm({...editForm!, city: e.target.value})} /></td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button onClick={handleSaveEdit} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded"><Save size={16} /></button>
                        <button onClick={() => setIsEditing(null)} className="text-red-500 hover:bg-red-500/10 p-1 rounded"><X size={16} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-white font-bold">{flight.airline}</td>
                      <td className="p-4 text-slate-300 font-mono">{flight.flightNumber}</td>
                      <td className="p-4 text-slate-300 font-mono">{flight.destination}</td>
                      <td className="p-4 text-slate-400">{flight.city}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(flight)} className="text-blue-400 hover:bg-blue-400/10 p-1.5 rounded transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(flight.id)} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
          <span>Total de registros: {filteredFlights.length}</span>
          <span>Mostrando {filteredFlights.length} de {flights.length}</span>
        </div>
      </div>
    </div>
  );
};
