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
  Info,
  MessageSquare,
  MessageSquarePlus,
  Mail,
  ListFilter,
  ChevronDown,
  Wrench
} from 'lucide-react';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintPriority, 
  ComplaintStatus, 
  ComplaintStatusHistory, 
  CurrentUser,
  SocietyUnit,
  StaffMember
} from '../types';
import { STAFF_MEMBERS } from '../data/mockData';
import { CategoryBadge, PriorityBadge, StatusBadge } from './CategoryBadge';
import { 
  getAdminComplaints, 
  updateComplaintStatusByAdmin, 
  setComplaintPriorityByAdmin,
  assignTechnicianToComplaint,
  assignTechnicianToComplaintOnServer,
  fetchStaffMembersFromServer,
  getAdminSettings,
  updateAdminOverdueThreshold,
  deriveComplaintOverdueStatus,
  DEFAULT_ADMIN_SETTINGS,
  fetchAdminComplaintsFromServer,
  fetchAdminSettingsFromServer,
  updateAdminOverdueThresholdOnServer,
  updateComplaintStatusOnServer,
  updateComplaintPriorityOnServer,
  addAdminComplaintCommentOnServer
} from '../services/adminComplaintService';
import { 
  sendComplaintStatusEmailNotification, 
  checkEmailServiceStatus 
} from '../services/emailService';

