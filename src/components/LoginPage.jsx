import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useTheme } from '../lib/themeContext';
import { useRouter } from '../lib/router';

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { navigate } = useRouter();
  const isLight = theme === 'light';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden font-sans select-none antialiased transition-colors duration-300">
      
      {/* Background Soft Mesh Glow & Architectural Dot Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Radial Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[26rem] bg-gradient-to-b from-teal-200/35 via-cyan-100/20 to-transparent dark:from-teal-900/15 dark:via-cyan-900/10 dark:to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-1/4 w-[30rem] h-[30rem] bg-amber-100/30 dark:bg-indigo-950/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Modern Micro Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={isLight ? "/logo-black.png" : "/logo-white.png"} 
            alt="PZONE Logo" 
            className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/logo-icon.png";
            }}
          />
        </div>

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700 transition cursor-pointer shadow-2xs backdrop-blur-md"
          title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
        >
          {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </header>

      {/* Centered Main Login Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          
          {/* Main Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-slate-950 p-8 sm:p-9 space-y-6">
            
            {/* Header / Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-xs mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Sign In
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter your authorized credentials to access the Intelligent Tendering Portal.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-fadeIn leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@pzone.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 dark:focus:border-teal-500 transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-teal-600 focus:ring-teal-500/30 cursor-pointer"
                  />
                  <span className="font-semibold text-[11px]">Remember on this workstation</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-slate-900/10 dark:shadow-teal-950/30 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Launchpad</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>

            </form>

            {/* Security Pill Footer inside card */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Cloud Sync • 256-bit SSL Session</span>
            </div>

          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full py-5 text-center text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-900 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xs">
        <p className="font-mono text-[11px]">
          P.ZONE Intelligent Tendering System © 2026 • All Rights Reserved
        </p>
      </footer>

    </div>
  );
}
