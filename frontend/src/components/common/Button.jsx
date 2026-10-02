import React from 'react';

export default function Button({ children, type = 'button', onClick, className, fullWidth, disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors ${fullWidth ? 'w-full' : ''} ${className || ''}`}
    >
      {children}
    </button>
  );
}
