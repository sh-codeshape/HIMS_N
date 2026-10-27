import React from 'react';

export function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

export default Loader;
