import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  LayoutDashboard, 
  AlertTriangle, 
  Bell, 
  CreditCard, 
  Users, 
  HelpCircle, 
  Settings,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  ArrowRight,
  Clock
} from 'lucide-react';
import { 
  Complaint, 
  CurrentUser, 
  Notice, 
  MaintenanceBill, 
  SocietyUnit, 
  StaffMember,
  CreateNoticeInput,
  UpdateNoticeInput
} from '../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminComplaintManagement } from './AdminComplaintManagement';
import { NoticesBoard } from './NoticesBoard';
import { DuesAndBilling } from './DuesAndBilling';
import { UnitsDirectory } from './UnitsDirectory';
import { StaffRoster } from './StaffRoster';
import { updateUserProfile } from '../services/authService';
import { 
  fetchAdminSettingsFromServer, 
  updateAdminOverdueThresholdOnServer 
} from '../services/adminComplaintService';

interface AdminPortalViewProps {
  currentUser: CurrentUser;
  complaints: Complaint[];
  notices: Notice[];
  bills: MaintenanceBill[];
  units: SocietyUnit[];
  staffList: StaffMember[];
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenNewComplaint?: () => void;
  onUpdateComplaints: React.Dispatch<React.SetStateAction<Complaint[]>>;
  onAddNotice: (noticeInput: CreateNoticeInput) => void;
  onUpdateNotice: (id: string, updates: UpdateNoticeInput) => void;
  onDeleteNotice: (id: string) => void;
  onTogglePinNotice: (id: string) => void;
  onPayBill: (billId: string, method: string) => void;
  showToast: (msg: string) => void;
  onLogout: () => void;
  onUpdateCurrentUser?: (user: CurrentUser) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  complaints,
  notices,
  bills,
  units,
  staffList,
  activeTab,
  onNavigateTab,
  onSelectComplaint,
  onUpdateComplaints,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onTogglePinNotice,
  onPayBill,
  showToast,
  onLogout,
  onUpdateCurrentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [adminInitialCategory, setAdminInitialCategory] = useState<string>('ALL');
  const [adminInitialStatus, setAdminInitialStatus] = useState<string>('ALL');

  // Administrator Profile & SLA Settings State
  const [adminName, setAdminName] = useState(currentUser.name);
  const [adminEmail, setAdminEmail] = useState(currentUser.email || 'admin@oakwoodresidency.com');
  const [adminPhone, setAdminPhone] = useState(currentUser.phone || '+1 (555) 019-2834');
  const [adminUnit, setAdminUnit] = useState(currentUser.unitNumber || 'Tower A - Office');
  const [slaDays, setSlaDays] = useState<number>(3);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Sync with currentUser props and fetch server SLA threshold on mount
  useEffect(() => {
    setAdminName(currentUser.name);
    setAdminEmail(currentUser.email || 'admin@oakwoodresidency.com');
    setAdminPhone(currentUser.phone || '+1 (555) 019-2834');
    setAdminUnit(currentUser.unitNumber || 'Tower A - Office');
  }, [currentUser]);

