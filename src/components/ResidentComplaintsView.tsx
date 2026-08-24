import React, { useState } from 'react';
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
  Sun, 
  Moon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ListFilter, 
  AlertCircle, 
  LogOut, 
  User,
  Wrench,
  RotateCcw,
  Phone
} from 'lucide-react';
import { Complaint, CurrentUser, Notice, MaintenanceBill } from '../types';
import { residentConfirmComplaintOnServer, residentConfirmComplaint } from '../services/complaintService';

interface ResidentComplaintsViewProps {
  currentUser: CurrentUser;
  allComplaints?: Complaint[];
  notices?: Notice[];
  bills?: MaintenanceBill[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenNewComplaint: () => void;
  onOpenAuthModal?: () => void;
  onNavigateTab?: (tab: string) => void;
  showToast: (msg: string) => void;
  complaintsUpdatedTrigger?: number;
  onLogout?: () => void;
  onUpdateComplaints?: (updatedComplaints: Complaint[]) => void;
  activeTab: string;
  children?: React.ReactNode;
}

export const ResidentComplaintsView: React.FC<ResidentComplaintsViewProps> = ({
  currentUser,
  allComplaints = [],
  notices = [],
  bills = [],
  onSelectComplaint,
  onOpenNewComplaint,
  onNavigateTab,
  showToast,
  onLogout,
  onUpdateComplaints,
  activeTab,
  children
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editName, setEditName] = useState(currentUser.name);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Logic
  const myComplaints = allComplaints.filter(c => 
    (c.userId && currentUser.id && c.userId === currentUser.id) ||
    (c.unitNumber && currentUser.unitNumber && c.unitNumber.toLowerCase().trim() === currentUser.unitNumber.toLowerCase().trim()) ||
    (c.residentName && currentUser.name && c.residentName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
  );
  const totalComplaints = myComplaints.length;
  const openComplaints = myComplaints.filter(c => c.status === 'OPEN').length;
  const inProgressComplaints = myComplaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedComplaints = myComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
  
  const myBills = bills.filter(b => b.unitNumber === currentUser.unitNumber);
  const unpaidBills = myBills.filter(b => b.status !== 'PAID');
  const outstandingAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
  const isOverdue = unpaidBills.some(b => new Date(b.dueDate) < new Date());

  const recentNotices = [...notices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  const filteredComplaints = myComplaints
    .filter(c => statusFilter === 'ALL' || c.status === statusFilter)
    .filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-[#1F2937] text-slate-300 border-[#374151]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT': return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
      case 'MEDIUM': return 'text-orange-400 bg-orange-500/10 border border-orange-500/20';
      default: return 'text-slate-300 bg-[#1F2937] border border-[#374151]';
    }
  };

  const getCategoryIcon = (category: string) => {
    // simplified category icon mapping
    return <AlertTriangle className="w-4 h-4" />;
  };

  const handleResidentCardConfirmClose = async (complaintId: string) => {
    try {
      const serverRes = await residentConfirmComplaintOnServer(complaintId, 'CONFIRM_CLOSE');
      if (serverRes.success && serverRes.complaint) {
        const updated = allComplaints.map(c => c.id === complaintId ? serverRes.complaint! : c);
        onUpdateComplaints?.(updated);
        showToast('Resolution confirmed! Ticket closed.');
      } else {
        const localRes = residentConfirmComplaint(complaintId, 'CONFIRM_CLOSE', currentUser.name, undefined, allComplaints);
        if (localRes.success && localRes.complaint) {
          const updated = allComplaints.map(c => c.id === complaintId ? localRes.complaint! : c);
          onUpdateComplaints?.(updated);
          showToast('Resolution confirmed! Ticket closed.');
        }
      }
    } catch {
      const localRes = residentConfirmComplaint(complaintId, 'CONFIRM_CLOSE', currentUser.name, undefined, allComplaints);
      if (localRes.success && localRes.complaint) {
        const updated = allComplaints.map(c => c.id === complaintId ? localRes.complaint! : c);
        onUpdateComplaints?.(updated);
        showToast('Resolution confirmed! Ticket closed.');
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#0B1121] text-slate-400 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B1121] border-r border-[#1F2937] flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-1">
            <div className="bg-gradient-to-br from-teal-400 to-cyan-600 p-2 rounded-lg shadow-lg shadow-teal-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Oakwood<br/>Heights</h1>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">Premium Society Management</p>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={onOpenNewComplaint}
            className="w-full bg-[#111827] hover:bg-[#1F2937] text-teal-400 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-[#1F2937] hover:border-teal-500/30"
          >
            <Plus className="w-4 h-4" />
            Raise Ticket
          </button>
        </div>

        <div className="px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Main Menu</p>
          <nav className="space-y-1 select-none">
            <button onClick={() => onNavigateTab?.('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button onClick={() => onNavigateTab?.('complaints')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'complaints' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
              <AlertTriangle className="w-4 h-4" />
              Complaints
            </button>
            <button onClick={() => onNavigateTab?.('notices')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'notices' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                Notices
              </div>
              {notices.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notices.length}</span>
              )}
            </button>
            <button onClick={() => onNavigateTab?.('dues')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'dues' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
              <CreditCard className="w-4 h-4" />
              Maintenance Dues
            </button>
            <button onClick={() => onNavigateTab?.('staff')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'staff' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
              <Users className="w-4 h-4" />
              Facility Staff
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 space-y-1">
          <button onClick={() => onNavigateTab?.('support')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'support' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
            <HelpCircle className="w-4 h-4" />
            Support
          </button>
          <button onClick={() => onNavigateTab?.('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1F2937]'}`}>
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-[#1F2937] flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search complaints, notices, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-[#1F2937] rounded-xl pl-10 pr-12 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-400 bg-[#1F2937] border border-[#374151] rounded opacity-70 text-slate-300">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigateTab?.('notices')} className="relative p-2 text-slate-400 hover:text-slate-300 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-slate-50"></span>
            </button>
            <button onClick={() => onNavigateTab?.('settings')} className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'}`}>
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-[#1F2937] mx-2"></div>
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                className="flex items-center gap-3 hover:bg-[#1F2937] p-1.5 pr-3 rounded-lg transition-colors border border-transparent hover:border-[#374151]"
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-300 leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400">{currentUser.unitNumber}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-[#1F2937] mb-1">
                      <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-400 truncate">{currentUser.email || `${currentUser.unitNumber}@oakwood.residency`}</p>
                    </div>
                    
                    <div className="px-2 space-y-1">
                      <button 
                        onClick={() => {
                          onNavigateTab?.('settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#1F2937] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Account Settings
                      </button>
                      <button 
                        onClick={() => {
                          onLogout?.();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-8">
            
            {/* Left Column (Main) */}
            {activeTab === 'dashboard' && (
            <div className="flex-1 space-y-8">
              <>
              {/* Welcome Banner */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg shadow-slate-900/50">
                <div className="relative z-10">
                  <p className="text-teal-400 font-medium mb-1 text-sm flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Good Evening, {currentUser.name.split(' ')[0]}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome to your<br/>Resident Hub</h2>
                  <p className="text-slate-400 text-sm max-w-md">All your society operations are running smoothly. You have no urgent actions required at this time.</p>
                </div>
                <div className="md:absolute md:right-8 md:bottom-8 relative z-10 mt-6 md:mt-0">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab?.('staff');
                      showToast('Facility Staff roster: Contact Duty Managers for Clubhouse and Amenity reservations.');
                    }}
                    className="w-full md:w-auto bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-teal-400" />
                    Book Amenities
                  </button>
                </div>
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full"></div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex flex-col justify-between h-28 md:h-32">
                  <div className="flex justify-between items-start">
                    <div className="bg-[#1F2937] p-2 rounded-lg border border-[#374151]"><ListFilter className="w-4 h-4 text-slate-300" /></div>
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-slate-400 bg-[#1F2937] px-2 py-0.5 rounded border border-[#374151]">TOTAL</span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{totalComplaints}</h3>
                    <p className="text-[10px] md:text-xs text-slate-400">Tickets submitted</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex flex-col justify-between h-28 md:h-32">
                  <div className="flex justify-between items-start">
                    <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20"><AlertTriangle className="w-4 h-4 text-blue-400" /></div>
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 hidden sm:block" /> ACTION REQ
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{openComplaints}</h3>
                    <p className="text-[10px] md:text-xs text-slate-400">Open complaints</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex flex-col justify-between h-28 md:h-32">
                  <div className="flex justify-between items-start">
                    <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20"><Clock className="w-4 h-4 text-orange-400" /></div>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{inProgressComplaints}</h3>
                    <p className="text-[10px] md:text-xs text-slate-400">In progress</p>
                  </div>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex flex-col justify-between h-28 md:h-32">
                  <div className="flex justify-between items-start">
                    <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{resolvedComplaints}</h3>
                    <p className="text-[10px] md:text-xs text-slate-400">Resolved issues</p>
                  </div>
                </div>
              </div>

                            </>
              {/* Complaints List */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">My Complaints</h3>
                    <p className="text-xs text-slate-400">Track and manage your facility requests.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none">
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-[#111827] border border-[#1F2937] text-slate-300 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:border-teal-500/50"
                      >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button className="p-1.5 bg-[#111827] border border-[#1F2937] rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
                      <ListFilter className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredComplaints.length === 0 ? (
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center">
                      <p className="text-slate-400 text-sm">No complaints found.</p>
                    </div>
                  ) : (
                    filteredComplaints.slice(0, 3).map(complaint => (
                      <div 
                        key={complaint.id} 
                        onClick={() => onSelectComplaint(complaint)}
                        className="bg-[#111827] border border-[#1F2937] hover:border-teal-500/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-[#1F2937] group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-[#1F2937] p-3 rounded-lg shrink-0 group-hover:bg-teal-500/10 border border-[#374151] transition-colors hidden sm:block">
                            {getCategoryIcon(complaint.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white truncate capitalize">{complaint.title}</h4>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getStatusColor(complaint.status)}`}>
                                  {complaint.status.replace('_', ' ')}
                                </span>
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${getPriorityColor(complaint.priority)}`}>
                                {complaint.priority === 'HIGH' && <AlertTriangle className="w-3 h-3 hidden sm:block" />}
                                {complaint.priority}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 truncate mb-2 first-letter:uppercase">{complaint.description}</p>
                            
                            {complaint.assignedStaffName && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-2 font-medium">
                                <Wrench className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                <span>Technician: <strong className="text-white">{complaint.assignedStaffName}</strong> {complaint.staffContact && `(${complaint.staffContact})`}</span>
                              </div>
                            )}

                            {complaint.status === 'RESOLVED' && (
                              <div className="my-2.5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2 text-xs text-teal-300 font-semibold">
                                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                                  <span>Issue resolved. Please confirm whether fixed:</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResidentCardConfirmClose(complaint.id);
                                    }}
                                    className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Confirm &amp; Close</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectComplaint(complaint);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1F2937] hover:bg-rose-900/30 text-rose-300 border border-[#374151] transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Reopen</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {complaint.status === 'IN_PROGRESS' && (
                              <div className="mb-3">
                                <div className="h-1.5 w-full bg-[#1F2937] rounded-full overflow-hidden mb-1.5">
                                  <div className="h-full bg-orange-500 w-1/2"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 text-right">In Progress • Assigned to {complaint.assignedStaffName || 'Staff'}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-400">
                              <span className="font-mono text-slate-400"># {complaint.ticketNumber || complaint.id}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Reported {new Date(complaint.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {filteredComplaints.length > 3 && (
                    <button onClick={() => onNavigateTab?.('complaints')} className="w-full py-3 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors flex items-center justify-center gap-2">
                      View all tickets <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            
            )}

                                    {activeTab === 'complaints' && (
              <div className="flex-1 w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">My Complaints</h2>
                    <p className="text-sm text-slate-500 mt-1">Track and manage your facility requests.</p>
                  </div>
                  <button 
                    onClick={onOpenNewComplaint}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-md shadow-teal-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer w-full sm:w-auto shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Raise Ticket</span>
                  </button>
                </div>

                {/* KPI CARDS - Compact & Flat */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total */}
                  <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-teal-500/30">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
                      <ListFilter className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white">{totalComplaints}</h3>
                    </div>
                  </div>
                  {/* Open */}
                  <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-blue-500/30">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Open Action</p>
                      <AlertTriangle className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white">{openComplaints}</h3>
                    </div>
                  </div>
                  {/* In Progress */}
                  <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-orange-500/30">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Working</p>
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white">{inProgressComplaints}</h3>
                    </div>
                  </div>
                  {/* Resolved */}
                  <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-green-500/30">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Resolved</p>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white">{resolvedComplaints}</h3>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-[#111827] p-3 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search tickets..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0B1121] border border-[#1F2937] text-white text-sm font-medium py-2.5 pl-9 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none bg-[#0B1121] border border-[#1F2937] text-white text-sm font-medium py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer"
                      >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Rich Complaint Cards List (1 column for better balance) */}
                <div className="grid grid-cols-1 gap-3">
                  {filteredComplaints.length === 0 ? (
                    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-12 text-center shadow-sm">
                      <div className="w-16 h-16 bg-[#0B1121] text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#1F2937]">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">No tickets found</h3>
                      <p className="text-slate-500 text-sm">You haven't submitted any complaints matching this filter.</p>
                    </div>
                  ) : (
                    filteredComplaints.map(complaint => (
                      <div 
                        key={complaint.id} 
                        className="bg-[#111827] border border-[#1F2937] hover:border-teal-500/30 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md group flex flex-col gap-3"
                        onClick={() => onSelectComplaint(complaint)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-bold text-teal-400 font-mono tracking-wider bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                                #{complaint.ticketNumber || complaint.id.split('-')[0]}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${getPriorityColor(complaint.priority)}`}>
                                {complaint.priority}
                              </span>
                            </div>
                            
                            <h4 className="text-base font-bold text-white mb-1 group-hover:text-teal-400 transition-colors truncate capitalize">{complaint.title}</h4>
                            <p className="text-sm text-slate-400 truncate first-letter:uppercase">{complaint.description}</p>
                            
                            {complaint.assignedStaffName && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-2 font-medium">
                                <Wrench className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                <span>Technician: <strong className="text-white">{complaint.assignedStaffName}</strong> {complaint.staffContact && `(${complaint.staffContact})`}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center shrink-0 gap-3 border-t sm:border-t-0 border-[#1F2937] pt-3 sm:pt-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getStatusColor(complaint.status)}`}>
                              {complaint.status.replace('_', ' ')}
                            </span>
                            
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Resident Confirmation Callout on Resolved Complaints */}
                        {complaint.status === 'RESOLVED' && (
                          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                            <div className="flex items-center gap-2.5 text-xs text-teal-300 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                              <span>Your complaint has been resolved. Please confirm whether the issue has been fixed:</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResidentCardConfirmClose(complaint.id);
                                }}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm &amp; Close Ticket</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectComplaint(complaint);
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1F2937] hover:bg-rose-900/30 text-rose-300 border border-[#374151] hover:border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                <span>Reopen</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Account Settings</h3>
                  <p className="text-sm text-slate-400">Manage your profile and preferences.</p>
                </div>
                
                <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-[#1F2937]">
                    <h4 className="text-sm font-semibold text-white mb-4">Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Number</label>
                        <input type="text" disabled defaultValue={currentUser.unitNumber} className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-slate-400 text-sm opacity-70 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                        <input type="text" disabled defaultValue={currentUser.role} className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-slate-400 text-sm opacity-70 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-b border-[#1F2937]">
                    <h4 className="text-sm font-semibold text-white mb-4">Notifications</h4>
                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setEmailEnabled(!emailEnabled)}>
                        <div>
                          <p className="text-sm font-medium text-slate-400">Email Notifications</p>
                          <p className="text-xs text-slate-400">Receive updates about your tickets via email.</p>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${emailEnabled ? 'bg-teal-600' : 'bg-[#1F2937]'}`}>
                          <span className={`inline-block h-3 w-3 rounded-full transition-transform duration-200 ${emailEnabled ? 'translate-x-5 bg-white' : 'translate-x-1 bg-slate-400'}`}></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setSmsEnabled(!smsEnabled)}>
                        <div>
                          <p className="text-sm font-medium text-slate-400">SMS Alerts</p>
                          <p className="text-xs text-slate-400">Get urgent notice alerts via SMS.</p>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${smsEnabled ? 'bg-teal-600' : 'bg-[#1F2937]'}`}>
                          <span className={`inline-block h-3 w-3 rounded-full transition-transform duration-200 ${smsEnabled ? 'translate-x-5 bg-white' : 'translate-x-1 bg-slate-400'}`}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-[#0B1121]/50 flex justify-end gap-3">
                    <button onClick={() => onNavigateTab?.('dashboard')} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => showToast('Settings saved successfully')}>Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {['notices', 'dues', 'staff'].includes(activeTab) && <div className="flex-1 w-full min-w-0">{children}</div>}
            {activeTab === 'support' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Help & Support</h3>
                  <p className="text-sm text-slate-400">Find answers or contact the management team.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* FAQs */}
                  <div className="space-y-4">
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
                      <h4 className="font-semibold text-white text-sm mb-2">How do I track my maintenance ticket?</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Navigate to the Tickets tab using the sidebar menu. Click on any ticket to view its full history, current status, and assigned staff member.</p>
                    </div>
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
                      <h4 className="font-semibold text-white text-sm mb-2">How are dues calculated?</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Monthly maintenance dues are calculated based on your unit size (sqft). Invoices are generated on the 1st of every month.</p>
                    </div>
                    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
                      <h4 className="font-semibold text-white text-sm mb-2">What qualifies as an emergency?</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Major leaks, electrical failures, and security incidents. Please mark tickets as HIGH priority or contact the front desk directly for these.</p>
                    </div>
                  </div>
                  
                  {/* Contact form */}
                  <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-lg shadow-slate-900/50 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-teal-500/10 p-2.5 rounded-lg text-teal-400">
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">Contact Management</h4>
                        <p className="text-[10px] text-slate-400">Typically replies within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                        <select className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-slate-400 text-sm focus:outline-none focus:border-teal-500/50">
                          <option>General Inquiry</option>
                          <option>Billing Issue</option>
                          <option>Feedback</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                        <textarea rows={4} className="w-full bg-[#0B1121] border border-[#1F2937] rounded-lg px-4 py-2.5 text-slate-400 text-sm focus:outline-none focus:border-teal-500/50 placeholder:text-slate-400" placeholder="How can we help?"></textarea>
                      </div>
                      <button className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors" onClick={() => showToast('Message sent to management')}>
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right Column (Secondary) */}
            {activeTab === 'dashboard' && (
            <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
              
              {/* Outstanding Dues */}
              <div className="bg-[#111827] border border-[#1F2937] shadow-lg shadow-slate-900/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 text-white mb-4 font-medium relative z-10">
                  <CreditCard className="w-5 h-5" />
                  Outstanding Dues
                </div>
                <div className="relative z-10">
                  <p className="text-slate-400 text-xs mb-1">Current Balance</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">₹{outstandingAmount.toFixed(2).split('.')[0]}</span>
                    <span className="text-slate-400 font-medium">.{outstandingAmount.toFixed(2).split('.')[1]}</span>
                  </div>
                  
                  {isOverdue && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-400 mb-0.5">OVERDUE</p>
                        <p className="text-[10px] text-rose-400/80 leading-snug">Maintenance Fee is past due. Please pay immediately to avoid late fees.</p>
                      </div>
                    </div>
                  )}

                  <button onClick={() => onNavigateTab?.('dues')} className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-500 hover:to-cyan-500 border border-teal-500/50 font-bold py-2.5 rounded-lg transition-colors text-sm shadow-lg shadow-black/20">
                    Pay Now
                  </button>
                </div>
                {/* Decorative background shape */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/10 blur-[100px] rounded-full"></div>
              </div>

              {/* Recent Notices */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-lg shadow-slate-900/50">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Bell className="w-4 h-4 text-teal-400" />
                    Recent Notices
                  </div>
                  <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded">New</span>
                </div>

                <div className="space-y-4">
                  {recentNotices.length === 0 ? (
                    <p className="text-xs text-slate-400">No notices available.</p>
                  ) : (
                    recentNotices.map((notice, idx) => (
                      <div key={notice.id} className={`${idx !== recentNotices.length - 1 ? 'border-b border-[#1F2937] pb-4' : ''}`}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {notice.category}
                        </p>
                        <h5 className="text-sm font-semibold text-slate-300 mb-1 leading-snug">{notice.title}</h5>
                        <p className="text-[10px] text-slate-400">
                          {new Date(notice.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <button onClick={() => onNavigateTab?.('notices')} className="w-full mt-4 text-xs font-medium text-slate-400 hover:text-white transition-colors">
                  View Notice Board
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1121] border-t border-[#1F2937] flex items-center justify-around p-3 z-50">
        <button onClick={() => onNavigateTab?.('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => onNavigateTab?.('complaints')} className={`flex flex-col items-center gap-1 ${activeTab === 'complaints' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Tickets</span>
        </button>
        <button onClick={() => onNavigateTab?.('notices')} className={`flex flex-col items-center gap-1 relative ${activeTab === 'notices' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-medium">Notices</span>
          {notices.length > 0 && <span className="absolute top-0 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>}
        </button>
        <button onClick={() => onNavigateTab?.('dues')} className={`flex flex-col items-center gap-1 ${activeTab === 'dues' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dues</span>
        </button>
        <button onClick={onOpenNewComplaint} className="flex flex-col items-center gap-1 text-teal-400 hover:text-teal-300 relative">
          <div className="absolute -top-6 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full p-2.5 border-4 border-[#0B1121] text-white shadow-lg shadow-teal-500/20">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium mt-6">Raise</span>
        </button>
      </div>
    </div>
  );
};
