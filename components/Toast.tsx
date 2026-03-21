import React from 'react';

const Toast = ({ message, type }: { message: string; type: 'error' | 'success' }) => (
  <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl text-white font-medium z-50 animate-bounce ${
    type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
  }`}>
    {message}
  </div>
);

export default Toast;
