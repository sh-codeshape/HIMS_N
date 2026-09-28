import React from 'react';

export default function PageContainer({ title, subtitle, children, className }) {
  return (
    <div className={`p-6 md:p-8 w-full max-w-7xl mx-auto ${className || ''}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