  useEffect(() => {
    fetchAdminSettingsFromServer().then(res => {
      if (res.success && res.data?.overdueThresholdDays) {
        setSlaDays(res.data.overdueThresholdDays);
      }
    }).catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    if (!adminName.trim()) {
      setSaveErrorMsg('Administrator name cannot be empty.');
      return;
    }

    if (isNaN(slaDays) || slaDays < 1 || slaDays > 365) {
      setSaveErrorMsg('SLA overdue threshold must be between 1 and 365 days.');
      return;
    }

    setIsSavingSettings(true);
    try {
      // 1. Update Admin Profile on server
      const profileRes = await updateUserProfile({
        name: adminName.trim(),
        phone: adminPhone.trim(),
        unitNumber: adminUnit.trim()
      });

      if (!profileRes.success || !profileRes.user) {
        setSaveErrorMsg(profileRes.error || 'Failed to update administrator profile.');
        setIsSavingSettings(false);
        return;
      }

      // 2. Update SLA Overdue Threshold on server
      const slaRes = await updateAdminOverdueThresholdOnServer(slaDays);
      if (!slaRes.success) {
        setSaveErrorMsg(slaRes.error || 'Failed to update SLA settings.');
        setIsSavingSettings(false);
        return;
      }

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(profileRes.user);
      }

      setSaveSuccessMsg('Administrator Profile and SLA configuration updated successfully.');
      showToast('Admin Profile & SLA settings saved successfully!');
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'An error occurred while saving settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Stats summary
  const openCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;

  return (
    <div className="flex h-screen bg-[#0B1121] text-slate-400 font-sans overflow-hidden">
      
      {/* Sidebar - Matching Resident Portal */}
      <aside className="w-64 bg-[#0B1121] border-r border-[#1F2937] flex flex-col hidden md:flex shrink-0">
        
        {/* Brand Header */}
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-1">
            <div className="bg-gradient-to-br from-teal-400 to-cyan-600 p-2 rounded-lg shadow-lg shadow-teal-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-white">Oakwood<br/>Heights</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Administrator Hub</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Admin Menu</p>
          <nav className="space-y-1 select-none">
            
            {/* 1. Dashboard */}
            <button 
              onClick={() => onNavigateTab('dashboard')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* 2. Complaints */}
            <button 
              onClick={() => onNavigateTab('complaints')} 
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'complaints' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Complaints</span>
              </div>
              {openCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {openCount}
                </span>
              )}
            </button>

            {/* 3. Notices */}
            <button 
              onClick={() => onNavigateTab('notices')} 
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'notices' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notices Board</span>
              </div>
              {notices.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {notices.length}
                </span>
              )}
            </button>

            {/* 4. Maintenance Dues */}
            <button 
              onClick={() => onNavigateTab('dues')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'dues' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Dues & Accounts</span>
            </button>

            {/* 5. Units & Residents Directory */}
            <button 
              onClick={() => onNavigateTab('units')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'units' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Units & Residents</span>
            </button>

            {/* 6. Facility Staff */}
            <button 
              onClick={() => onNavigateTab('staff')} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'staff' 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Facility Staff</span>
            </button>

          </nav>
        </div>

        {/* Bottom Sidebar Links */}
        <div className="mt-auto p-4 space-y-1 border-t border-[#1F2937]">
          <button 
            onClick={() => onNavigateTab('support')} 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'support' 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support Desk</span>
          </button>
          
          <button 
            onClick={() => onNavigateTab('settings')} 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Admin Settings</span>
          </button>
        </div>

      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header - Matching Resident Portal */}
        <header className="h-20 border-b border-[#1F2937] flex items-center justify-between px-6 sm:px-8 shrink-0 bg-[#0B1121]">
          
          {/* Top Search Input */}
          <div className="relative w-80 sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search complaints, residents, or notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-[#1F2937] rounded-xl pl-10 pr-12 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-[#1F2937] border border-[#374151] rounded opacity-70">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Notices Bell */}
            <button 
              onClick={() => onNavigateTab('notices')} 
              className="relative p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="View Notices"
            >
              <Bell className="w-5 h-5" />
              {notices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              )}
            </button>

