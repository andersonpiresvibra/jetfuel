import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit2, Save, X, User, Check, Upload } from 'lucide-react';

interface ManagedOperator {
  id: string;
  fullName: string;
  warName: string;
  companyId: string;
  gruId: string;
  vestNumber: string;
  role: string;
  shift: string;
  entryTime: string;
  exitTime: string;
  allowedAirlines: string[];
  status: string;
  photoUrl?: string;
  americanId?: string;
}

const AIRLINES_LIST = ['LATAM', 'GOL', 'AZUL', 'AMERICAN', 'UNITED', 'DELTA', 'TAP', 'AIR FRANCE', 'KLM', 'LUFTHANSA', 'BRITISH', 'QATAR', 'EMIRATES'];

const OperatorImage = ({ op }: { op: ManagedOperator }) => {
    const [error, setError] = useState(false);
    return (
        <div className="w-12 h-16 rounded-lg bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-end justify-center shrink-0">
            {op.photoUrl && !error ? (
                <img src={op.photoUrl} alt={op.warName} className="w-full h-full object-cover" onError={() => setError(true)} referrerPolicy="no-referrer" />
            ) : (
                <User size={32} className="text-slate-600 mb-1" />
            )}
        </div>
    );
};

export const OperatorDatabase: React.FC = () => {
  const [operators, setOperators] = useState<ManagedOperator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperator, setCurrentOperator] = useState<Partial<ManagedOperator>>({});

  React.useEffect(() => {
    fetch('/api/operators')
      .then(res => res.json())
      .then(data => setOperators(data))
      .catch(err => console.error('Failed to fetch operators:', err));
  }, []);

  const filteredOperators = operators.filter(op => 
    op.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.warName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.companyId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (currentOperator.id) {
      // Edit
      try {
        const res = await fetch(`/api/operators/${currentOperator.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentOperator)
        });
        const updated = await res.json();
        setOperators(prev => prev.map(op => op.id === updated.id ? updated : op));
      } catch (err) {
        console.error('Failed to update operator:', err);
      }
    } else {
      // Create
      try {
        const res = await fetch('/api/operators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentOperator, status: 'ATIVO' })
        });
        const created = await res.json();
        setOperators(prev => [created, ...prev]);
      } catch (err) {
        console.error('Failed to create operator:', err);
      }
    }
    setIsModalOpen(false);
    setCurrentOperator({});
  };

  const handleEdit = (op: ManagedOperator) => {
    setCurrentOperator(op);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir operador?')) {
      try {
        await fetch(`/api/operators/${id}`, { method: 'DELETE' });
        setOperators(prev => prev.filter(op => op.id !== id));
      } catch (err) {
        console.error('Failed to delete operator:', err);
      }
    }
  };

  const toggleAirline = (airline: string) => {
    const current = currentOperator.allowedAirlines || [];
    if (current.includes(airline)) {
      setCurrentOperator({ ...currentOperator, allowedAirlines: current.filter(a => a !== airline) });
    } else {
      setCurrentOperator({ ...currentOperator, allowedAirlines: [...current, airline] });
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-blue-500" /> Gestão de Operadores
          </h2>
          <p className="text-slate-400 text-sm">Cadastro completo de colaboradores e habilitações</p>
        </div>
        <button 
          onClick={() => { setCurrentOperator({}); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Novo Colaborador
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, matrícula ou ID..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20">
        {filteredOperators.map(op => (
          <div key={op.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all group relative">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(op)} className="p-1.5 bg-slate-800 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(op.id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={14} /></button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <OperatorImage op={op} />
              <div>
                <h3 className="text-white font-bold text-lg">{op.warName}</h3>
                <p className="text-slate-400 text-xs uppercase">{op.role}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${op.status === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {op.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Nome Completo:</span>
                <span className="text-slate-200 font-medium truncate max-w-[150px]">{op.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Matrícula:</span>
                <span className="text-slate-200 font-mono">{op.companyId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Colete:</span>
                <span className="text-slate-200 font-mono">{op.vestNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span>Turno:</span>
                <span className="text-slate-200">{op.shift} ({op.entryTime} - {op.exitTime})</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] uppercase text-slate-500 font-bold mb-2">Habilitações ({op.allowedAirlines.length})</p>
              <div className="flex flex-wrap gap-1">
                {op.allowedAirlines.slice(0, 5).map(a => (
                  <span key={a} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">{a}</span>
                ))}
                {op.allowedAirlines.length > 5 && (
                  <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700">+{op.allowedAirlines.length - 5}</span>
                )}
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
                {currentOperator.id ? <Edit2 size={20} className="text-blue-500" /> : <Plus size={20} className="text-blue-500" />}
                {currentOperator.id ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Personal Info */}
              <section>
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-blue-500/20 pb-2">Dados Pessoais</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nome Completo</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.fullName || ''} onChange={e => setCurrentOperator({...currentOperator, fullName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nome de Guerra</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.warName || ''} onChange={e => setCurrentOperator({...currentOperator, warName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Matrícula Empresa</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.companyId || ''} onChange={e => setCurrentOperator({...currentOperator, companyId: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Matrícula GRU</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.gruId || ''} onChange={e => setCurrentOperator({...currentOperator, gruId: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Matrícula American</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.americanId || ''} onChange={e => setCurrentOperator({...currentOperator, americanId: e.target.value})} />
                  </div>
                </div>
              </section>

              {/* Operational Info */}
              <section>
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-blue-500/20 pb-2">Dados Operacionais</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nº Colete</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.vestNumber || ''} onChange={e => setCurrentOperator({...currentOperator, vestNumber: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Cargo</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.role || ''} onChange={e => setCurrentOperator({...currentOperator, role: e.target.value})}>
                      <option value="">Selecione</option>
                      <option value="LÍDER">LÍDER</option>
                      <option value="APOIO">APOIO</option>
                      <option value="MOTORISTA">MOTORISTA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Turno</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.shift || ''} onChange={e => setCurrentOperator({...currentOperator, shift: e.target.value})}>
                      <option value="">Selecione</option>
                      <option value="MANHÃ">MANHÃ</option>
                      <option value="TARDE">TARDE</option>
                      <option value="NOITE">NOITE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Status</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.status || 'ATIVO'} onChange={e => setCurrentOperator({...currentOperator, status: e.target.value as any})}>
                      <option value="ATIVO">ATIVO</option>
                      <option value="INATIVO">INATIVO</option>
                      <option value="FÉRIAS">FÉRIAS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Entrada</label>
                    <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.entryTime || ''} onChange={e => setCurrentOperator({...currentOperator, entryTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Saída</label>
                    <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.exitTime || ''} onChange={e => setCurrentOperator({...currentOperator, exitTime: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Foto (URL)</label>
                    <div className="flex gap-2">
                      <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white" value={currentOperator.photoUrl || ''} onChange={e => setCurrentOperator({...currentOperator, photoUrl: e.target.value})} placeholder="https://..." />
                      <button className="bg-slate-800 p-2 rounded text-slate-400 hover:text-white"><Upload size={18} /></button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Airlines */}
              <section>
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-blue-500/20 pb-2">Habilitações (Cias Aéreas)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {AIRLINES_LIST.map(airline => (
                    <div 
                      key={airline} 
                      onClick={() => toggleAirline(airline)}
                      className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${
                        (currentOperator.allowedAirlines || []).includes(airline) 
                        ? 'bg-blue-500/20 border-blue-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${(currentOperator.allowedAirlines || []).includes(airline) ? 'bg-blue-500 border-blue-500' : 'border-slate-600'}`}>
                        {(currentOperator.allowedAirlines || []).includes(airline) && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-xs font-bold">{airline}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">CANCELAR</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">SALVAR DADOS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
