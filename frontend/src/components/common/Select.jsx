import React from "react";

/**
 * Validation-aware select dropdown.
 *
 * Props: label, name, value, onChange, placeholder, required, className,
 *        error, success, helper, disabled, children (option elements)
 */
export default function Select({
  label,
  name,
  value,
  onChange,
  placeholder = "Select an option",
  required,
  className,
  error,
  success,
  helper,
  disabled,
  children,
}) {
  const isError = Boolean(error);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className || ""}`}>
      {label && (
        <label className={`text-xs font-semibold mb-1 ${
          isError ? "text-rose-600" : "text-slate-600"
        }`}>
          {label} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5 text-sm text-slate-700 bg-white
          border rounded-lg placeholder:text-slate-400
          focus:outline-none transition-all duration-200
          cursor-pointer appearance-none
          ${isError
            ? "border-rose-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            : success
            ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          }
          ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100" : ""}
        `}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <span className="w-[12px] h-[12px] rounded-full bg-rose-600 flex shrink-0"></span>
          {error}
        </p>
      )}
      {!error && success && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <span className="w-[12px] h-[12px] rounded-full bg-emerald-600 flex shrink-0"></span>
          {success}
        </p>
      )}
      {!error && !success && helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}
