import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  History, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Layers,
  FileText,
  Building2,
  Phone,
  Tag,
  AlertTriangle,
  RotateCcw,
  Settings,
  Flame,
  Check,
  Info
} from 'lucide-react';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintPriority, 
  ComplaintStatus, 
  ComplaintStatusHistory, 
  CurrentUser,
  SocietyUnit
} from '../types';
import { CategoryBadge, PriorityBadge, StatusBadge } from './CategoryBadge';
import { 
  getAdminComplaints, 
  updateComplaintStatusByAdmin, 
  setComplaintPriorityByAdmin,
  getAdminSettings,
  updateAdminOverdueThreshold,
  deriveComplaintOverdueStatus,
  DEFAULT_ADMIN_SETTINGS,
  fetchAdminComplaintsFromServer,
  fetchAdminSettingsFromServer,
  updateAdminOverdueThresholdOnServer,
  updateComplaintStatusOnServer,
  updateComplaintPriorityOnServer
} from '../services/adminComplaintService';
import { 
  sendComplaintStatusEmailNotification, 
  checkEmailServiceStatus 
} from '../services/emailService';

interface AdminComplaintManagementProps {
  currentUser: CurrentUser;
  complaints: Complaint[];
  units?: SocietyUnit[];
  initialCategory?: string;
  initialStatus?: string;
  onUpdateComplaints: (updatedComplaints: Complaint[]) => void;
  onSelectComplaint?: (complaint: Complaint) => void;
  onShowToast: (message: string) => void;
  onNavigateToDashboard?: () => void;
}

