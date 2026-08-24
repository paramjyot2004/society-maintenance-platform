import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  Wrench, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  User, 
  Filter, 
  Settings, 
  ChevronRight, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  Inbox,
  Flame,
  Zap,
  Shield,
  Sparkles,
  RefreshCw,
  CheckCheck,
  Activity,
  ShieldCheck,
  ListFilter,
  Timer
} from 'lucide-react';
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus, 
  CurrentUser, 
  SocietyUnit,
  AdminDashboardStats
} from '../types';
import { CategoryBadge, PriorityBadge, StatusBadge } from './CategoryBadge';
import { 
  deriveComplaintOverdueStatus, 
  getAdminSettings, 
  DEFAULT_ADMIN_SETTINGS,
  fetchAdminDashboardStatsFromServer
} from '../services/adminComplaintService';

interface AdminDashboardProps {
  currentUser: CurrentUser;
  complaints: Complaint[];
  units?: SocietyUnit[];
  onSelectComplaint?: (complaint: Complaint) => void;
  onNavigateToComplaints?: (filter?: { status?: string; category?: string; overdueOnly?: boolean }) => void;
  onShowToast?: (message: string) => void;
}

// Category metadata with icons & aesthetic color tokens
const CATEGORY_CONFIG: Record<ComplaintCategory, { label: string; icon: string; bg: string; text: string; bar: string }> = {
  PLUMBING: { label: 'Plumbing', icon: '🚰', bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-600' },
  ELECTRICAL: { label: 'Electrical', icon: '⚡', bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  ELEVATOR: { label: 'Elevator', icon: '🛗', bg: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-600' },
  SECURITY: { label: 'Security', icon: '🛡️', bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-600' },
  CARPENTRY: { label: 'Carpentry', icon: '🪚', bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-600' },
  SANITATION: { label: 'Sanitation', icon: '🧹', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-600' },
  LANDSCAPING: { label: 'Landscaping', icon: '🌿', bg: 'bg-teal-50', text: 'text-teal-700', bar: 'bg-teal-600' },
  CIVIL_WORK: { label: 'Civil Work', icon: '🧱', bg: 'bg-[#1F2937]', text: 'text-slate-300', bar: 'bg-slate-600' },
  OTHER: { label: 'General / Other', icon: '📦', bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' }
};

const ALL_CATEGORIES: ComplaintCategory[] = [
  'PLUMBING',
  'ELECTRICAL',
  'ELEVATOR',
  'SECURITY',
  'CARPENTRY',
  'SANITATION',
  'LANDSCAPING',
  'CIVIL_WORK',
  'OTHER'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  complaints,
  units = [],
  onSelectComplaint,
  onNavigateToComplaints,
  onShowToast
}) => {
  const isAuthorized = currentUser.role === 'ADMIN';

  // Server-side loaded statistics state
  const [serverStats, setServerStats] = useState<AdminDashboardStats | null>(null);
  const [isLoadingServerStats, setIsLoadingServerStats] = useState<boolean>(false);
  const [lastServerFetchTime, setLastServerFetchTime] = useState<string | null>(null);

  // Read current admin SLA threshold
  const [thresholdDays, setThresholdDays] = useState<number>(() => {
    const settings = getAdminSettings(currentUser);
    return settings.data?.overdueThresholdDays || DEFAULT_ADMIN_SETTINGS.overdueThresholdDays;
  });

  // Fetch authoritative dashboard statistics from server API
  const loadServerDashboardStats = useCallback(async (showNotification: boolean = false) => {
    if (!isAuthorized) return;
    setIsLoadingServerStats(true);
    try {
      const res = await fetchAdminDashboardStatsFromServer();
      if (res.success && res.stats) {
        setServerStats(res.stats);
        if (res.stats.overdue?.overdueThresholdDays) {
          setThresholdDays(res.stats.overdue.overdueThresholdDays);
        }
        setLastServerFetchTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (showNotification && onShowToast) {
          onShowToast('Admin Dashboard statistics updated from server.');
        }
      } else if (res.error) {
        console.warn('Could not fetch server-side dashboard stats, using client state:', res.error);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setIsLoadingServerStats(false);
    }
  }, [isAuthorized, onShowToast]);

  // Load server stats on component mount
  useEffect(() => {
    loadServerDashboardStats(false);
  }, [loadServerDashboardStats, complaints.length]);

  // Real-time calculation of statistics synchronized from dynamic complaints list & server data
  const metrics = useMemo(() => {
    const total = complaints.length;
    const now = Date.now();

    // 1. Status Breakdown
    const openList = complaints.filter(
      c => c.status === 'OPEN' || c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' || c.status === 'ASSIGNED'
    );
    const inProgressList = complaints.filter(c => c.status === 'IN_PROGRESS');
    const resolvedList = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');

    const openCount = openList.length;
    const inProgressCount = inProgressList.length;
    const resolvedCount = resolvedList.length;

    // 2. Overdue Complaints calculation
    const overdueList = complaints.filter(c => {
      const overdueInfo = deriveComplaintOverdueStatus(c, thresholdDays, now);
      return overdueInfo.isOverdue;
    });
    const overdueCount = overdueList.length;

    // 3. Category Breakdown
    const categoryCounts: Record<ComplaintCategory, { total: number; open: number; inProgress: number; resolved: number }> = {
      PLUMBING: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      ELECTRICAL: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      ELEVATOR: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      SECURITY: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      CARPENTRY: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      SANITATION: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      LANDSCAPING: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      CIVIL_WORK: { total: 0, open: 0, inProgress: 0, resolved: 0 },
      OTHER: { total: 0, open: 0, inProgress: 0, resolved: 0 }
    };

    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;
    let compliantWithSlaCount = 0;

    complaints.forEach(c => {
      const cat = (c.category in categoryCounts) ? c.category : 'OTHER';
      categoryCounts[cat].total += 1;
      const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
      const isInProgress = c.status === 'IN_PROGRESS';

      if (isResolved) {
        categoryCounts[cat].resolved += 1;
      } else if (isInProgress) {
        categoryCounts[cat].inProgress += 1;
      } else {
        categoryCounts[cat].open += 1;
      }

      // SLA & Resolution time
      const createdMs = new Date(c.createdAt).getTime();
      const overdueInfo = deriveComplaintOverdueStatus(c, thresholdDays, now);

      if (isResolved) {
        const resolvedMs = c.resolvedAt ? new Date(c.resolvedAt).getTime() : (c.updatedAt ? new Date(c.updatedAt).getTime() : createdMs);
        const durationHours = Math.max(0, (resolvedMs - createdMs) / 3600000);
        totalResolutionHours += durationHours;
        resolvedWithDurationCount += 1;

        if (durationHours / 24 <= thresholdDays) {
          compliantWithSlaCount += 1;
        }
      } else {
        if (!overdueInfo.isOverdue) {
          compliantWithSlaCount += 1;
        }
      }
    });

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

    // Urgent active complaints
    const urgentActiveCount = complaints.filter(
      c => (c.priority === 'URGENT' || c.priority === 'HIGH') && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
    ).length;

    // Average resolution time
    const avgResolutionHours = resolvedWithDurationCount > 0 
      ? Math.round((totalResolutionHours / resolvedWithDurationCount) * 10) / 10 
      : (serverStats?.summary?.avgResolutionHours || 0);

    const avgResolutionDays = avgResolutionHours > 0 
      ? Math.round((avgResolutionHours / 24) * 10) / 10 
      : (serverStats?.summary?.avgResolutionDays || 0);

    // SLA Compliance rate
    const slaComplianceRate = total > 0 
      ? Math.round((compliantWithSlaCount / total) * 100) 
      : (serverStats?.summary?.slaComplianceRate || 100);

    // Priority counts
    const priorityCounts = {
      HIGH: complaints.filter(c => c.priority === 'HIGH' || c.priority === 'URGENT').length,
      MEDIUM: complaints.filter(c => c.priority === 'MEDIUM').length,
      LOW: complaints.filter(c => c.priority === 'LOW').length,
    };

    return {
      total,
      openCount,
      inProgressCount,
      resolvedCount,
      overdueCount,
      overdueList,
      categoryCounts,
      resolutionRate,
      urgentActiveCount,
      avgResolutionHours,
      avgResolutionDays,
      slaComplianceRate,
      priorityCounts
    };
  }, [complaints, thresholdDays, serverStats]);

  if (!isAuthorized) {
    return (
      <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-8 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Admin Dashboard Restricted</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The Admin Dashboard is only accessible to users with the Administrator role.
          Your current active role is <strong className="text-teal-400">{currentUser.role}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Welcome & Overview Banner */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg shadow-slate-900/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-teal-400 font-medium text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Good Evening, {currentUser.name.split(' ')[0]} (Administrator)
              </span>
              {lastServerFetchTime && (
                <span className="text-slate-400 text-xs">· Synced at {lastServerFetchTime}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Society Maintenance Hub
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time complaint triage, category breakdown, and SLA overdue monitoring for Oakwood Heights.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap relative z-10">
            {/* Refresh Server Stats Button */}
            <button
              id="btn-dashboard-refresh-stats"
              onClick={() => loadServerDashboardStats(true)}
              disabled={isLoadingServerStats}
              title="Fetch real-time aggregated metrics directly from database server"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isLoadingServerStats ? 'animate-spin' : ''}`} />
              <span>{isLoadingServerStats ? 'Syncing...' : 'Refresh Stats'}</span>
            </button>

            <button
              id="btn-dashboard-manage-complaints"
              onClick={() => onNavigateToComplaints && onNavigateToComplaints()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-900/20 cursor-pointer"
            >
              <span>Open Complaint Desk</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative ambient glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      {/* SECTION 1: Status KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Complaints by Status</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total Complaints: <strong className="text-white font-bold">{metrics.total}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: OPEN Status */}
          <div 
            id="dashboard-card-status-open"
            onClick={() => onNavigateToComplaints && onNavigateToComplaints({ status: 'OPEN' })}
            className="bg-[#111827] border border-[#1F2937] hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Open Action</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{metrics.openCount}</span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {metrics.total > 0 ? Math.round((metrics.openCount / metrics.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#1F2937] flex items-center justify-between text-xs text-slate-500">
              <span>Awaiting review</span>
              <span className="text-teal-400 font-bold group-hover:underline flex items-center gap-0.5">
                View open <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: IN PROGRESS Status */}
          <div 
            id="dashboard-card-status-inprogress"
            onClick={() => onNavigateToComplaints && onNavigateToComplaints({ status: 'IN_PROGRESS' })}
            className="bg-[#111827] border border-[#1F2937] hover:border-orange-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Working</span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{metrics.inProgressCount}</span>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {metrics.total > 0 ? Math.round((metrics.inProgressCount / metrics.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#1F2937] flex items-center justify-between text-xs text-slate-500">
              <span>Technician active</span>
              <span className="text-teal-400 font-bold group-hover:underline flex items-center gap-0.5">
                View active <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: RESOLVED Status */}
          <div 
            id="dashboard-card-status-resolved"
            onClick={() => onNavigateToComplaints && onNavigateToComplaints({ status: 'RESOLVED' })}
            className="bg-[#111827] border border-[#1F2937] hover:border-green-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Resolved</span>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{metrics.resolvedCount}</span>
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                {metrics.resolutionRate}% Rate
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#1F2937] flex items-center justify-between text-xs text-slate-500">
              <span>Closed tickets</span>
              <span className="text-teal-400 font-bold group-hover:underline flex items-center gap-0.5">
                View resolved <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 4: TOTAL OVERDUE COMPLAINTS */}
          <div 
            id="dashboard-card-status-overdue"
            onClick={() => onNavigateToComplaints && onNavigateToComplaints({ overdueOnly: true })}
            className={`rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all group cursor-pointer ${
              metrics.overdueCount > 0 
                ? 'bg-[#111827] border border-rose-500/40 hover:border-rose-500' 
                : 'bg-[#111827] border border-[#1F2937] hover:border-teal-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                metrics.overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                Total Overdue
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                metrics.overdueCount > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-[#1F2937] text-slate-500'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-3xl font-black ${metrics.overdueCount > 0 ? 'text-rose-400' : 'text-white'}`}>
                {metrics.overdueCount}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                metrics.overdueCount > 0 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
                {metrics.overdueCount > 0 ? `>${thresholdDays}d SLA Breached` : '0 Breaches'}
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#1F2937] flex items-center justify-between text-xs text-slate-500">
              <span>SLA: {thresholdDays} days</span>
              <span className={`${metrics.overdueCount > 0 ? 'text-rose-400' : 'text-teal-400'} font-bold group-hover:underline flex items-center gap-0.5`}>
                {metrics.overdueCount > 0 ? 'Review Overdue' : 'SLA Met'} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: OVERDUE TICKETS QUEUE (If any are overdue) */}
      {metrics.overdueCount > 0 && (
        <div className="bg-[#111827] rounded-2xl border border-rose-500/30 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Overdue Complaints Priority Queue ({metrics.overdueCount})
                </h3>
                <p className="text-xs text-slate-400">
                  These tickets have remained unresolved for {thresholdDays} or more days and require immediate administrative attention.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToComplaints && onNavigateToComplaints({ overdueOnly: true })}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold self-start sm:self-auto transition-colors cursor-pointer"
            >
              <span>Manage Overdue in Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {metrics.overdueList.map(complaint => {
              const overdueInfo = deriveComplaintOverdueStatus(complaint, thresholdDays);
              return (
                <div 
                  key={complaint.id} 
                  onClick={() => onSelectComplaint && onSelectComplaint(complaint)}
                  className="bg-[#0B1121] p-4 rounded-xl border border-[#1F2937] hover:border-rose-500/50 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      #{complaint.ticketNumber || complaint.id}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {overdueInfo.daysOpen}d open ({overdueInfo.daysOverdue}d overdue)
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">
                    {complaint.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1F2937]">
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Unit {complaint.unitNumber} ({complaint.tower})
                    </span>
                    <CategoryBadge category={complaint.category} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: Complaints by Category */}
      <div className="bg-[#111827] p-5 sm:p-6 rounded-2xl border border-[#1F2937] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <span>Complaints by Category</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of maintenance tickets across all infrastructure and service domains.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Click any category to filter and manage tickets.
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_CATEGORIES.map(catKey => {
            const config = CATEGORY_CONFIG[catKey];
            const data = metrics.categoryCounts[catKey] || { total: 0, open: 0, inProgress: 0, resolved: 0 };
            const percentage = metrics.total > 0 ? Math.round((data.total / metrics.total) * 100) : 0;
            const activeCount = data.open + data.inProgress;

            return (
              <div
                key={catKey}
                id={`category-stat-${catKey.toLowerCase()}`}
                onClick={() => onNavigateToComplaints && onNavigateToComplaints({ category: catKey })}
                className="p-4 rounded-xl border border-[#1F2937] hover:border-teal-500/50 transition-all cursor-pointer bg-[#0B1121] hover:bg-[#111827] group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl" role="img" aria-label={config.label}>
                      {config.icon}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">
                        {config.label}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        {activeCount > 0 ? (
                          <span className="text-orange-400 font-semibold">{activeCount} active</span>
                        ) : (
                          <span className="text-slate-500">No active tickets</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-white">{data.total}</span>
                    <span className="text-[11px] text-slate-400 block">{percentage}%</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="mt-3 w-full bg-[#1F2937] rounded-full h-1.5 overflow-hidden flex">
                  {data.resolved > 0 && (
                    <div 
                      className="bg-green-500 h-full"
                      style={{ width: `${data.total > 0 ? (data.resolved / data.total) * 100 : 0}%` }}
                      title={`${data.resolved} Resolved`}
                    />
                  )}
                  {data.inProgress > 0 && (
                    <div 
                      className="bg-orange-500 h-full"
                      style={{ width: `${data.total > 0 ? (data.inProgress / data.total) * 100 : 0}%` }}
                      title={`${data.inProgress} In Progress`}
                    />
                  )}
                  {data.open > 0 && (
                    <div 
                      className="bg-blue-500 h-full"
                      style={{ width: `${data.total > 0 ? (data.open / data.total) * 100 : 0}%` }}
                      title={`${data.open} Open`}
                    />
                  )}
                </div>

                {/* Sub-status counts */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Open: <strong className="text-white">{data.open}</strong></span>
                  <span>In Work: <strong className="text-white">{data.inProgress}</strong></span>
                  <span>Resolved: <strong className="text-green-400">{data.resolved}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Useful Summary Statistics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Summary Statistics & Society SLA Metrics</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Active SLA Rule: <strong className="text-white">{thresholdDays} Days</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Resolution Efficiency */}
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolution Rate</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{metrics.resolutionRate}%</span>
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    {metrics.resolvedCount}/{metrics.total}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-[#1F2937]">
              Closed or resolved complaints ratio across entire society.
            </p>
          </div>

          {/* Card 2: Average Resolution Time */}
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution Time</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {metrics.avgResolutionDays > 0 ? `${metrics.avgResolutionDays}d` : `${metrics.avgResolutionHours}h`}
                  </span>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    {metrics.avgResolutionHours}h avg
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-[#1F2937]">
              Average turnaround from creation to ticket resolution.
            </p>
          </div>

          {/* Card 3: Priority Urgency */}
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgent Active</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{metrics.urgentActiveCount}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    metrics.urgentActiveCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {metrics.urgentActiveCount > 0 ? 'Active Urgent' : 'All Clear'}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-[#1F2937]">
              High priority / emergency requests active in building.
            </p>
          </div>

          {/* Card 4: SLA Compliance Rate */}
          <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Compliance</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{metrics.slaComplianceRate}%</span>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    ≤ {thresholdDays}d Rule
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-[#1F2937]">
              Percentage of tickets maintained within standard SLA target.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

