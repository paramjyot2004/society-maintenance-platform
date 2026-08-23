import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  CreditCard, 
  Megaphone, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';
import { Complaint, CurrentUser, MaintenanceBill } from '../types';

interface StatsOverviewProps {
  currentUser: CurrentUser;
  complaints: Complaint[];
  bills: MaintenanceBill[];
  unreadNoticesCount: number;
  onFilterStatus?: (status: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  currentUser,
  complaints,
  bills,
  unreadNoticesCount,
  onFilterStatus,
  onNavigateTab
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Compute metrics from relevant complaints data based on user role
  const relevantComplaints = isAdmin 
    ? complaints 
    : complaints.filter(c => 
        c.residentName === currentUser.name || 
        c.unitNumber === currentUser.unitNumber ||
        (currentUser.id && c.userId === currentUser.id)
      );

  const totalTickets = relevantComplaints.length;
  const openTickets = relevantComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const inProgressTickets = relevantComplaints.filter(c => c.status === 'IN_PROGRESS').length;
  const urgentTickets = relevantComplaints.filter(c => c.priority === 'URGENT' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const resolvedTickets = relevantComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;

  // Dues calculations from real bills data
  const relevantBills = isAdmin 
    ? bills 
    : bills.filter(b => b.unitNumber === currentUser.unitNumber);
  
  const pendingBills = relevantBills.filter(b => b.status === 'PENDING' || b.status === 'OVERDUE');
  const totalPendingAmount = pendingBills.reduce((acc, curr) => acc + curr.amount, 0);
  const paidBillsCount = relevantBills.filter(b => b.status === 'PAID').length;
  const collectionRate = relevantBills.length > 0 ? Math.round((paidBillsCount / relevantBills.length) * 100) : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      
      {/* Card 1: Active Complaints */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('OPEN')}
        className="bg-[#111827] rounded-xl p-4 border border-[#1F2937]/80 shadow-none hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {isAdmin ? 'Active Complaints' : 'My Active Complaints'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white">{openTickets}</span>
          {urgentTickets > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200">
              <AlertCircle className="w-3 h-3" /> {urgentTickets} Urgent
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          <span>{inProgressTickets} in progress</span>
        </div>
      </div>

      {/* Card 2: Resolution Performance */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('RESOLVED')}
        className="bg-[#111827] rounded-xl p-4 border border-[#1F2937]/80 shadow-none hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {isAdmin ? 'Resolved Speed' : 'My Resolved Rate'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white">{resolutionRate}%</span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> {resolvedTickets}/{totalTickets} Done
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
          <span>{resolvedTickets} tickets closed</span>
          <span className="text-[10px] text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
        </div>
      </div>

      {/* Card 3: Maintenance Dues / Society Collection */}
      <div 
        onClick={() => onNavigateTab && onNavigateTab('dues')}
        className="bg-[#111827] rounded-xl p-4 border border-[#1F2937]/80 shadow-none hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {isAdmin ? 'Society Dues' : 'My Dues'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white">
            ₹{totalPendingAmount.toLocaleString()}
          </span>
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
            totalPendingAmount > 0 
              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isAdmin ? `${collectionRate}% Paid` : totalPendingAmount > 0 ? 'Pending' : 'All Clear'}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
          <span>{pendingBills.length} pending bill{pendingBills.length !== 1 ? 's' : ''}</span>
          <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Pay/View →</span>
        </div>
      </div>

      {/* Card 4: Community Notices */}
      <div 
        onClick={() => onNavigateTab && onNavigateTab('notices')}
        className="bg-[#111827] rounded-xl p-4 border border-[#1F2937]/80 shadow-none hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notices & Alerts</span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Megaphone className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white">{unreadNoticesCount}</span>
          {unreadNoticesCount > 0 ? (
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
              Active Alerts
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-500">
              Up to date
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
          <span>High-priority broadcasts</span>
          <span className="text-[10px] text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Read →</span>
        </div>
      </div>

    </div>
  );
};
