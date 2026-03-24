import React, { useState } from 'react';
import { Plane, Key, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'Admin' && password === 'Ae0497') {
      setError('');
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-sans">
      <div className="w-full max-w-sm p-8 bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-slate-800 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500 p-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <Plane className="text-white" size={24} />
          </div>
        </div>
        <h1 className="text-xl font-black text-white tracking-tighter uppercase mb-2">
          JETFUEL-SIM
        </h1>
        <p className="text-xs text-slate-400 mb-8 tracking-wider">
          SISTEMA DE GERENCIAMENTO DE COMBUSTÍVEL
        </p>
        
        <div className="space-y-4">
            <input 
                type="text" 
                placeholder="ID do Operador"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
            <input 
                type="password" 
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
        </div>

        {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg text-xs font-medium text-left">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
            </div>
        )}

        <button 
          onClick={handleLogin} 
          className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest py-3 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
        >
          <Key size={14} />
          Acessar Sistema
        </button>

        <p className="text-[10px] text-slate-700 mt-8">
          Apenas pessoal autorizado. Atividade monitorada.
        </p>
      </div>
    </div>
  );
};
