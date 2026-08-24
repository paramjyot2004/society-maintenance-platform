import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2,
  KeyRound,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { CurrentUser } from '../types';
import { loginUser } from '../services/authService';

interface AdminLoginPageProps {
  onLoginSuccess: (user: CurrentUser, token: string) => void;
  onNavigateToResidentPortal: () => void;
  appName?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateToResidentPortal,
  appName = 'Oakwood Heights'
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFillDemoAdmin = () => {
    setEmail('admin@oakwoodresidency.com');
    setPassword('Admin@Oakwood123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate server-side via POST /api/auth/login
      const result = await loginUser({ email: email.trim(), password });

      if (!result.success || !result.user || !result.token) {
        setErrorMessage(result.error || result.message || 'Invalid administrator credentials. Please verify and try again.');
        setIsLoading(false);
        return;
      }

      // Strict role verification: only ADMIN role can log in through the Admin Portal
      if (result.user.role !== 'ADMIN') {
        setErrorMessage('Access Denied: This account does not possess Administrator privileges. Please sign in via the Resident Portal.');
        setIsLoading(false);
        return;
      }

      const fullUser: CurrentUser = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: 'ADMIN',
        unitNumber: result.user.unitNumber || 'Management Office',
        tower: result.user.tower || 'Tower A',
        phone: result.user.phone || '+1 (555) 019-2834',
        avatar: result.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };

      onLoginSuccess(fullUser, result.token);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to connect to administration server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0B1121] text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Left Admin Brand Panel */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[340px] md:min-h-screen bg-gradient-to-br from-[#0B1121] via-[#0B1121] to-teal-950/30">
        
        {/* Background Graphic & Glows */}
        <div 
          className="absolute inset-0 opacity-15 mix-blend-overlay bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80')`
          }}
        />

        {/* Ambient Teal / Emerald Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-700/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Mini Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">{appName}</span>
              <span className="block text-[10px] text-teal-400 font-bold uppercase tracking-wider">Administrator Portal</span>
            </div>
          </div>

          <button
            onClick={onNavigateToResidentPortal}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-[#111827] hover:bg-[#1F2937] px-3.5 py-1.5 rounded-xl border border-[#1F2937] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Resident Portal</span>
          </button>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold mb-6">
            <KeyRound className="w-3.5 h-3.5 text-teal-400" />
            <span>Authorized Management Access Only</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Society Maintenance Governance
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300/90 leading-relaxed font-light">
            Secure administrative control room to monitor society-wide tickets, triage maintenance SLAs, broadcast notices, and oversee facility operations.
          </p>

          <div className="mt-8 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5 bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] px-3.5 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Full visibility into all resident complaints & complete audit timeline</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] px-3.5 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Server-enforced RBAC (Role-Based Access Control) & secure JWT</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] px-3.5 py-2.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Dynamic SLA overdue prioritization & real-time analytics</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} {appName} Administrative System</span>
          <span className="hidden sm:inline">Encrypted Server Authentication</span>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#0B1121] text-slate-100 overflow-y-auto">
        <div className="w-full max-w-md">
          
          <div className="bg-[#111827] rounded-2xl shadow-[0_0_50px_rgba(20,184,166,0.12)] border border-[#1F2937] p-8 sm:p-10">
            
            {/* Center Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 ring-4 ring-teal-500/20">
                <Shield className="w-7 h-7" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mt-5 mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Admin Sign In
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter your administrative credentials to access the console
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                  Admin Email Address
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
                    placeholder="admin@oakwoodresidency.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-600/25 border border-teal-500/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Admin Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Admin Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Pre-fill for testing */}
            <div className="mt-5 pt-4 border-t border-[#1F2937] text-center">
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                Auto-fill Admin Credentials (Demo)
              </button>
            </div>

            {/* Link back to Resident Portal */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onNavigateToResidentPortal}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Resident looking to file a complaint? <span className="text-teal-400 font-semibold">Resident Portal</span>
              </button>
            </div>

          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            For security reasons, all administrative logins and actions are strictly audited.
          </div>

        </div>
      </div>

    </div>
  );
};
