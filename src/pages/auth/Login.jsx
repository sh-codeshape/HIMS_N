import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { LOGIN_ROLE_OPTIONS } from "../../auth/roles";
import { useAuth } from "../../auth/AuthContext.jsx";
import Icon from "../../components/common/Icon.jsx";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import "./Login.css";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectRole = (roleOption) => {
    setSelectedRole(roleOption.role);
    setForm({
      username: roleOption.email || `${roleOption.role}@kgnandahospital.com`,
      password: "password123",
    });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const executeLogin = async (role, username, password) => {
    setSubmitting(true);
    try {
      const user = await login({ role, username, password });
      toast.success(`Welcome to HIMS, ${user.name || "User"}!`, {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    executeLogin(selectedRole, form.username, form.password);
  };

  const handleQuickLogin = (roleOption) => {
    executeLogin(
      roleOption.role,
      roleOption.email || `${roleOption.role}@kgnandahospital.com`,
      "password123"
    );
  };

  const currentRoleConfig = LOGIN_ROLE_OPTIONS.find((r) => r.role === selectedRole);

  return (
    <div className="login-wrapper">
      {/* Main Container - Adjusted to prevent zoomed-in feel */}
      <div className="login-card-container">
        
        {/* Left Hero Section (Hidden on Mobile) */}
        <div className="hidden lg:block lg:w-[45%] relative rounded-l-2xl overflow-hidden bg-slate-900">
          <img 
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2053&ixlib=rb-4.0.3" 
            alt="Hospital Facility" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          {/* Bottom gradient only for text readability, no full image overlay */}
          <div className="absolute inset-x-0 bottom-0 pt-24 pb-10 px-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
              Welcome to HIMS
            </h1>
            <p className="text-sm text-slate-100 font-medium leading-relaxed max-w-sm drop-shadow">
              Advanced Hospital Information & Management System. Streamlining healthcare operations.
            </p>
          </div>
        </div>
        
        {/* Right Login Section */}
        <div className="w-full lg:w-[55%] flex flex-col h-full bg-white relative">
          <div className="p-6 sm:p-8 m-auto w-full max-w-lg">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30">
                  <Icon name="LuCross" size={20} />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">HIMS Portal</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Icon name="LuSparkles" size={12} /> Demo
              </span>
            </div>

            {!selectedRole ? (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Select Your Role</h2>
                <p className="text-sm text-slate-500 mb-5">Choose a module to continue to your workspace.</p>

                <div className="grid grid-cols-1 gap-2.5 mb-6">
                  {LOGIN_ROLE_OPTIONS.map((opt) => (
                    <div
                      key={opt.role}
                      onClick={() => handleSelectRole(opt)}
                      className="group flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                        <Icon name={opt.icon} size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                        <span className="text-[11px] font-medium text-slate-500">{opt.desc}</span>
                      </div>
                      <div className="ml-auto text-slate-300 group-hover:text-blue-500 transition-colors">
                        <Icon name="LuChevronRight" size={18} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instant Access Panel */}
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <Icon name="LuZap" size={12} /> Instant Access
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LOGIN_ROLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => handleQuickLogin(opt)}
                        disabled={submitting}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-slide-in">
                <button 
                  type="button" 
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-5"
                >
                  <Icon name="LuArrowLeft" size={16} /> Back to roles
                </button>

                {/* Selected Role Banner */}
                <div className="flex items-center gap-4 p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-r-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl text-blue-600 shadow-sm">
                    <Icon name={currentRoleConfig?.icon || "LuUser"} size={24} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Sign in as {currentRoleConfig?.label}</h2>
                    <p className="text-xs font-semibold text-blue-700">{currentRoleConfig?.desc}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      label="Username / Email"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="e.g. admin@kgnandahospital.com"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Password"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-medium mt-2">
                    <Icon name="LuInfo" size={16} className="mt-0.5 shrink-0" />
                    <span><strong>Demo Mode:</strong> Pre-filled credentials will work automatically. Just click sign in.</span>
                  </div>

                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      fullWidth 
                      disabled={submitting}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98]"
                    >
                      {submitting ? "Authenticating..." : "Sign In Securely"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}