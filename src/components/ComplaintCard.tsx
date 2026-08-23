import React from 'react';
import { 
  Building, 
  Calendar, 
  Image as ImageIcon, 
  ArrowRight,
  History,
  Clock,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { Complaint, CurrentUser } from '../types';
import { CategoryBadge, PriorityBadge, StatusBadge } from './CategoryBadge';

interface ComplaintCardProps {
  complaint: Complaint;
  currentUser: CurrentUser;
  onSelect: (complaint: Complaint) => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  currentUser,
  onSelect
}) => {
  // Format readable timestamp
  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate timeline progress percentage
  const getProgressPercentage = () => {
    switch (complaint.status) {
      case 'OPEN': return 33;
      case 'IN_PROGRESS': return 66;
      case 'RESOLVED': return 100;
      default: return 20;
    }
  };

  const historyCount = complaint.statusHistory ? complaint.statusHistory.length : 0;

  return (
    <div 
      id={`complaint-card-${complaint.id}`}
      onClick={() => onSelect(complaint)}
      className="bg-[#111827] dark:bg-teal-600 rounded-2xl border border-[#1F2937]/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500/50 transition-all p-5 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      <div>
        {/* Top meta bar: Ticket #, Category, Priority, Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#1F2937] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-200 dark:text-slate-200 bg-[#1F2937] dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-[#1F2937]/80 dark:border-slate-700">
              {complaint.ticketNumber}
            </span>
            <CategoryBadge category={complaint.category} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Title and Description */}
        <div className="mt-3.5">
          <h3 className="text-base font-bold text-white dark:text-slate-100 group-hover:text-teal-400 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
            {complaint.title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {complaint.description}
          </p>
        </div>

        {/* Attached Photo Badge if present */}
        {complaint.photoUrl && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-teal-400 dark:text-slate-400 font-semibold bg-teal-500/10/80 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg border border-teal-500/20/70 dark:border-teal-800/60">
            <ImageIcon className="w-3.5 h-3.5 text-teal-400 dark:text-teal-400" />
            <span>Photo Proof Attached</span>
          </div>
        )}

        {/* Progress Timeline Indicator */}
        <div className="mt-4 pt-3 border-t border-[#1F2937] dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium flex items-center gap-1">
              {complaint.status === 'OPEN' && <Clock className="w-3 h-3 text-blue-500" />}
              {complaint.status === 'IN_PROGRESS' && <Wrench className="w-3 h-3 text-amber-500" />}
              {complaint.status === 'RESOLVED' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              <span>Status Stage</span>
            </span>
            <span className="font-bold text-slate-200 dark:text-slate-200">
              {complaint.status === 'OPEN' ? '1/3 Open' : complaint.status === 'IN_PROGRESS' ? '2/3 In Progress' : '3/3 Resolved'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#1F2937] dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                complaint.status === 'RESOLVED'
                  ? 'bg-emerald-500'
                  : complaint.status === 'IN_PROGRESS'
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="mt-5 pt-3.5 border-t border-[#1F2937] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-medium text-slate-300 dark:text-slate-300">
            <Building className="w-3.5 h-3.5 text-teal-400 dark:text-teal-400" />
            <span>Unit {complaint.unitNumber} ({complaint.tower})</span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {historyCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/50">
              <History className="w-3 h-3" />
              {historyCount} {historyCount === 1 ? 'log' : 'logs'}
            </span>
          )}

          {/* Clear View Details Action */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(complaint);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] dark:bg-slate-800 hover:bg-teal-500/10 dark:hover:bg-teal-950/60 text-slate-300 dark:text-slate-200 hover:text-teal-400 dark:hover:text-slate-400 border border-[#1F2937]/80 dark:border-slate-700 hover:border-teal-500/20 dark:hover:border-teal-800 text-xs font-semibold transition-all group/btn cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
