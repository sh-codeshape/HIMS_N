import React from 'react';

export default function PageContainer({ title, subtitle, children, className, embedded = false, rightAction }) {
  if (embedded) {
    return <div className={`w-full ${className || ''}`}>{children}</div>;
  }

  return (
    <div className={`p-6 md:p-8 w-full max-w-7xl mx-auto ${className || ''}`}>
      {(title || rightAction) && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
