import React from 'react';
import { 
  Droplet, 
  Zap, 
  ArrowUpDown, 
  ShieldAlert, 
  Hammer, 
  Trash2, 
  Trees, 
  Home, 
  HelpCircle,
  Clock,
  CheckCircle2,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';

export const CategoryBadge: React.FC<{ category: ComplaintCategory; size?: 'sm' | 'md' }> = ({ 
  category, 
  size = 'md' 
}) => {
  const getCategoryConfig = (cat: ComplaintCategory) => {
    switch (cat) {
      case 'PLUMBING':
        return { label: 'Plumbing', icon: Droplet, bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60' };
      case 'ELECTRICAL':
        return { label: 'Electrical', icon: Zap, bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60' };
      case 'ELEVATOR':
        return { label: 'Elevator', icon: ArrowUpDown, bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20 ' };
      case 'CARPENTRY':
        return { label: 'Carpentry', icon: Hammer, bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60' };
      case 'SECURITY':
        return { label: 'Security', icon: ShieldAlert, bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60' };
      case 'SANITATION':
        return { label: 'Sanitation', icon: Trash2, bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60' };
      case 'LANDSCAPING':
        return { label: 'Gardening', icon: Trees, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60' };
      case 'CIVIL_WORK':
        return { label: 'Civil Work', icon: Home, bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20  dark:text-teal-300 ' };
      default:
        return { label: 'General', icon: HelpCircle, bg: 'bg-[#1F2937] text-slate-300 border-[#374151]' };
    }
  };

  const { label, icon: Icon, bg } = getCategoryConfig(category);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-lg border ${bg} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: ComplaintPriority }> = ({ priority }) => {
  switch (priority) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60">
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#1F2937] text-slate-400 border border-[#374151]">
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: ComplaintStatus }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Open
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Resolved
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-300 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          <AlertCircle className="w-3 h-3 text-slate-500" />
          {status}
        </span>
      );
  }
};
