import React, { useState } from 'react';
import { AircraftType } from '../../types';
import { Search, Plus, Trash2, Edit2, Save, X, Plane, Tag } from 'lucide-react';

export const AircraftDatabase: React.FC = () => {
  const [aircraft, setAircraft] = useState<AircraftType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AircraftType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newAircraft, setNewAircraft] = useState<Partial<AircraftType>>({});

  React.useEffect(() => {
    fetch('/api/aircraft')
      .then(res => res.json())
      .then(data => setAircraft(data))
      .catch(err => console.error('Failed to fetch aircraft:', err));
  }, []);

  const filteredAircraft = aircraft.filter(a => 
    a.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Excluir aeronave?')) {
      try {
        await fetch(`/api/aircraft/${id}`, { method: 'DELETE' });
        setAircraft(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error('Failed to delete aircraft:', err);
      }
    }
  };

  const handleEdit = (a: AircraftType) => {
    setIsEditing(a.id);
    setEditForm(a);
  };

  const handleSaveEdit = async () => {
    if (editForm) {
      try {
        const res = await fetch(`/api/aircraft/${editForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        });
        const updated = await res.json();
        setAircraft(prev => prev.map(a => a.id === updated.id ? updated : a));
        setIsEditing(null);
        setEditForm(null);
      } catch (err) {
        console.error('Failed to update aircraft:', err);
      }
    }
  };

  const handleCreate = async () => {
    if (newAircraft.prefix && newAircraft.airline) {
      try {
        const res = await fetch('/api/aircraft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAircraft)
        });
        const created = await res.json();
        setAircraft(prev => [created, ...prev]);
        setIsCreating(false);
        setNewAircraft({});
      } catch (err) {
        console.error('Failed to create aircraft:', err);
      }
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plane className="text-purple-500" /> Gestão de Aeronaves
          </h2>
          <p className="text-slate-400 text-sm">Cadastro de modelos e prefixos da frota aérea</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Nova Aeronave
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por prefixo, modelo ou cia..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-purple-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-slate-900 p-4 rounded-xl border border-purple-500/30 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <input 
              placeholder="Fabricante (Ex: BOEING)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newAircraft.manufacturer || ''}
              onChange={e => setNewAircraft({...newAircraft, manufacturer: e.target.value})}
            />
            <input 
              placeholder="Modelo (Ex: 737-800)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newAircraft.model || ''}
              onChange={e => setNewAircraft({...newAircraft, model: e.target.value})}
            />
            <input 
              placeholder="Prefixo (Ex: PR-GGE)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newAircraft.prefix || ''}
              onChange={e => setNewAircraft({...newAircraft, prefix: e.target.value})}
            />
            <input 
              placeholder="Cia Aérea (Ex: GOL)" 
              className="bg-slate-950 border border-slate-800 rounded p-2 text-white"
              value={newAircraft.airline || ''}
              onChange={e => setNewAircraft({...newAircraft, airline: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-500">Salvar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="p-4 border-b border-slate-800">Fabricante</th>
                <th className="p-4 border-b border-slate-800">Modelo</th>
                <th className="p-4 border-b border-slate-800">Prefixo</th>
                <th className="p-4 border-b border-slate-800">Cia Aérea</th>
                <th className="p-4 border-b border-slate-800 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-800">
              {filteredAircraft.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/50 transition-colors group">
                  {isEditing === a.id ? (
                    <>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.manufacturer} onChange={e => setEditForm({...editForm!, manufacturer: e.target.value})} /></td>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.model} onChange={e => setEditForm({...editForm!, model: e.target.value})} /></td>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.prefix} onChange={e => setEditForm({...editForm!, prefix: e.target.value})} /></td>
                      <td className="p-3"><input className="bg-slate-950 border border-slate-700 rounded p-1 text-white w-full" value={editForm?.airline} onChange={e => setEditForm({...editForm!, airline: e.target.value})} /></td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <button onClick={handleSaveEdit} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded"><Save size={16} /></button>
                        <button onClick={() => setIsEditing(null)} className="text-red-500 hover:bg-red-500/10 p-1 rounded"><X size={16} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-slate-300">{a.manufacturer}</td>
                      <td className="p-4 text-slate-300 font-mono">{a.model}</td>
                      <td className="p-4 text-white font-bold font-mono">{a.prefix}</td>
                      <td className="p-4 text-slate-400">{a.airline}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(a)} className="text-blue-400 hover:bg-blue-400/10 p-1.5 rounded transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:bg-red-400/10 p-1.5 rounded transition-colors"><Trash2 size={16} /></button>
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
          <span>Total de registros: {filteredAircraft.length}</span>
          <span>Mostrando {filteredAircraft.length} de {aircraft.length}</span>
        </div>
      </div>
    </div>
  );
};
