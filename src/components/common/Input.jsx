import React from 'react';

export default function Input({ label, type = 'text', name, value, onChange, placeholder, required, className }) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className || ''}`}>
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
      />
    </div>
  );
}
