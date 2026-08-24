import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  UserPlus 
} from 'lucide-react';
import { CurrentUser } from '../types';
import { loginUser, registerResident } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: CurrentUser, token: string) => void;
  onNavigateToAdminPortal?: () => void;
  appName?: string;
  societyTagline?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToAdminPortal,
  appName = 'Oakwood Heights',
  societyTagline = 'Report maintenance issues, track complaint status, and stay updated with your society.'
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unitNumber, setUnitNumber] = useState('A-101');
  const [tower, setTower] = useState('Tower A');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'LOGIN') {
      if (!email || !password) {
        setErrorMessage('Please enter both your email address and password.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await loginUser({ email: email.trim(), password });
        if (result.success && result.user && result.token) {
          const fullUser: CurrentUser = {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            unitNumber: result.user.unitNumber || (result.user.role === 'ADMIN' ? 'AOA Office' : 'Assigned'),
            tower: result.user.tower || 'Tower A',
            phone: result.user.phone || '+1 (555) 019-2834',
            avatar: result.user.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
          };
          onLoginSuccess(fullUser, result.token);
        } else {
          setErrorMessage(result.error || result.message || 'Invalid email or password. Please try again.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Unable to connect to server. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // REGISTER MODE
      if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
        setErrorMessage('Please fill out all required registration fields.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }

      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      setIsLoading(true);
      try {
        const regResult = await registerResident({
          name: fullName.trim(),
          email: email.trim(),
          password,
          unitNumber: unitNumber || 'A-101',
          tower: tower || 'Tower A',
          phone: '+1 (555) 019-4455'
        });

        if (regResult.success && regResult.user && regResult.token) {
          const fullUser: CurrentUser = {
            id: regResult.user.id,
            name: regResult.user.name,
            email: regResult.user.email,
            role: 'RESIDENT',
            unitNumber: regResult.user.unitNumber || unitNumber || 'A-101',
            tower: regResult.user.tower || tower || 'Tower A',
            phone: regResult.user.phone || '+1 (555) 019-4455',
            avatar: regResult.user.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
          };
          onLoginSuccess(fullUser, regResult.token);
        } else {
          setErrorMessage(regResult.error || regResult.message || 'Registration failed. Email might already exist.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Unable to complete registration. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#0B1121] text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Left Hero Brand Panel with Luxury Architecture Graphic */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[340px] md:min-h-screen bg-gradient-to-br from-[#0B1121] via-[#0B1121] to-teal-950/30">
        
        {/* Background Decorative Architecture Graphic & Glows */}
        <div 
          className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80')`
          }}
        />

        {/* Ambient Teal / Cyan Gradient Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-600/30 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Mini Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">{appName}</span>
            <span className="block text-[11px] text-teal-300 font-medium uppercase tracking-wider">Society Maintenance Tracker</span>
          </div>
        </div>

        {/* Center Hero Branding text */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 mb-6 backdrop-blur-md shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {appName}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300/90 leading-relaxed font-light">
            {societyTagline}
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-xs text-teal-200">
            <div className="flex items-center gap-2 bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] px-3.5 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Raise Maintenance Complaints</span>
            </div>
            <div className="flex items-center gap-2 bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] px-3.5 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Track Complaint Status</span>
            </div>
            <div className="flex items-center gap-2 bg-[#111827]/80 backdrop-blur-md border border-[#1F2937] px-3.5 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Receive Notice Updates</span>
            </div>
          </div>
        </div>

        {/* Footer info on left panel */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} {appName} Management System</span>
          <span className="hidden sm:inline">Secure 256-Bit SSL Encrypted</span>
        </div>
      </div>

      {/* Right Login / Register Form Card Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#0B1121] text-slate-100 overflow-y-auto">
        <div className="w-full max-w-md">
          
          {/* Card Container */}
          <div className="bg-[#111827] rounded-2xl shadow-[0_0_50px_rgba(20,184,166,0.15)] border border-[#1F2937] p-8 sm:p-10">
            
            {/* Center Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 ring-4 ring-teal-50">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mt-5 mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {mode === 'LOGIN' ? 'Welcome Back' : 'Create Resident Account'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {mode === 'LOGIN' 
                  ? 'Sign in to access your dashboard' 
                  : 'Register your apartment unit to get started'}
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success banner */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                        Tower / Wing
                      </label>
                      <select
                        value={tower}
                        onChange={(e) => setTower(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      >
                        <option value="Tower A">Tower A</option>
                        <option value="Tower B">Tower B</option>
                        <option value="Tower C">Tower C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                        Unit Number
                      </label>
                      <input
                        type="text"
                        required
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        placeholder="e.g. A-402"
                        className="w-full px-3 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
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
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                  Password
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
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0B1121] border border-[#1F2937] rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-white font-medium text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-600/25 border border-teal-500/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'LOGIN' ? 'Authenticating...' : 'Creating Account...'}</span>
                    </>
                  ) : mode === 'LOGIN' ? (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle between Login and Register */}
            <div className="mt-5 text-center pt-4 border-t border-slate-100">
              {mode === 'LOGIN' ? (
                <div className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('REGISTER');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-teal-600 font-semibold hover:text-teal-700 hover:underline cursor-pointer ml-1"
                  >
                    Create Resident Account
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-teal-600 font-semibold hover:text-teal-700 hover:underline cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Link to Admin Portal */}
            {onNavigateToAdminPortal && (
              <div className="mt-4 pt-3 border-t border-[#1F2937] text-center">
                <button
                  type="button"
                  onClick={onNavigateToAdminPortal}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Administrator Portal & Login (/admin/login)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Having trouble signing in? Contact Society Management Office at <span className="text-teal-400 font-medium">+1 (800) 555-0199</span>
          </div>

        </div>
      </div>

    </div>
  );
};

