import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Building, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  LogIn,
  UserPlus
} from 'lucide-react';
import { registerResident, loginUser, AuthResponse } from '../services/authService';
import { CurrentUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: CurrentUser, token: string) => void;
  onShowToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onShowToast
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'ADMIN_SETUP'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form state (ALWAYS Resident)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regTower, setRegTower] = useState('Tower A');
  const [regPhone, setRegPhone] = useState('');

  // Admin setup state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res: AuthResponse = await loginUser({
        email: loginEmail,
        password: loginPassword
      });

      if (!res.success || !res.user || !res.token) {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
        setLoading(false);
        return;
      }

      const verifiedUser: CurrentUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        unitNumber: res.user.unitNumber || '',
        tower: res.user.tower || '',
        phone: res.user.phone || '',
        avatar: res.user.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };

      onAuthSuccess(verifiedUser, res.token);
      onShowToast(`Signed in as ${verifiedUser.name} (${verifiedUser.role})`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res: AuthResponse = await registerResident({
        name: regName,
        email: regEmail,
        password: regPassword,
        unitNumber: regUnit,
        tower: regTower,
        phone: regPhone
      });

      if (!res.success || !res.user || !res.token) {
        setErrorMessage(res.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      const verifiedUser: CurrentUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: 'RESIDENT', // Strictly Resident
        unitNumber: res.user.unitNumber || '',
        tower: res.user.tower || '',
        phone: res.user.phone || '',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };

      onAuthSuccess(verifiedUser, res.token);
      onShowToast(`Resident account created for ${verifiedUser.name}!`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-setup-secret': adminSecret
        },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          setupSecret: adminSecret
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMessage(data.error || 'Admin bootstrap failed.');
        setLoading(false);
        return;
      }

      onShowToast('Administrator account provisioned! Please login.');
      setTab('LOGIN');
      setLoginEmail(adminEmail);
      setLoginPassword(adminPassword);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Admin bootstrap network error.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill for demo / testing
  const fillResidentDemo = () => {
    setLoginEmail('sarah.c@oakwood.com');
    setLoginPassword('Resident@Oakwood123');
    setErrorMessage(null);
  };

  const fillAdminDemo = () => {
    setLoginEmail('admin@oakwoodresidency.com');
    setLoginPassword('Admin@Oakwood123');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-2xl max-w-md w-full shadow-2xl border border-[#1F2937] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1F2937] flex items-center justify-between bg-[#0B1121]/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Oakwood Residency Auth
            </h3>
            <p className="text-xs text-slate-400">Secure PostgreSQL & Prisma Authentication</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-[#1F2937]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 border-b border-[#1F2937] bg-[#111827]/60 p-1 text-xs font-semibold">
          <button
            onClick={() => { setTab('LOGIN'); setErrorMessage(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'LOGIN' ? 'bg-[#111827] text-teal-400 shadow-xs font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setErrorMessage(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'REGISTER' ? 'bg-[#111827] text-teal-400 shadow-xs font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Resident Sign Up
          </button>
          <button
            onClick={() => { setTab('ADMIN_SETUP'); setErrorMessage(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'ADMIN_SETUP' ? 'bg-[#111827] text-teal-400 shadow-xs font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Admin Setup
          </button>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. sarah.c@oakwood.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
              </div>

              {/* Quick credentials helper */}
              <div className="p-3 bg-[#0B1121] rounded-xl border border-[#1F2937]/80 text-xs">
                <p className="font-semibold text-slate-300 mb-1.5">Quick Demo Credentials:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={fillResidentDemo}
                    className="flex-1 px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors text-[11px]"
                  >
                    Resident (Sarah C)
                  </button>
                  <button
                    type="button"
                    onClick={fillAdminDemo}
                    className="flex-1 px-2 py-1 rounded bg-teal-500/10 text-teal-400 font-medium hover:bg-teal-500/20 transition-colors text-[11px]"
                  >
                    Admin (Eleanor V)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 border border-teal-500/50 shadow-teal-900/20 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In Securely'}
              </button>
            </form>
          )}

          {/* TAB 2: RESIDENT REGISTRATION */}
          {tab === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Registration strictly assigns verified <strong>RESIDENT</strong> role.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tower</label>
                  <select
                    value={regTower}
                    onChange={(e) => setRegTower(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#1F2937] bg-[#111827] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  >
                    <option value="Tower A">Tower A</option>
                    <option value="Tower B">Tower B</option>
                    <option value="Tower C">Tower C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Number</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regUnit}
                      onChange={(e) => setRegUnit(e.target.value)}
                      placeholder="e.g. 302-A"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="david.m@oakwood.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Registering Resident...' : 'Register as Resident'}
              </button>
            </form>
          )}

          {/* TAB 3: ADMIN BOOTSTRAP */}
          {tab === 'ADMIN_SETUP' && (
            <form onSubmit={handleAdminSetupSubmit} className="space-y-3.5">
              <div className="bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20 text-teal-200 text-xs">
                <p className="font-semibold mb-0.5">Admin Security Restriction:</p>
                <span>Administrators cannot register publicly. Provisioning requires the server setup secret key.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Setup Secret Key</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Enter ADMIN_SETUP_SECRET"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default in dev: oakwood-admin-bootstrap-secret-change-in-production</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Society Manager"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.office@oakwood.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Provisioning...' : 'Provision Administrator'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