export function AdminComplaintManagement({
  currentUser,
  complaints,
  units = [],
  initialCategory = 'ALL',
  initialStatus = 'ALL',
  onUpdateComplaints,
  onSelectComplaint,
  onShowToast,
  onNavigateToDashboard
}: AdminComplaintManagementProps) {
  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize when initial filter props change
  React.useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  React.useEffect(() => {
    if (initialStatus) setSelectedStatus(initialStatus);
  }, [initialStatus]);

  // Fetch admin settings & complaints from server on mount / role change
  React.useEffect(() => {
    if (currentUser.role === 'ADMIN') {
      // 1. Fetch server-authoritative overdue threshold from Prisma AppSetting
      fetchAdminSettingsFromServer().then(settingsRes => {
        if (settingsRes.success && settingsRes.data?.overdueThresholdDays) {
          setOverdueThreshold(settingsRes.data.overdueThresholdDays);
          setTempThreshold(settingsRes.data.overdueThresholdDays);
        }
      }).catch(() => {});

      // 2. Fetch admin complaints with server-side overdue status
      fetchAdminComplaintsFromServer().then(res => {
        if (res.success && res.data && res.data.length > 0) {
          onUpdateComplaints(res.data);
        }
      }).catch(() => {});
    }
  }, [currentUser.role]);

  // Overdue Threshold Settings State
  const [overdueThreshold, setOverdueThreshold] = useState<number>(() => {
    const settings = getAdminSettings(currentUser);
    return settings.data?.overdueThresholdDays || DEFAULT_ADMIN_SETTINGS.overdueThresholdDays;
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [tempThreshold, setTempThreshold] = useState<number>(overdueThreshold);
  const [emailServiceConfig, setEmailServiceConfig] = useState<{ resendConfigured: boolean; senderEmail: string } | null>(null);

  // Load email configuration status when opening settings
  useEffect(() => {
    if (isSettingsModalOpen) {
      checkEmailServiceStatus().then(setEmailServiceConfig).catch(() => {});
    }
  }, [isSettingsModalOpen]);

  // Status Change Dialog State
  const [statusDialogTarget, setStatusDialogTarget] = useState<{
    complaint: Complaint;
    targetStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  } | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');

  // Status History Modal State
  const [historyModalComplaint, setHistoryModalComplaint] = useState<Complaint | null>(null);

  // Security Check: Unauthorized resident protection
  const isAuthorized = currentUser.role === 'ADMIN';

  // Apply service-level filtering & overdue sorting with authorization guard
  const filteredResult = useMemo(() => {
    if (!isAuthorized) {
      return { 
        success: false, 
        data: [], 
        overdueCount: 0, 
        totalCount: 0, 
        openCount: 0, 
        inProgressCount: 0, 
        resolvedCount: 0 
      };
    }
    return getAdminComplaints(
      currentUser, 
      complaints, 
      {
        category: selectedCategory,
        status: selectedStatus,
        date: selectedDate,
        searchQuery: searchQuery
      },
      overdueThreshold
    );
  }, [currentUser, complaints, selectedCategory, selectedStatus, selectedDate, searchQuery, overdueThreshold, isAuthorized]);

  const displayedComplaints = filteredResult.data || [];

  // Metrics from server-side service
  const totalCount = filteredResult.totalCount ?? complaints.length;
  const overdueCount = filteredResult.overdueCount ?? 0;
  const openCount = filteredResult.openCount ?? 0;
  const inProgressCount = filteredResult.inProgressCount ?? 0;
  const resolvedCount = filteredResult.resolvedCount ?? 0;

  // Handler: Save configurable overdue threshold to Prisma AppSetting
  const handleSaveThreshold = async (newThreshold: number) => {
    // 1. Optimistic local update
    const localRes = updateAdminOverdueThreshold(currentUser, newThreshold);
    if (localRes.success && localRes.data) {
      setOverdueThreshold(localRes.data.overdueThresholdDays);
      setTempThreshold(localRes.data.overdueThresholdDays);
      setIsSettingsModalOpen(false);
      onShowToast(`Overdue SLA threshold updated to ${localRes.data.overdueThresholdDays} day(s). Queue re-sorted.`);
    } else {
      onShowToast(localRes.error || 'Failed to update overdue threshold');
      return;
    }

    // 2. Persist to Prisma AppSetting on server
    try {
      const serverRes = await updateAdminOverdueThresholdOnServer(newThreshold);
      if (serverRes.success && serverRes.data) {
        // Re-fetch complaints from server to sync server-side computed overdue records
        const fresh = await fetchAdminComplaintsFromServer();
        if (fresh.success && fresh.data) {
          onUpdateComplaints(fresh.data);
        }
      }
    } catch {
      // Local state is already updated
    }
  };

  // Handler: Update priority
  const handlePriorityChange = async (complaintId: string, newPriority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    // Check if complaint is already resolved
    const currentComplaint = complaints.find(c => c.id === complaintId);
    if (!currentComplaint) return;

    // Optimistic local update via service
    const localRes = setComplaintPriorityByAdmin(currentUser, complaintId, newPriority, complaints);
    if (localRes.success && localRes.data) {
      const updatedList = complaints.map(c => c.id === complaintId ? localRes.data! : c);
      onUpdateComplaints(updatedList);
      onShowToast(`Priority updated to ${newPriority} for ticket ${localRes.data.ticketNumber}`);
    } else {
      onShowToast(localRes.error || 'Failed to update priority');
      return;
    }

    // Also dispatch to server API
    try {
      const serverRes = await updateComplaintPriorityOnServer(complaintId, newPriority);
      if (serverRes.success && serverRes.complaint) {
        const updatedList = complaints.map(c => c.id === complaintId ? serverRes.complaint! : c);
        onUpdateComplaints(updatedList);
      }
    } catch {
      // Local state is already updated
    }
  };

  // Handler: Confirm status change with history creation
  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusDialogTarget) return;

    const { complaint, targetStatus } = statusDialogTarget;

    // Prevent reopening if already RESOLVED
    if (complaint.status === 'RESOLVED') {
      onShowToast('Complaint is already RESOLVED and cannot be reopened.');
      setStatusDialogTarget(null);
      return;
    }

    // Try server API first if available
    let serverUpdated = false;
    try {
      const serverRes = await updateComplaintStatusOnServer(complaint.id, targetStatus, statusNote);
      if (serverRes.success && serverRes.complaint) {
        serverUpdated = true;
        const updatedList = complaints.map(c => c.id === complaint.id ? serverRes.complaint! : c);
        onUpdateComplaints(updatedList);
      } else if (serverRes.error) {
        onShowToast(serverRes.error);
        if (serverRes.code === 'TERMINAL_STATE') {
          setStatusDialogTarget(null);
          return;
        }
      }
    } catch {
      // Will fall back to local service
    }

    if (!serverUpdated) {
      const res = updateComplaintStatusByAdmin(
        currentUser,
        complaint.id,
        targetStatus,
        statusNote,
        complaints
      );

      if (res.success && res.data) {
        const updatedList = complaints.map(c => c.id === complaint.id ? res.data! : c);
        onUpdateComplaints(updatedList);
      } else {
        onShowToast(res.error || 'Failed to update status');
        return;
      }
    }
    
    const statusLabel = targetStatus === 'RESOLVED' ? 'RESOLVED (Closed)' : targetStatus;
    onShowToast(`Status updated to ${statusLabel}. History entry created.`);

    // Send email notification to resident via Resend (asynchronous & non-blocking)
    sendComplaintStatusEmailNotification(
      complaint,
      targetStatus,
      complaint.status,
      statusNote,
      currentUser,
      units
    ).then(emailRes => {
      if (emailRes.delivered) {
        onShowToast(`Email notification dispatched to ${emailRes.recipient} via Resend`);
      }
    }).catch(err => {
      console.error('[Email Notification Error]', err);
    });
    
    // Reset dialog
    setStatusDialogTarget(null);
    setStatusNote('');
  };

  // Handler: Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedDate('');
    setSearchQuery('');
  };

  // Render unauthorized banner if resident tries to access
  if (!isAuthorized) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12 shadow-none">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-red-950 mb-2">Access Denied: Admin Privileges Required</h2>
        <p className="text-sm text-red-700 mb-6 leading-relaxed">
          The Admin Complaint Management console is restricted to Society Administrators and Board Members.
          Your current session role is <strong>{currentUser.role}</strong> ({currentUser.name}).
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111827] rounded-xl border border-red-200 text-xs font-bold text-red-800">
          <AlertCircle className="w-4 h-4" />
          <span>Please switch to the Administrator role using the top navigation role switcher to view this console.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-teal-600 text-white p-6 rounded-2xl border border-slate-800 shadow-none relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                Admin Control Room
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Authorized as {currentUser.name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Complaint Management & Overdue SLA Queue
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Inspect society-wide tickets, advance status workflows, configure SLA overdue thresholds, and prioritize overdue complaints automatically at the top of the queue.
            </p>
          </div>

          {/* Quick Metrics & SLA Configuration Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            
            {/* SLA Configuration Trigger Pill */}
            <button
              onClick={() => {
                setTempThreshold(overdueThreshold);
                setIsSettingsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-bold transition-colors shadow-2xs group cursor-pointer"
              title="Configure Overdue Threshold SLA"
            >
              <Clock className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>SLA Threshold: <strong className="text-amber-300">{overdueThreshold} Days</strong></span>
              <Settings className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80">
              
              {/* Total Count */}
              <div 
                onClick={() => setSelectedStatus('ALL')}
                className={`px-3 py-1.5 text-center rounded-lg cursor-pointer transition-all border-r border-slate-700 ${
                  selectedStatus === 'ALL' ? 'bg-slate-700/80' : 'hover:bg-slate-700/40'
                }`}
                title="View All Complaints"
              >
                <div className="text-base font-black text-white">{totalCount}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
              </div>

              {/* OVERDUE COUNT (Highlighted with Alert state) */}
              <div 
                onClick={() => setSelectedStatus(selectedStatus === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                className={`px-3.5 py-1.5 text-center rounded-lg cursor-pointer transition-all border-r border-slate-700 ${
                  selectedStatus === 'OVERDUE' 
                    ? 'bg-red-500/30 ring-2 ring-red-400 text-white' 
                    : overdueCount > 0 
                    ? 'bg-red-950/40 hover:bg-red-900/60' 
                    : 'hover:bg-slate-700/40'
                }`}
                title="Click to toggle filter for OVERDUE tickets only"
              >
                <div className="text-base font-black text-red-400 flex items-center justify-center gap-1">
                  {overdueCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />}
                  <span>{overdueCount}</span>
                </div>
                <div className="text-[10px] text-red-300 uppercase font-bold tracking-wider">Overdue</div>
              </div>

              {/* Open Count */}
              <div 
                onClick={() => setSelectedStatus(selectedStatus === 'OPEN' ? 'ALL' : 'OPEN')}
                className={`px-3 py-1.5 text-center rounded-lg cursor-pointer transition-all border-r border-slate-700 ${
                  selectedStatus === 'OPEN' ? 'bg-slate-700/80' : 'hover:bg-slate-700/40'
                }`}
                title="View Open Complaints"
              >
                <div className="text-base font-black text-amber-400">{openCount}</div>
                <div className="text-[10px] text-amber-300 uppercase font-semibold">Open</div>
              </div>

              {/* In Progress Count */}
              <div 
                onClick={() => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
                className={`px-3 py-1.5 text-center rounded-lg cursor-pointer transition-all border-r border-slate-700 ${
                  selectedStatus === 'IN_PROGRESS' ? 'bg-slate-700/80' : 'hover:bg-slate-700/40'
                }`}
                title="View In Progress Complaints"
              >
                <div className="text-base font-black text-blue-400">{inProgressCount}</div>
                <div className="text-[10px] text-blue-300 uppercase font-semibold">In Progress</div>
              </div>

              {/* Resolved Count */}
              <div 
                onClick={() => setSelectedStatus(selectedStatus === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
                className={`px-3 py-1.5 text-center rounded-lg cursor-pointer transition-all ${
                  selectedStatus === 'RESOLVED' ? 'bg-slate-700/80' : 'hover:bg-slate-700/40'
                }`}
                title="View Resolved Complaints"
              >
                <div className="text-base font-black text-emerald-400">{resolvedCount}</div>
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">Resolved</div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Category, Status, Date, Search) */}
      <div className="bg-[#111827] p-4 sm:p-5 rounded-2xl border border-[#1F2937] shadow-none space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ticket #, flat, title, resident name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#374151] text-xs bg-[#0B1121] focus:bg-[#111827] focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* 1. Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#0B1121] px-2.5 py-1 rounded-xl border border-[#1F2937]">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <label className="text-[11px] font-bold text-slate-400">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 border-0 focus:ring-0 cursor-pointer py-1 pl-1 pr-6"
              >
                <option value="ALL">All Categories</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="ELEVATOR">Elevator</option>
                <option value="SECURITY">Security</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="SANITATION">Sanitation</option>
                <option value="LANDSCAPING">Landscaping</option>
                <option value="CIVIL_WORK">Civil Work</option>
                <option value="OTHER">Other / General</option>
              </select>
            </div>

            {/* 2. Status & Overdue Filter */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors ${
              selectedStatus === 'OVERDUE' 
                ? 'bg-red-50 border-red-300 text-red-900' 
                : 'bg-[#0B1121] border-[#1F2937] text-slate-200'
            }`}>
              <SlidersHorizontal className={`w-3.5 h-3.5 ${selectedStatus === 'OVERDUE' ? 'text-red-600' : 'text-slate-500'}`} />
              <label className="text-[11px] font-bold">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold border-0 focus:ring-0 cursor-pointer py-1 pl-1 pr-6"
              >
                <option value="ALL">All Statuses (Overdue prioritized first)</option>
                <option value="OVERDUE">🚨 OVERDUE ONLY (Exceeded SLA)</option>
                <option value="OPEN">OPEN (Active / Pending)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Under Work)</option>
                <option value="RESOLVED">RESOLVED (Closed)</option>
              </select>
            </div>

            {/* 3. Date Filter */}
            <div className="flex items-center gap-1.5 bg-[#0B1121] px-2.5 py-1 rounded-xl border border-[#1F2937]">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <label className="text-[11px] font-bold text-slate-400">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 border-0 focus:ring-0 cursor-pointer py-1 px-1"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-slate-400 hover:text-slate-400 ml-1"
                  title="Clear date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset Filters button */}
            {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedDate !== '' || searchQuery !== '') && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 bg-[#1F2937] hover:bg-[#374151] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>
        </div>

        {/* Results Bar with SLA summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#1F2937] text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{displayedComplaints.length}</strong> matching ticket{displayedComplaints.length === 1 ? '' : 's'}
            </span>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-red-200">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                {overdueCount} Overdue ({overdueThreshold}d SLA)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              * Overdue tickets are automatically prioritized at the top of the queue.
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-400">Live SLA Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Table / List */}
      {displayedComplaints.length === 0 ? (
        <div className="bg-[#111827] rounded-2xl p-12 text-center border border-[#1F2937]">
          <div className="w-12 h-12 rounded-full bg-[#1F2937] text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">
            {selectedStatus === 'OVERDUE' ? 'No overdue complaints detected' : 'No complaints match current admin filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {selectedStatus === 'OVERDUE' 
              ? `Great job! All unresolved tickets are currently within the ${overdueThreshold}-day SLA threshold.`
              : 'Try adjusting your category, status, or date filters to see matching society maintenance tickets.'}
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B1121]/80 border-b border-[#1F2937] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Ticket & Details</th>
                  <th className="py-3.5 px-4">Resident & Unit</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority Control</th>
                  <th className="py-3.5 px-4">Status & SLA</th>
                  <th className="py-3.5 px-4 text-right">Audit & History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedComplaints.map((c) => {
                  const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
                  const isInProgress = c.status === 'IN_PROGRESS';
                  const isOpen = !isResolved && !isInProgress;

                  // Server-authoritative overdue derivation
                  const overdueInfo = deriveComplaintOverdueStatus(c, overdueThreshold);

                  return (
                    <tr 
                      key={c.id} 
                      className={`transition-colors ${
                        overdueInfo.isOverdue 
                          ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500' 
                          : 'hover:bg-[#0B1121]/60'
                      }`}
                    >
                      
                      {/* Ticket # & Title */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {c.ticketNumber}
                          </span>

                          {/* OVERDUE BADGE */}
                          {overdueInfo.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-300 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>OVERDUE (+{overdueInfo.daysOverdue}d)</span>
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-white line-clamp-1">{c.title}</h4>
                        <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{c.description}</p>
                      </td>

                      {/* Resident & Unit */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.unitNumber}</span>
                          <span className="text-slate-400 text-[10px]">({c.tower})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{c.residentName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{c.residentContact}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <CategoryBadge category={c.category} />
                      </td>

                      {/* Priority Control: LOW, MEDIUM, HIGH */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="space-y-1.5">
                          <select
                            value={c.priority === 'URGENT' ? 'HIGH' : c.priority}
                            onChange={(e) => handlePriorityChange(c.id, e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                            className="bg-[#0B1121] border border-[#374151] text-xs font-bold rounded-lg px-2.5 py-1 text-slate-200 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                          </select>
                          <div>
                            <PriorityBadge priority={c.priority} />
                          </div>
                        </div>
                      </td>

                      {/* Status Workflow & SLA Duration */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={c.status} />
                          </div>

                          {/* SLA & Days Elapsed Display */}
                          <div className="pt-0.5">
                            {overdueInfo.isOverdue ? (
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">
                                <Clock className="w-3 h-3 text-red-600" />
                                <span>{overdueInfo.daysOpen} days open (SLA: {overdueThreshold}d)</span>
                              </div>
                            ) : isResolved ? (
                              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Resolved (Never overdue)</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-[#1F2937] px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{overdueInfo.daysOpen} day{overdueInfo.daysOpen === 1 ? '' : 's'} open • SLA {overdueThreshold}d</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Workflow Transitions */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {isOpen && (
                              <button
                                onClick={() => setStatusDialogTarget({ complaint: c, targetStatus: 'IN_PROGRESS' })}
                                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <span>Start Work</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {isInProgress && (
                              <button
                                onClick={() => setStatusDialogTarget({ complaint: c, targetStatus: 'RESOLVED' })}
                                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Resolve (Close)</span>
                              </button>
                            )}

                            {isResolved && (
                              <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ticket Closed</span>
                              </div>
                            )}

                            {/* Option to change to any state with dialog */}
                            <select
                              value={c.status === 'CLOSED' ? 'RESOLVED' : (c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' || c.status === 'ASSIGNED' ? 'OPEN' : c.status)}
                              onChange={(e) => {
                                const target = e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
                                if (target !== c.status) {
                                  setStatusDialogTarget({ complaint: c, targetStatus: target });
                                }
                              }}
                              className="bg-transparent border border-[#374151] text-[10px] font-bold text-slate-400 rounded px-1.5 py-1 hover:bg-[#1F2937] cursor-pointer"
                            >
                              <option value="OPEN">Set: OPEN</option>
                              <option value="IN_PROGRESS">Set: IN_PROGRESS</option>
                              <option value="RESOLVED">Set: RESOLVED</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Audit History & View */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => setHistoryModalComplaint(c)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History ({c.statusHistory?.length || 0})</span>
                          </button>

                          {onSelectComplaint && (
                            <button
                              onClick={() => onSelectComplaint(c)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-200 flex items-center gap-0.5"
                            >
                              <span>Full Details</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Configurable Overdue SLA Threshold Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-teal-600/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configure Overdue SLA Threshold</h3>
                  <p className="text-[11px] text-slate-500">Automated society SLA compliance rules</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>How Overdue Detection Works:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1 text-[11px] leading-relaxed">
                  <li>Any <strong>unresolved complaint</strong> (OPEN or IN_PROGRESS) older than the configured threshold is considered overdue.</li>
                  <li><strong>Resolved complaints are NEVER overdue</strong> regardless of creation date.</li>
                  <li>Overdue complaints automatically float to the <strong>top of the admin queue</strong>.</li>
                  <li>Status is dynamically derived from dates without permanent destructive mutations.</li>
                </ul>
              </div>

              {/* Threshold Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Quick Presets (Days):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5, 7, 10, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTempThreshold(days)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        tempThreshold === days
                          ? 'bg-teal-600 text-white border-teal-600 shadow-none ring-2 ring-teal-300'
                          : 'bg-[#0B1121] text-slate-300 border-[#1F2937] hover:bg-[#1F2937]'
                      }`}
                    >
                      {days} {days === 1 ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Numeric Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Custom Threshold (1 - 365 Days):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-[#374151] text-sm font-bold text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                    Days
                  </span>
                </div>
              </div>

              {/* Live Preview Impact */}
              <div className="bg-[#0B1121] p-3 rounded-xl border border-[#1F2937] text-xs text-slate-400 flex items-center justify-between">
                <span>Current Overdue under {tempThreshold}d:</span>
                <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  {complaints.filter(c => deriveComplaintOverdueStatus(c, tempThreshold).isOverdue).length} Tickets Overdue
                </span>
              </div>

              {/* Email Notifications Service (Resend) Status */}
              <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Email Notifications (Resend):</span>
                  {emailServiceConfig?.resendConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Configured & Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-[#374151] border border-[#374151] px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      Not Configured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {emailServiceConfig?.resendConfigured 
                    ? `Emails are dispatched from ${emailServiceConfig.senderEmail} upon complaint status changes and important notice creation.`
                    : 'RESEND_API_KEY is not configured in environment variables. Email notifications will be safely skipped without throwing errors.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-[#1F2937] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveThreshold(tempThreshold)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-none transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save SLA Threshold</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: Status Change Dialog with Optional Note */}
      {statusDialogTarget && (
        <div className="fixed inset-0 z-50 bg-teal-600/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Update Complaint Status</h3>
                  <p className="text-[11px] text-slate-500">Ticket: {statusDialogTarget.complaint.ticketNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setStatusDialogTarget(null)}
                className="text-slate-400 hover:text-slate-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="space-y-4">
              
              {/* Transition summary */}
              <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] space-y-2">
                <div className="text-xs font-semibold text-slate-300">Workflow Transition:</div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#374151] text-slate-300 text-xs font-bold">
                    {statusDialogTarget.complaint.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    statusDialogTarget.targetStatus === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                    statusDialogTarget.targetStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                    'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {statusDialogTarget.targetStatus}
                    {statusDialogTarget.targetStatus === 'RESOLVED' && ' (Closed)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {statusDialogTarget.targetStatus === 'RESOLVED' 
                    ? 'Note: Resolving this complaint will mark it as closed, timestamp the resolution, and ensure it is never marked as overdue.'
                    : 'This action will generate a new immutable ComplaintStatusHistory entry.'}
                </p>
              </div>

              {/* Optional Admin Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Status Change Note / Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g., Assigned technician Marcus Vance; inspection scheduled for 2 PM..."
                  className="w-full p-3 rounded-xl border border-[#374151] text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setStatusDialogTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-[#1F2937] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-none transition-colors"
                >
                  Save Status & Create History
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Complete ComplaintStatusHistory Viewer */}
      {historyModalComplaint && (
        <div className="fixed inset-0 z-50 bg-teal-600/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Complaint Status History Audit</h3>
                  <p className="text-[11px] text-slate-500">
                    {historyModalComplaint.ticketNumber} • {historyModalComplaint.unitNumber} ({historyModalComplaint.residentName})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryModalComplaint(null)}
                className="text-slate-400 hover:text-slate-400 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Timeline Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {(!historyModalComplaint.statusHistory || historyModalComplaint.statusHistory.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No status transition history recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#374151]">
                  {historyModalComplaint.statusHistory.map((hist, idx) => (
                    <div key={hist.id || idx} className="relative">
                      
                      {/* Timeline indicator node */}
                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-none flex items-center justify-center ${
                        hist.newStatus === 'RESOLVED' || hist.newStatus === 'CLOSED' ? 'bg-emerald-500' :
                        hist.newStatus === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-teal-500'
                      }`}></div>

                      {/* History Card */}
                      <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {hist.previousStatus && (
                              <>
                                <span className="text-[11px] font-bold text-slate-500">{hist.previousStatus}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              </>
                            )}
                            <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md ${
                              hist.newStatus === 'RESOLVED' || hist.newStatus === 'CLOSED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                              hist.newStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {hist.newStatus}
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(hist.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Actor details */}
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>Changed by: <strong>{hist.actor?.name || 'System'}</strong></span>
                          <span className="text-slate-400 text-[10px]">({hist.actor?.role || 'SYSTEM'})</span>
                        </div>

                        {/* Note */}
                        {hist.note && (
                          <div className="text-xs text-slate-300 bg-[#111827] p-2.5 rounded-lg border border-[#1F2937] mt-1 italic">
                            "{hist.note}"
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1F2937] flex justify-end">
              <button
                onClick={() => setHistoryModalComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F2937] hover:bg-[#374151] text-slate-300 transition-colors"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
