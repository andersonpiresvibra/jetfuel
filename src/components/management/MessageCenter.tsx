import React from 'react';

interface MessageCenterProps {
  type: 'MESSAGES' | 'NOTIFICATIONS';
}

export const MessageCenter: React.FC<MessageCenterProps> = ({ type }) => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-slate-800 text-white text-xl">
      <p>MessageCenter: {type} (Placeholder)</p>
    </div>
  );
};
