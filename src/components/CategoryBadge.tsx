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
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types';

export const CategoryBadge: React.FC<{ category: ComplaintCategory; size?: 'sm' | 'md' }> = ({ 
  category, 
  size = 'md' 
}) => {
  const getCategoryConfig = (cat: ComplaintCategory) => {
    switch (cat) {
      case 'PLUMBING':
        return { label: 'Plumbing', icon: Droplet, bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
      case 'ELECTRICAL':
        return { label: 'Electrical', icon: Zap, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'ELEVATOR':
        return { label: 'Elevator', icon: ArrowUpDown, bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
      case 'CARPENTRY':
        return { label: 'Carpentry', icon: Hammer, bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
      case 'SECURITY':
        return { label: 'Security', icon: ShieldAlert, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
      case 'SANITATION':
        return { label: 'Sanitation', icon: Trash2, bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'LANDSCAPING':
        return { label: 'Gardening', icon: Trees, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'CIVIL_WORK':
        return { label: 'Civil Work', icon: Home, bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
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
    case 'URGENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Open
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          Resolved
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Check className="w-3 h-3 text-purple-400" />
          Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1F2937] text-slate-300 border border-[#374151]">
          <AlertCircle className="w-3 h-3 text-slate-500" />
          {status}
        </span>
      );
  }
};
