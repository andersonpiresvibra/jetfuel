import React from 'react';
import { Plane, Key } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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
                defaultValue="OPERADOR_ADMIN"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
            <input 
                type="password" 
                placeholder="Senha"
                defaultValue="********"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
        </div>

        <button 
          onClick={onLogin} 
          className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm uppercase tracking-widest py-3 rounded-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
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
