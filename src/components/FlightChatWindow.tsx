import React from 'react';
import { FlightData } from '../types';

interface FlightChatWindowProps {
  flight: FlightData;
  onClose: () => void;
}

export const FlightChatWindow: React.FC<FlightChatWindowProps> = ({ flight, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 w-96 h-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-white">Chat: {flight.flightNumber}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">X</button>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-slate-400 text-sm">Este componente está em desenvolvimento.</p>
      </div>
    </div>
  );
};
