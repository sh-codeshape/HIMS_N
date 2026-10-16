import React, { useEffect, useRef } from "react";

/**
 * Enhanced, validation-aware text input.
 *
 * New props (all optional, fully backward compatible):
 *   - error       : string  -> shows red border + error message below
 *   - success     : string  -> shows green border + success message below
 *   - helper      : string  -> helper text below the input
 *   - icon        : string  -> react-icons/lu icon name shown inside input
 *   - prefix      : string  -> text shown before the input (e.g. "+91")
 *   - inputMode   : string  -> inputmode attribute (numeric, tel, email, etc.)
 *   - autoComplete: string
 *   - maxLength
 *   - onBlur / onFocus
 */
export default function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required,
  className,
  error,
  success,
  helper,
  prefix,
  inputMode,
  autoComplete,
  maxLength,
  onBlur,
  onFocus,
  disabled,
  readOnly,
}) {
  const inputRef = useRef(null);

  // Auto-select text on focus for prefixed fields (e.g. country code) so the
  // user can replace the whole value easily.
  useEffect(() => {
    if (prefix && inputRef.current) {
      const handler = () => inputRef.current.select();
      inputRef.current.addEventListener("focus", handler);
      return () => inputRef.current.removeEventListener("focus", handler);
    }
  }, [prefix]);

  const hasStatus = Boolean(error || success);
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
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium select-none">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value == null ? "" : value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2.5 text-sm text-slate-700 bg-white
            border rounded-lg
            placeholder:text-slate-400
            focus:outline-none
            transition-all duration-200
            ${prefix ? "pl-10" : ""}
            ${isError
              ? "border-rose-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              : success
              ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }
            ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100" : ""}
          `}
        />
      </div>
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
      {!error && !success && helper && (
        <p className="text-xs text-slate-500">{helper}</p>
      )}
    </div>
  );
}
