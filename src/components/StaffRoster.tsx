import React from 'react';
import { 
  Wrench, 
  Phone, 
  Star, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  UserCheck,
  Calendar,
  Briefcase
} from 'lucide-react';
import { StaffMember, CurrentUser } from '../types';
import { CategoryBadge } from './CategoryBadge';

interface StaffRosterProps {
  staffList: StaffMember[];
  currentUser: CurrentUser;
}

export const StaffRoster: React.FC<StaffRosterProps> = ({
  staffList,
  currentUser
}) => {
  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#111827] via-[#111827] to-teal-900/20 p-6 rounded-3xl border border-[#1F2937] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <div className="bg-teal-500/10 p-2 rounded-xl border border-teal-500/20">
                <Wrench className="w-5 h-5 text-teal-400" />
            </div>
            Facility Operations Roster
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            Certified technical staff on society duty for electrical, plumbing, carpentry, elevator, and sanitation support.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-teal-400 bg-teal-500/10 px-4 py-2.5 rounded-xl border border-teal-500/20 shadow-xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Helpdesk Active (Ext: 100)</span>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {staffList.map((staff) => (
          <div 
            key={staff.id}
            className={`bg-[#111827] rounded-2xl p-5 border transition-all flex flex-col justify-between group ${
              staff.isAvailable 
                ? 'border-[#1F2937] hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)]' 
                : 'border-[#1F2937] opacity-80 hover:opacity-100'
            }`}
          >
            <div>
              {/* Top: Avatar & Availability */}
              <div className="flex items-start justify-between mb-5">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 ${
                    staff.isAvailable ? 'border-teal-500/50' : 'border-[#374151]'
                  }`}>
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${!staff.isAvailable && 'grayscale opacity-80'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-[#111827] rounded-full ${
                    staff.isAvailable ? 'bg-teal-400' : 'bg-slate-500'
                  }`} />
                </div>
                
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                  staff.isAvailable 
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' 
                    : 'bg-[#0B1121] text-slate-400 border-[#1F2937]'
                }`}>
                  {staff.isAvailable ? 'On Duty' : 'Off Shift'}
                </span>
              </div>

              {/* Middle: Name, Role & Specialty */}
              <div className="mb-5">
                <h3 className="text-base font-extrabold text-white leading-tight mb-1.5">{staff.name}</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{staff.role}</span>
                </div>
                <div className="flex items-center">
                   <CategoryBadge category={staff.category} size="sm" />
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-5 bg-[#0B1121] p-3 rounded-xl border border-[#1F2937]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Workload</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className={`w-3.5 h-3.5 ${staff.activeTickets > 0 ? 'text-amber-400' : 'text-teal-400'}`} />
                    <span className="text-xs font-extrabold text-white">{staff.activeTickets} Active</span>
                  </div>
                </div>
                <div className="flex flex-col border-l border-[#1F2937] pl-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rating</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-extrabold text-white">{staff.rating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Contact Button */}
            <div className="mt-auto">
              <a
                href={staff.isAvailable ? `tel:${staff.phone}` : '#'}
                onClick={(e) => {
                  if (!staff.isAvailable) {
                    e.preventDefault();
                  }
                }}
                className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                  staff.isAvailable
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95'
                    : 'bg-[#1F2937] text-slate-400 cursor-not-allowed border border-[#374151]'
                }`}
              >
                {staff.isAvailable ? (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>Contact {staff.name.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Unavailable</span>
                  </>
                )}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
