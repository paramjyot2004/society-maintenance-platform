import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  PlusCircle, 
  ShieldCheck, 
  Wrench, 
  UserCheck, 
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  KeyRound
} from 'lucide-react';
import { CurrentUser, UserRole } from '../types';
import { CURRENT_USERS } from '../data/mockData';

interface NavbarProps {
  currentUser: CurrentUser;
  onSwitchRole: (role: UserRole) => void;
  onOpenNewComplaint: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNoticesCount: number;
  openTicketsCount: number;
  onOpenAuthModal?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchRole,
  onOpenNewComplaint,
  activeTab,
  setActiveTab,
  unreadNoticesCount,
  openTicketsCount,
  onOpenAuthModal,
  isAuthenticated,
  onLogout
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#111827] dark:bg-teal-600 border-b border-[#1F2937]/80 dark:border-slate-800 shadow-none backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Society Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-blue-700 flex items-center justify-center text-white shadow-none ring-2 ring-teal-50 dark:ring-teal-950">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white dark:text-slate-100 text-base tracking-tight font-serif">Oakwood Heights</span>
                <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  Live Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Society Maintenance & Facility System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1F2937]/80 dark:bg-slate-800/80 p-1 rounded-xl border border-[#1F2937]/60 dark:border-slate-700/60">
            {currentUser.role === 'ADMIN' && (
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#111827] dark:bg-slate-700 text-teal-400 dark:text-slate-400 shadow-none font-semibold'
                    : 'text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#374151]/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            )}

            <button
              id="nav-tab-complaints"
              onClick={() => setActiveTab('complaints')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-[#111827] dark:bg-slate-700 text-teal-400 dark:text-slate-400 shadow-none font-semibold'
                  : 'text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#374151]/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {currentUser.role === 'ADMIN' ? 'Manage Complaints' : 'Complaints'}
              {openTicketsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[11px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-full">
                  {openTicketsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-notices"
              onClick={() => setActiveTab('notices')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'notices'
                  ? 'bg-[#111827] dark:bg-slate-700 text-teal-400 dark:text-slate-400 shadow-none font-semibold'
                  : 'text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#374151]/50 dark:hover:bg-slate-700/50'
              }`}
            >
              Notices
              {unreadNoticesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="nav-tab-dues"
              onClick={() => setActiveTab('dues')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'dues'
                  ? 'bg-[#111827] dark:bg-slate-700 text-teal-400 dark:text-slate-400 shadow-none font-semibold'
                  : 'text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#374151]/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {currentUser.role === 'ADMIN' ? 'Dues & Finances' : 'Maintenance Dues'}
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                id="nav-tab-units"
                onClick={() => setActiveTab('units')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'units'
                    ? 'bg-[#111827] dark:bg-slate-700 text-teal-400 dark:text-slate-400 shadow-none font-semibold'
                    : 'text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#374151]/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Units & Residents
              </button>
            )}

            <button
              id="nav-tab-staff"
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-[#111827] dark:bg-slate-700 text-teal-400 dark:text-slate-400 shadow-none font-semibold'
                  : 'text-slate-400 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-[#374151]/50 dark:hover:bg-slate-700/50'
              }`}
            >
              Facility Staff
            </button>
          </nav>

          {/* Right Action buttons & Role Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Quick Raise Ticket button */}
            <button
              id="btn-raise-complaint"
              onClick={onOpenNewComplaint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-none hover:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Raise Complaint</span>
              <span className="sm:hidden">Raise</span>
            </button>

            {/* Profile Menu & Role Switcher Popover */}
            <div className="relative">
              <button
                id="btn-role-switcher"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-[#1F2937] dark:border-slate-700 hover:border-[#374151] dark:hover:border-slate-600 bg-[#0B1121] dark:bg-slate-800 hover:bg-[#1F2937] dark:hover:bg-slate-700/80 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#374151] dark:bg-slate-700 shrink-0 ring-1 ring-slate-300 dark:ring-slate-600">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="hidden lg:block pr-1">
                  <p className="text-xs font-semibold text-slate-200 dark:text-slate-200 leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    {currentUser.role === 'RESIDENT' && <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    {currentUser.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                    {currentUser.role === 'TECHNICIAN' && <Wrench className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                    {currentUser.role} • {currentUser.unitNumber}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {roleDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setRoleDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#111827] dark:bg-teal-600 border border-[#1F2937] dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    
                    {/* User profile headline */}
                    <div className="px-3.5 py-2.5 border-b border-[#1F2937] dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#374151] dark:bg-slate-700 shrink-0">
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white dark:text-slate-100 truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email || `${currentUser.unitNumber}@oakwood.residency`}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-3.5 py-2 border-b border-[#1F2937] dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Persona</p>
                    </div>

                    <div className="p-1 space-y-1">
                      {/* Resident Option */}
                      <button
                        onClick={() => {
                          onSwitchRole('RESIDENT');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          currentUser.role === 'RESIDENT' ? 'bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60' : 'hover:bg-[#0B1121] dark:hover:bg-teal-500/60'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white dark:text-slate-100">{CURRENT_USERS.RESIDENT.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Resident ({CURRENT_USERS.RESIDENT.unitNumber})</p>
                        </div>
                      </button>

                      {/* Admin Option */}
                      <button
                        onClick={() => {
                          onSwitchRole('ADMIN');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          currentUser.role === 'ADMIN' ? 'bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60' : 'hover:bg-[#0B1121] dark:hover:bg-teal-500/60'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white dark:text-slate-100">{CURRENT_USERS.ADMIN.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Management Committee</p>
                        </div>
                      </button>

                      {/* Technician Option */}
                      <button
                        onClick={() => {
                          onSwitchRole('TECHNICIAN');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                          currentUser.role === 'TECHNICIAN' ? 'bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60' : 'hover:bg-[#0B1121] dark:hover:bg-teal-500/60'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white dark:text-slate-100">{CURRENT_USERS.TECHNICIAN.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Facility Technician</p>
                        </div>
                      </button>
                    </div>

                    {/* Quick Auth Actions */}
                    <div className="p-2 border-t border-[#1F2937] dark:border-slate-800 bg-[#0B1121]/80 dark:bg-slate-800/50 rounded-b-xl space-y-1.5">
                      {isAuthenticated ? (
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out Session</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            if (onOpenAuthModal) onOpenAuthModal();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-teal-400 dark:text-slate-400 bg-teal-500/10 dark:bg-teal-950/40 hover:bg-teal-500/20 dark:hover:bg-teal-900/60 border border-teal-500/20 dark:border-teal-800/60 transition-colors cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Resident Sign In / Register</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct Auth trigger button on desktop */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1F2937] dark:border-slate-700 hover:bg-[#1F2937] dark:hover:bg-teal-500 text-xs font-semibold text-slate-300 dark:text-slate-200 transition-colors cursor-pointer"
                title="Account Login / Registration"
              >
                <KeyRound className="w-3.5 h-3.5 text-teal-400 dark:text-teal-400" />
                <span>{isAuthenticated ? 'Session' : 'Sign In'}</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-between border-t border-[#1F2937]/60 dark:border-slate-800 py-2 overflow-x-auto gap-2">
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 dark:text-slate-300 bg-[#1F2937] dark:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
          )}
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'complaints' ? 'bg-teal-600 text-white' : 'text-slate-400 dark:text-slate-300 bg-[#1F2937] dark:bg-slate-800'
            }`}
          >
            Complaints ({openTicketsCount})
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'notices' ? 'bg-teal-600 text-white' : 'text-slate-400 dark:text-slate-300 bg-[#1F2937] dark:bg-slate-800'
            }`}
          >
            Notices {unreadNoticesCount > 0 && '•'}
          </button>
          <button
            onClick={() => setActiveTab('dues')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'dues' ? 'bg-teal-600 text-white' : 'text-slate-400 dark:text-slate-300 bg-[#1F2937] dark:bg-slate-800'
            }`}
          >
            Dues
          </button>
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('units')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === 'units' ? 'bg-teal-600 text-white' : 'text-slate-400 dark:text-slate-300 bg-[#1F2937] dark:bg-slate-800'
              }`}
            >
              Units
            </button>
          )}
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'staff' ? 'bg-teal-600 text-white' : 'text-slate-400 dark:text-slate-300 bg-[#1F2937] dark:bg-slate-800'
            }`}
          >
            Staff
          </button>
        </div>

      </div>
    </header>
  );
};
