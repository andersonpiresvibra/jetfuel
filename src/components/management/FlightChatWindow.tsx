import React from 'react';
import { FlightData } from '../../types';

interface FlightChatWindowProps {
  flight: FlightData;
  onClose: () => void;
  isOpen: boolean;
}

export const FlightChatWindow: React.FC<FlightChatWindowProps> = ({ flight, onClose, isOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold text-white mb-4">Chat Voo {flight.flightNumber}</h2>
        <p className="text-slate-300 mb-4">Janela de chat (Placeholder)</p>
        <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Fechar</button>
      </div>
    </div>
  );
};