            {/* Settings Icon */}
            <button 
              onClick={() => onNavigateTab('settings')} 
              className={`p-2 transition-colors cursor-pointer ${activeTab === 'settings' ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
              title="Admin Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-[#1F2937] mx-1"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                className="flex items-center gap-3 hover:bg-[#1F2937] p-1.5 pr-3 rounded-lg transition-colors border border-transparent hover:border-[#374151] cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-teal-400 font-bold uppercase">{currentUser.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-[#1F2937] mb-1">
                      <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Administrator Session</span>
                      </div>
                      <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-400 truncate">{currentUser.email || 'admin@oakwoodresidency.com'}</p>
                    </div>
                    
                    <div className="px-2 space-y-1">
                      <button 
                        onClick={() => {
                          onNavigateTab('settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1F2937] transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>Admin Profile & SLA</span>
                      </button>

                      <div className="border-t border-[#1F2937] my-1"></div>

                      <button 
                        onClick={() => {
                          onLogout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            
            {/* TAB 0: Admin Dashboard */}
            {activeTab === 'dashboard' && (
              <AdminDashboard
                currentUser={currentUser}
                complaints={complaints}
                units={units}
                onSelectComplaint={onSelectComplaint}
                onNavigateToComplaints={(filter) => {
                  if (filter?.category) setAdminInitialCategory(filter.category);
                  else setAdminInitialCategory('ALL');

                  if (filter?.status) setAdminInitialStatus(filter.status);
                  else if (filter?.overdueOnly) setAdminInitialStatus('OVERDUE');
                  else setAdminInitialStatus('ALL');

                  onNavigateTab('complaints');
                }}
                onShowToast={showToast}
              />
            )}

            {/* TAB 1: Complaints Management */}
            {activeTab === 'complaints' && (
              <AdminComplaintManagement
                currentUser={currentUser}
                complaints={complaints}
                units={units}
                staffList={staffList}
                initialCategory={adminInitialCategory}
                initialStatus={adminInitialStatus}
                onUpdateComplaints={onUpdateComplaints}
                onSelectComplaint={onSelectComplaint}
                onShowToast={showToast}
                onNavigateToDashboard={() => onNavigateTab('dashboard')}
              />
            )}

            {/* TAB 2: Notices */}
            {activeTab === 'notices' && (
              <NoticesBoard
                notices={notices}
                currentUser={currentUser}
                onAddNotice={onAddNotice}
                onUpdateNotice={onUpdateNotice}
                onDeleteNotice={onDeleteNotice}
                onTogglePin={onTogglePinNotice}
                onShowToast={showToast}
              />
            )}

            {/* TAB 3: Dues & Finances */}
            {activeTab === 'dues' && (
              <DuesAndBilling
                bills={bills}
                currentUser={currentUser}
                onPayBill={onPayBill}
              />
            )}

            {/* TAB 4: Units Directory */}
            {activeTab === 'units' && (
              <UnitsDirectory
                units={units}
                currentUser={currentUser}
              />
            )}

            {/* TAB 5: Staff Roster */}
            {activeTab === 'staff' && (
              <StaffRoster
                staffList={staffList}
                currentUser={currentUser}
              />
            )}

            {/* TAB 6: Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Administration Settings & SLA</h3>
                  <p className="text-sm text-slate-400">Configure society governance rules, administrator profile, and complaint SLA overdue thresholds.</p>
                </div>

                {saveSuccessMsg && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {saveErrorMsg && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}
                
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl">
                  {/* Section 1: Administrator Profile */}
                  <div className="p-6 border-b border-[#1F2937]">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-4 h-4 text-teal-400" />
                      <h4 className="text-sm font-semibold text-white">Administrator Profile</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Administrator Name</label>
                        <input 
                          type="text" 
                          value={adminName} 
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. Eleanor Vance"
                          className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Administrative Office / Unit</label>
                        <input 
                          type="text" 
                          value={adminUnit} 
                          onChange={(e) => setAdminUnit(e.target.value)}
                          placeholder="e.g. Tower A - Office"
                          className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Phone</label>
                        <input 
                          type="text" 
                          value={adminPhone} 
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 019-2834"
                          className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Email</label>
                        <input 
                          type="text" 
                          disabled 
                          value={adminEmail} 
                          className="w-full bg-[#0B1121]/60 border border-[#1F2937] rounded-lg px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: SLA & Overdue Configuration */}
                  <div className="p-6 border-b border-[#1F2937]">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-teal-400" />
                      <h4 className="text-sm font-semibold text-white">SLA & Escalation Rules</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Complaint Overdue Threshold (Days)
                        </label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            min="1" 
                            max="365"
                            value={slaDays} 
                            onChange={(e) => setSlaDays(parseInt(e.target.value) || 1)}
                            className="w-32 bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors" 
                          />
                          <span className="text-xs text-slate-400">days without resolution</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          Complaints open longer than this duration will automatically trigger the OVERDUE badge and jump to the top of the admin queue.
                        </p>
                      </div>

                      <div className="bg-[#0B1121] border border-[#1F2937] rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Active SLA Policy</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          All submitted tickets start with a <strong className="text-slate-200">{slaDays}-day</strong> resolution SLA. If unresolved by day {slaDays + 1}, tickets are prioritized for immediate facility manager escalation.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="p-6 bg-[#0B1121]/50 flex justify-end gap-3 items-center">
                    <button 
                      onClick={() => onNavigateTab('dashboard')} 
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Back to Dashboard
                    </button>
                    <button 
                      onClick={handleSaveSettings} 
                      disabled={isSavingSettings}
                      className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-teal-600/20"
                    >
                      {isSavingSettings ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: Support */}
            {activeTab === 'support' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Administrative Support Desk</h3>
                  <p className="text-sm text-slate-400">Society maintenance system guidelines and IT operations.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
                      <h4 className="font-semibold text-white text-sm mb-2">How do SLA Overdue rules work?</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Unresolved complaints that exceed the configured threshold are flagged as OVERDUE and automatically pinned to the top of the admin complaint queue.
                      </p>
                    </div>
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
                      <h4 className="font-semibold text-white text-sm mb-2">How are audit histories preserved?</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Every status update or administrative comment appends an immutable record with author, timestamp, previous status, and notes.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-lg shadow-slate-900/50">
                    <h4 className="font-semibold text-white text-sm mb-3">Facility Escalation Hotline</h4>
                    <p className="text-xs text-slate-400 mb-4">For immediate facility emergencies (power outage, elevator malfunction, or security):</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-[#0B1121] p-3 rounded-xl border border-[#1F2937] text-slate-300 flex justify-between">
                        <span>Central Control Room:</span>
                        <strong className="text-teal-400">+1 (555) 019-2834</strong>
                      </div>
                      <div className="bg-[#0B1121] p-3 rounded-xl border border-[#1F2937] text-slate-300 flex justify-between">
                        <span>Facility IT Desk:</span>
                        <strong className="text-teal-400">ops@oakwoodresidency.com</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

    </div>
  );
};
