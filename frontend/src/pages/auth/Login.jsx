import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { LOGIN_ROLE_OPTIONS, ROLES } from "../../auth/roles";
import { useAuth } from "../../auth/AuthContext.jsx";
import Icon from "../../components/common/Icon.jsx";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import { required, email, validateField } from "../../utils/validation.js";
import "./Login.css";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(ROLES.ADMIN);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: LOGIN_ROLE_OPTIONS[0]?.email || "admin@narayanhospital.com",
    password: "password123",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const setTouchedField = (name) => setTouched((p) => ({ ...p, [name]: true }));
  const clearFieldError = (name) => setErrors((p) => { const next = { ...p }; delete next[name]; return next; });

  const validateLoginField = (name, value) => {
    let result = { isValid: true, message: null };
    if (name === "username") {
      result = validateField(value, [(v) => required(v, "Username / Email")]);
      // If it looks like an email (contains @), validate the email format too.
      if (result.isValid && value.includes("@")) {
        result = email(value);
      }
    } else if (name === "password") {
      result = validateField(value, [(v) => required(v, "Password")]);
    }
    if (result.isValid) clearFieldError(name);
    else setErrors((p) => ({ ...p, [name]: result.message }));
    return result.isValid;
  };

  const fieldError = (name) => (touched[name] ? errors[name] : null);

  const handleSelectRole = (roleOption) => {
    setSelectedRole(roleOption.role);
    setForm({
      username: roleOption.email || `${roleOption.role}@narayanhospital.com`,
      password: "password123",
    });
    setErrors({});
    setTouched({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    clearFieldError(name);
    if (touched[name]) validateLoginField(name, value);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedField(name);
    validateLoginField(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouchedField("username");
    setTouchedField("password");
    const usernameValid = validateLoginField("username", form.username);
    const passwordValid = validateLoginField("password", form.password);
    if (!usernameValid || !passwordValid) return;
    executeLogin(selectedRole || ROLES.ADMIN, form.username, form.password);
  };

  const executeLogin = async (role, username, password) => {
    setSubmitting(true);
    try {
      const user = await login({ role, username, password });
      toast.success(`Welcome to Narayan Hospital HIMS, ${user.name || "User"}!`, {
        icon: "🏥",
        duration: 3500,
      });
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Invalid credentials.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const currentRoleConfig = LOGIN_ROLE_OPTIONS.find((r) => r.role === selectedRole) || LOGIN_ROLE_OPTIONS[0];

  return (
    <div className="login-wrapper">
      {/* Main Card Container */}
      <div className="login-card-container">
        
        {/* Left Hero Section (Hidden on Mobile) */}
        <div className="hidden lg:block lg:w-[45%] relative rounded-l-2xl overflow-hidden bg-slate-900">
          <img 
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3" 
            alt="Narayan Hospital Facility" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-x-0 bottom-0 pt-24 pb-10 px-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
              Narayan Hospital
            </h1>
            <p className="text-sm text-slate-100 font-medium leading-relaxed max-w-sm drop-shadow">
              Advanced Hospital Information & Management System. Streamlining healthcare operations.
            </p>
          </div>
        </div>
        
        {/* Right Single Login Section */}
        <div className="w-full lg:w-[55%] flex flex-col h-full bg-white relative overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-8 m-auto w-full max-w-lg">
            
            {/* Top Branding Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30">
                  <Icon name="LuCross" size={20} />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-900 tracking-tight block leading-tight">Narayan Hospital</span>
                  <span className="text-xs font-semibold text-blue-600">Login Credentials</span>
                </div>
              </div>
             
            </div>

            {/* Title */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign In to Your Account</h2>
              <p className="text-xs text-slate-500">Enter your credentials or select a role below for quick access.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <Input
                  label="Username / Email"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. admin@narayanhospital.com"
                  required
                  error={fieldError("username")}
                />
                {fieldError("username") && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span className="w-[10px] h-[10px] rounded-full bg-rose-600 flex shrink-0"></span>
                    {fieldError("username")}
                  </p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your password"
                    required
                    error={fieldError("password")}
                  />
                  {fieldError("password") && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <span className="w-[10px] h-[10px] rounded-full bg-rose-600 flex shrink-0"></span>
                      {fieldError("password")}
                    </p>
                  )}
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-[42px] text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {showPassword ? "Hide" : "View"}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button 
                  type="submit" 
                  fullWidth 
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Icon name="LuLock" size={16} />
                  {submitting ? "Authenticating..." : `Sign In as ${currentRoleConfig.label}`}
                </Button>
              </div>
            </form>

            {/* Role-Based Access Section (Directly Below Form) */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="LuShield" size={14} className="text-blue-600" />
                  Role-Based Access
                </span>
                <span className="text-[11px] font-medium text-slate-400">Click role to auto-fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LOGIN_ROLE_OPTIONS.map((opt) => {
                  const isSelected = selectedRole === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => handleSelectRole(opt)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-600"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                      }`}>
                        <Icon name={opt.icon} size={16} />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">{opt.desc}</span>
                      </div>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}