interface AdminComplaintManagementProps {
  currentUser: CurrentUser;
  complaints: Complaint[];
  units?: SocietyUnit[];
  staffList?: StaffMember[];
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
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
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
        if (res.success && res.data) {
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

  // Staff Members State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(STAFF_MEMBERS);
  const [statusDialogTechId, setStatusDialogTechId] = useState<string>('');

  useEffect(() => {
    fetchStaffMembersFromServer().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setStaffMembers(res.data);
      }
    }).catch(() => {});
  }, []);

  // Status Change Dialog State
  const [statusDialogTarget, setStatusDialogTarget] = useState<{
    complaint: Complaint;
    targetStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  } | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');

  const openStatusDialog = (complaint: Complaint, targetStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    setStatusDialogTarget({ complaint, targetStatus });
    setStatusNote('');
    const techId = complaint.assignedStaffId || (complaint.assignedStaffName ? (staffMembers.find(s => s.name.toLowerCase() === complaint.assignedStaffName?.toLowerCase())?.id || '') : '');
    setStatusDialogTechId(techId);
  };

  // Comment Modal State
  const [commentModalTarget, setCommentModalTarget] = useState<Complaint | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

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
        priority: selectedPriority,
        date: selectedDate,
        searchQuery: searchQuery
      },
      overdueThreshold
    );
  }, [currentUser, complaints, selectedCategory, selectedStatus, selectedPriority, selectedDate, searchQuery, overdueThreshold, isAuthorized]);

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
    const currentComplaint = complaints.find(c => c.id === complaintId);
    if (!currentComplaint) return;

    const localRes = setComplaintPriorityByAdmin(currentUser, complaintId, newPriority, complaints);
    if (localRes.success && localRes.data) {
      const updatedList = complaints.map(c => c.id === complaintId ? localRes.data! : c);
      onUpdateComplaints(updatedList);
      onShowToast(`Priority updated to ${newPriority} for ticket ${localRes.data.ticketNumber}`);
    } else {
      onShowToast(localRes.error || 'Failed to update priority');
      return;
    }

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

  // Handler: Direct technician assignment
  const handleDirectAssignTechnician = async (complaintId: string, staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId) || null;
    const staffName = staff ? staff.name : (staffId ? 'Technician' : undefined);
    const staffContact = staff ? staff.phone : undefined;

    // 1. Optimistic local update
    const localRes = assignTechnicianToComplaint(currentUser, complaintId, staff, undefined, complaints);
    if (localRes.success && localRes.data) {
      const updatedList = complaints.map(c => c.id === complaintId ? localRes.data! : c);
      onUpdateComplaints(updatedList);
      onShowToast(staff ? `Technician ${staff.name} assigned to ticket.` : 'Technician unassigned from ticket.');
    } else {
      onShowToast(localRes.error || 'Failed to assign technician');
      return;
    }

    // 2. Dispatch to server API
    try {
      const serverRes = await assignTechnicianToComplaintOnServer(
        complaintId,
        staff ? staff.id : null,
        staffName,
        staffContact
      );
      if (serverRes.success && serverRes.complaint) {
        const updatedList = complaints.map(c => c.id === complaintId ? serverRes.complaint! : c);
        onUpdateComplaints(updatedList);
      }
    } catch (err) {
      console.warn('[Assign Technician API error]', err);
    }
  };

  // Handler: Confirm status change with history creation
  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusDialogTarget) return;

    const { complaint, targetStatus } = statusDialogTarget;
    const selectedStaff = staffMembers.find(s => s.id === statusDialogTechId) || null;
    const finalStaffId = selectedStaff ? selectedStaff.id : (statusDialogTechId ? statusDialogTechId : null);
    const finalStaffName = selectedStaff ? selectedStaff.name : (statusDialogTechId ? 'Technician' : null);
    const finalStaffContact = selectedStaff ? selectedStaff.phone : null;

    // Try server API first if available
    let serverUpdated = false;
    try {
      const serverRes = await updateComplaintStatusOnServer(
        complaint.id, 
        targetStatus, 
        statusNote,
        finalStaffId,
        finalStaffName,
        finalStaffContact
      );
      if (serverRes.success && serverRes.complaint) {
        serverUpdated = true;
        const updatedList = complaints.map(c => c.id === complaint.id ? serverRes.complaint! : c);
        onUpdateComplaints(updatedList);
      } else if (serverRes.error) {
        onShowToast(serverRes.error);
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
        complaints,
        selectedStaff
      );

      if (res.success && res.data) {
        const updatedList = complaints.map(c => c.id === complaint.id ? res.data! : c);
        onUpdateComplaints(updatedList);
      } else {
        onShowToast(res.error || 'Failed to update status');
        return;
      }
    }
    
    onShowToast(`Status updated to ${targetStatus}. Audit history created.`);

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
    setStatusDialogTechId('');
  };

  // Handler: Add update/comment to complaint
  const handleConfirmAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentModalTarget || !commentText.trim()) return;

    const complaint = commentModalTarget;
    const note = commentText.trim();
    setIsSubmittingComment(true);

    try {
      const serverRes = await addAdminComplaintCommentOnServer(complaint.id, note);
      if (serverRes.success && serverRes.complaint) {
        const updatedList = complaints.map(c => c.id === complaint.id ? serverRes.complaint! : c);
        onUpdateComplaints(updatedList);
        onShowToast(`Comment added to ticket ${complaint.ticketNumber}`);
      } else {
        // Local fallback
        const nowIso = new Date().toISOString();
        const historyEntry: ComplaintStatusHistory = {
          id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          complaintId: complaint.id,
          previousStatus: complaint.status,
          newStatus: complaint.status,
          actor: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role
          },
          timestamp: nowIso,
          note
        };

        const updated: Complaint = {
          ...complaint,
          updatedAt: nowIso,
          statusHistory: [...(complaint.statusHistory || []), historyEntry],
          comments: [
            ...(complaint.comments || []),
            {
              id: `c_${Date.now()}`,
              author: currentUser.name,
              role: currentUser.role,
              text: note,
              timestamp: nowIso
            }
          ]
        };

        const updatedList = complaints.map(c => c.id === complaint.id ? updated : c);
        onUpdateComplaints(updatedList);
        onShowToast(`Comment added to ticket ${complaint.ticketNumber}`);
      }
    } catch {
      onShowToast('Error adding comment to complaint');
    } finally {
      setIsSubmittingComment(false);
      setCommentModalTarget(null);
      setCommentText('');
    }
  };

  // Handler: Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedDate('');
    setSearchQuery('');
  };

  // Render unauthorized banner if resident tries to access
  if (!isAuthorized) {
    return (
      <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied: Admin Privileges Required</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The Admin Complaint Management console is restricted to Society Administrators.
          Your current session role is <strong className="text-teal-400">{currentUser.role}</strong> ({currentUser.name}).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Society Complaints
            </span>
            <span className="text-xs text-slate-500">· Admin Control</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">Complaint Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            Inspect society-wide tickets, advance status workflows, and manage overdue SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* SLA Threshold Settings Button */}
          <button
            onClick={() => {
              setTempThreshold(overdueThreshold);
              setIsSettingsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#111827] hover:bg-[#1F2937] text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-[#1F2937] hover:border-teal-500/30 text-xs font-bold transition-all shadow-sm group cursor-pointer"
            title="Configure Overdue Threshold SLA"
          >
            <Clock className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>SLA: <strong className="text-amber-300">{overdueThreshold} Days</strong></span>
            <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 ml-1" />
          </button>
        </div>
      </div>

      {/* KPI CARDS - Compact & Flat matching Resident Portal */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div 
          onClick={() => setSelectedStatus('ALL')}
          className={`bg-[#111827] border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all cursor-pointer ${
            selectedStatus === 'ALL' ? 'border-teal-500/50 ring-1 ring-teal-500/50' : 'border-[#1F2937] hover:border-teal-500/30'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <ListFilter className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{totalCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">All society tickets</p>
          </div>
        </div>

        {/* Open */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'OPEN' ? 'ALL' : 'OPEN')}
          className={`bg-[#111827] border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all cursor-pointer ${
            selectedStatus === 'OPEN' ? 'border-blue-500/50 ring-1 ring-blue-500/50' : 'border-[#1F2937] hover:border-blue-500/30'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Open Action</p>
            <AlertTriangle className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{openCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Awaiting review</p>
          </div>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`bg-[#111827] border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all cursor-pointer ${
            selectedStatus === 'IN_PROGRESS' ? 'border-orange-500/50 ring-1 ring-orange-500/50' : 'border-[#1F2937] hover:border-orange-500/30'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">In Progress</p>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{inProgressCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Technician working</p>
          </div>
        </div>

        {/* Resolved */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          className={`bg-[#111827] border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all cursor-pointer ${
            selectedStatus === 'RESOLVED' ? 'border-green-500/50 ring-1 ring-green-500/50' : 'border-[#1F2937] hover:border-green-500/30'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Resolved</p>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{resolvedCount}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Completed issues</p>
          </div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`col-span-2 md:col-span-1 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all cursor-pointer ${
            selectedStatus === 'OVERDUE'
              ? 'bg-[#111827] border border-rose-500 ring-1 ring-rose-500'
              : overdueCount > 0
              ? 'bg-[#111827] border border-rose-500/40 hover:border-rose-500'
              : 'bg-[#111827] border border-[#1F2937] hover:border-teal-500/30'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Overdue SLA</p>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-rose-400">{overdueCount}</h3>
              {overdueCount > 0 && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded animate-pulse">
                  Alert
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">&gt;{overdueThreshold}d breached</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Category, Status, Urgency, Date, Search) */}
      <div className="bg-[#111827] p-3 rounded-2xl border border-[#1F2937] shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, flat, title, resident name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B1121] border border-[#1F2937] text-white text-sm font-medium py-2.5 pl-9 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Group */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-[#0B1121] border border-[#1F2937] text-slate-300 text-xs font-medium py-2.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
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
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 2. Status & Overdue Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`appearance-none border text-xs font-medium py-2.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer ${
                  selectedStatus === 'OVERDUE'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                    : 'bg-[#0B1121] border-[#1F2937] text-slate-300'
                }`}
              >
                <option value="ALL">All Statuses (Overdue first)</option>
                <option value="OVERDUE">🚨 Overdue Only (&gt;{overdueThreshold}d SLA)</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. Urgency / Priority Filter */}
            <div className="relative">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="appearance-none bg-[#0B1121] border border-[#1F2937] text-slate-300 text-xs font-medium py-2.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
              >
                <option value="ALL">All Urgencies</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 4. Date Filter */}
            <div className="flex items-center gap-1 bg-[#0B1121] border border-[#1F2937] rounded-xl px-2.5 py-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-300 border-0 focus:outline-none cursor-pointer"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-slate-400 hover:text-white"
                  title="Clear date"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Reset Filters button */}
            {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || selectedDate !== '' || searchQuery !== '') && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-teal-400 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

          </div>
        </div>

        {/* Results Bar with SLA summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1F2937] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-bold">{displayedComplaints.length}</strong> ticket{displayedComplaints.length === 1 ? '' : 's'}
            </span>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                {overdueCount} Overdue ({overdueThreshold}d SLA)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Overdue tickets prioritized first</span>
          </div>
        </div>
      </div>

      {/* Complaints Table / List */}
      {displayedComplaints.length === 0 ? (
        <div className="bg-[#111827] rounded-2xl p-12 text-center border border-[#1F2937] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1121] text-slate-400 flex items-center justify-center mx-auto mb-3 border border-[#1F2937]">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {selectedStatus === 'OVERDUE' ? 'No overdue complaints detected' : 'No complaints match current admin filters'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {selectedStatus === 'OVERDUE' 
              ? `Great job! All unresolved tickets are currently within the ${overdueThreshold}-day SLA threshold.`
              : 'Try adjusting your category, status, urgency, or date filters to see matching society maintenance tickets.'}
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B1121]/90 border-b border-[#1F2937] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Ticket & Title</th>
                  <th className="py-3 px-4">Resident & Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Technician</th>
                  <th className="py-3 px-4">Status & Workflow</th>
                  <th className="py-3 px-4 text-right">Audit & History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937] text-xs">
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
                          ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-4 border-l-rose-500' 
                          : 'hover:bg-[#1F2937]/40'
                      }`}
                    >
                      
                      {/* Ticket # & Title */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                            #{c.ticketNumber || c.id}
                          </span>

                          {/* OVERDUE BADGE */}
                          {overdueInfo.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>OVERDUE (+{overdueInfo.daysOverdue}d)</span>
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-white truncate capitalize">{c.title}</h4>
                        <p className="text-slate-400 text-xs truncate mt-0.5">{c.description}</p>
                      </td>

                      {/* Resident & Unit */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.unitNumber}</span>
                          <span className="text-slate-400 text-[10px]">({c.tower})</span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium mt-0.5">{c.residentName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="w-3 h-3 text-teal-400" />
                          <span>{c.residentContact?.includes('@') ? c.residentContact : (c.residentContact || 'sarah.c@oakwood.com')}</span>
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
                            className="bg-[#0B1121] border border-[#1F2937] text-xs font-bold rounded-lg px-2.5 py-1 text-slate-200 focus:ring-1 focus:ring-teal-500 cursor-pointer"
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

                      {/* Assigned Technician Control */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                              <Wrench className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold text-white">
                              {c.assignedStaffName || 'Unassigned'}
                            </span>
                          </div>
                          
                          <select
                            value={c.assignedStaffId || (c.assignedStaffName ? (staffMembers.find(s => s.name.toLowerCase() === c.assignedStaffName?.toLowerCase())?.id || '') : '')}
                            onChange={(e) => handleDirectAssignTechnician(c.id, e.target.value)}
                            className="bg-[#0B1121] border border-[#1F2937] text-[11px] font-semibold rounded-lg px-2 py-1 text-slate-200 focus:ring-1 focus:ring-teal-500 cursor-pointer block max-w-[170px] truncate"
                          >
                            <option value="">-- Assign Staff --</option>
                            {staffMembers.map(staff => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name} ({staff.role.split(' ')[0]})
                              </option>
                            ))}
                          </select>
                          
                          {c.staffContact && (
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-teal-400" />
                              <span>{c.staffContact}</span>
                            </div>
                          )}
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
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                <Clock className="w-3 h-3 text-rose-400" />
                                <span>{overdueInfo.daysOpen}d open (SLA: {overdueThreshold}d)</span>
                              </div>
                            ) : isResolved ? (
                              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                <span>{c.status === 'CLOSED' ? 'Closed' : 'Resolved'}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-[#0B1121] px-1.5 py-0.5 rounded border border-[#1F2937]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{overdueInfo.daysOpen}d open</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Workflow Transitions */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {isOpen && (
                              <button
                                onClick={() => openStatusDialog(c, 'IN_PROGRESS')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>Start Work</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {isInProgress && (
                              <button
                                onClick={() => openStatusDialog(c, 'RESOLVED')}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Resolve</span>
                              </button>
                            )}

                            {c.status === 'RESOLVED' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-teal-400" />
                                <span>Awaiting Resident Closure</span>
                              </span>
                            )}

                            {/* Option to change to OPEN / IN_PROGRESS / RESOLVED with dialog */}
                            {c.status !== 'CLOSED' && (
                              <select
                                value={c.status}
                                onChange={(e) => {
                                  const target = e.target.value as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
                                  if (target !== c.status) {
                                    openStatusDialog(c, target);
                                  }
                                }}
                                className="bg-[#0B1121] border border-[#1F2937] text-[10px] font-bold text-slate-400 rounded-lg px-2 py-1 hover:bg-[#1F2937] cursor-pointer"
                              >
                                <option value="OPEN">Set: OPEN</option>
                                <option value="IN_PROGRESS">Set: IN_PROGRESS</option>
                                <option value="RESOLVED">Set: RESOLVED</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Audit History & Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => setHistoryModalComplaint(c)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-500/20 transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History ({c.statusHistory?.length || 0})</span>
                          </button>

                          <button
                            onClick={() => {
                              setCommentModalTarget(c);
                              setCommentText('');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-[#1F2937] hover:bg-[#374151] px-2.5 py-1 rounded-lg border border-[#374151] transition-colors cursor-pointer"
                          >
                            <MessageSquarePlus className="w-3 h-3 text-teal-400" />
                            <span>Add Update</span>
                          </button>

                          {onSelectComplaint && (
                            <button
                              onClick={() => onSelectComplaint(c)}
                              className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937] text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configure Overdue SLA Threshold</h3>
                  <p className="text-[11px] text-slate-400">Automated society SLA compliance rules</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation */}
            <div className="space-y-4">
              <div className="bg-[#0B1121] border border-[#1F2937] rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>How Overdue Detection Works:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px] leading-relaxed">
                  <li>Any <strong>unresolved complaint</strong> (OPEN or IN_PROGRESS) older than the threshold is considered overdue.</li>
                  <li><strong>Resolved complaints are NEVER overdue</strong> regardless of creation date.</li>
                  <li>Overdue complaints automatically float to the <strong>top of the admin queue</strong>.</li>
                  <li>Status is dynamically derived without destructive mutations.</li>
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
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        tempThreshold === days
                          ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
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
                    className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-[#1F2937] text-sm font-bold text-white bg-[#0B1121] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Days
                  </span>
                </div>
              </div>

              {/* Live Preview Impact */}
              <div className="bg-[#0B1121] p-3 rounded-xl border border-[#1F2937] text-xs text-slate-400 flex items-center justify-between">
                <span>Current Overdue under {tempThreshold}d:</span>
                <span className="font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                  {complaints.filter(c => deriveComplaintOverdueStatus(c, tempThreshold).isOverdue).length} Tickets Overdue
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-[#1F2937] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveThreshold(tempThreshold)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937] text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Update Complaint Status</h3>
                  <p className="text-[11px] text-slate-400">Ticket: #{statusDialogTarget.complaint.ticketNumber || statusDialogTarget.complaint.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setStatusDialogTarget(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStatusChange} className="space-y-4">
              
              {/* Transition summary */}
              <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] space-y-2">
                <div className="text-xs font-semibold text-slate-300">Workflow Transition:</div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#1F2937] text-slate-300 text-xs font-bold border border-[#374151]">
                    {statusDialogTarget.complaint.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                    statusDialogTarget.targetStatus === 'RESOLVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    statusDialogTarget.targetStatus === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {statusDialogTarget.targetStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {statusDialogTarget.targetStatus === 'RESOLVED'
                    ? 'Note: Marking as RESOLVED will notify the resident to review and confirm final ticket closure.'
                    : 'This action will append a new immutable ComplaintStatusHistory audit record.'}
                </p>
              </div>

              {/* Assigned Technician Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-teal-400" />
                  <span>Assigned Technician</span>
                  <span className="text-slate-400 font-normal">(Facility Staff)</span>
                </label>
                <select
                  value={statusDialogTechId}
                  onChange={(e) => setStatusDialogTechId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#1F2937] text-xs focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden text-white bg-[#0B1121] cursor-pointer"
                >
                  <option value="">-- No Technician / Unchanged --</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} — {staff.role} ({staff.phone})
                    </option>
                  ))}
                </select>
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
                  placeholder="e.g., Scheduled work with technician; issue inspected..."
                  className="w-full p-3 rounded-xl border border-[#1F2937] text-xs focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden text-white bg-[#0B1121]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setStatusDialogTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-[#1F2937] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors cursor-pointer"
                >
                  Save Status & Create History
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Comment / Update Note to Complaint */}
      {commentModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937] text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Update / Comment</h3>
                  <p className="text-[11px] text-slate-400">Ticket: #{commentModalTarget.ticketNumber || commentModalTarget.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setCommentModalTarget(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddComment} className="space-y-4">
              
              <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] space-y-1">
                <div className="text-xs font-bold text-white">{commentModalTarget.title}</div>
                <div className="text-[11px] text-slate-400">Resident: {commentModalTarget.residentName} • Unit: {commentModalTarget.unitNumber}</div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Update Note / Comment Message:
                </label>
                <textarea
                  rows={4}
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type an official administrative update, progress note, or communication to record in ticket history..."
                  className="w-full p-3 rounded-xl border border-[#1F2937] text-xs focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden text-white bg-[#0B1121]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setCommentModalTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-[#1F2937] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmittingComment ? 'Saving...' : 'Post Update & Save History'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Complete ComplaintStatusHistory Viewer */}
      {historyModalComplaint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#1F2937] text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Complaint Status History Audit</h3>
                  <p className="text-[11px] text-slate-400">
                    #{historyModalComplaint.ticketNumber || historyModalComplaint.id} • Unit {historyModalComplaint.unitNumber} ({historyModalComplaint.residentName})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryModalComplaint(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Timeline Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {(!historyModalComplaint.statusHistory || historyModalComplaint.statusHistory.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No status transition history recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1F2937]">
                  {historyModalComplaint.statusHistory.map((hist, idx) => (
                    <div key={hist.id || idx} className="relative">
                      
                      {/* Timeline indicator node */}
                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-[#111827] shadow-none flex items-center justify-center ${
                        hist.newStatus === 'RESOLVED' || hist.newStatus === 'CLOSED' ? 'bg-green-500' :
                        hist.newStatus === 'IN_PROGRESS' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>

                      {/* History Card */}
                      <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {hist.previousStatus && (
                              <>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{hist.previousStatus}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                              </>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              hist.newStatus === 'RESOLVED' || hist.newStatus === 'CLOSED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              hist.newStatus === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {hist.newStatus}
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-slate-500 font-medium">
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
                          <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                          <span>Changed by: <strong className="text-white">{hist.actor?.name || 'System'}</strong></span>
                          <span className="text-slate-500 text-[10px]">({hist.actor?.role || 'SYSTEM'})</span>
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F2937] hover:bg-[#374151] text-slate-300 transition-colors cursor-pointer"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
