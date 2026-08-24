import React, { useState } from 'react';
import { 
  X, 
  Building, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Image as ImageIcon, 
  ExternalLink,
  Search,
  Bell,
  Printer,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Phone
} from 'lucide-react';
import { Complaint, CurrentUser } from '../types';
import { residentConfirmComplaintOnServer, residentConfirmComplaint } from '../services/complaintService';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  currentUser: CurrentUser;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  onUpdateComplaint?: (updatedComplaint: Complaint) => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint: initialComplaint,
  currentUser,
  onClose,
  onUpdateComplaint
}) => {
  const [complaint, setComplaint] = useState<Complaint | null>(initialComplaint);
  const [isReopenOpen, setIsReopenOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  React.useEffect(() => {
    setComplaint(initialComplaint);
  }, [initialComplaint]);

  if (!complaint) return null;

  const formattedDate = new Date(complaint.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isAssigned = !!complaint.assignedStaffName;
  const isOpen = complaint.status === 'OPEN';
  const isInProgress = complaint.status === 'IN_PROGRESS';
  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  // Handler: Resident confirm and close ticket
  const handleConfirmCloseTicket = async () => {
    setIsSubmittingAction(true);
    try {
      const serverRes = await residentConfirmComplaintOnServer(complaint.id, 'CONFIRM_CLOSE');
      if (serverRes.success && serverRes.complaint) {
        setComplaint(serverRes.complaint);
        onUpdateComplaint?.(serverRes.complaint);
      } else {
        const localRes = residentConfirmComplaint(complaint.id, 'CONFIRM_CLOSE', currentUser.name, undefined, [complaint]);
        if (localRes.success && localRes.complaint) {
          setComplaint(localRes.complaint);
          onUpdateComplaint?.(localRes.complaint);
        }
      }
    } catch {
      const localRes = residentConfirmComplaint(complaint.id, 'CONFIRM_CLOSE', currentUser.name, undefined, [complaint]);
      if (localRes.success && localRes.complaint) {
        setComplaint(localRes.complaint);
        onUpdateComplaint?.(localRes.complaint);
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handler: Resident reopen ticket
  const handleReopenTicket = async () => {
    setIsSubmittingAction(true);
    const reason = reopenReason.trim();
    try {
      const serverRes = await residentConfirmComplaintOnServer(complaint.id, 'REOPEN', reason);
      if (serverRes.success && serverRes.complaint) {
        setComplaint(serverRes.complaint);
        onUpdateComplaint?.(serverRes.complaint);
        setIsReopenOpen(false);
        setReopenReason('');
      } else {
        const localRes = residentConfirmComplaint(complaint.id, 'REOPEN', currentUser.name, reason, [complaint]);
        if (localRes.success && localRes.complaint) {
          setComplaint(localRes.complaint);
          onUpdateComplaint?.(localRes.complaint);
          setIsReopenOpen(false);
          setReopenReason('');
        }
      }
    } catch {
      const localRes = residentConfirmComplaint(complaint.id, 'REOPEN', currentUser.name, reason, [complaint]);
      if (localRes.success && localRes.complaint) {
        setComplaint(localRes.complaint);
        onUpdateComplaint?.(localRes.complaint);
        setIsReopenOpen(false);
        setReopenReason('');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default:
        return 'text-slate-400 bg-[#1F2937] border-[#374151]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'IN_PROGRESS':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'RESOLVED':
        return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
      case 'CLOSED':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      default:
        return 'text-slate-400 bg-[#1F2937] border-[#374151]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111827] flex flex-col animate-in fade-in overflow-hidden">
      
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-[#1F2937] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Complaint {complaint.ticketNumber}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="bg-[#0B1121] border border-[#1F2937] text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-teal-500/50 transition-colors w-64"
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2937] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1F2937] border border-[#374151]">
            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          {/* Breadcrumb & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
              <span className="cursor-pointer hover:text-white transition-colors" onClick={onClose}>Complaints</span>
              <span>&gt;</span>
              <span className="text-white">Ticket {complaint.ticketNumber}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1121] border border-[#1F2937] text-white hover:text-white hover:bg-[#1F2937] transition-colors text-sm font-bold shadow-sm cursor-pointer">
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button 
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1121] border border-[#1F2937] text-slate-300 hover:bg-[#1F2937] hover:text-white transition-colors text-sm font-bold shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
                Back to Complaints
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Main Details (Span 2) */}
            <div className="xl:col-span-2 space-y-6">

              {/* RESIDENT RESOLUTION CONFIRMATION BANNER (Requirement 4) */}
              {complaint.status === 'RESOLVED' && (
                <div className="bg-gradient-to-r from-teal-950/80 via-[#111827] to-emerald-950/80 border-2 border-teal-500/50 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Your complaint has been resolved
                      </h3>
                      <p className="text-sm text-slate-300">
                        Please confirm whether the issue has been fixed to your satisfaction.
                      </p>
                    </div>
                  </div>

                  {isReopenOpen ? (
                    <div className="pt-2 space-y-3 bg-[#0B1121] p-4 rounded-xl border border-[#1F2937]">
                      <label className="block text-xs font-bold text-slate-300">
                        Please describe why the issue is not fixed:
                      </label>
                      <textarea
                        rows={2}
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="e.g., The leak was patched but water is still dripping from the joint..."
                        className="w-full p-3 rounded-xl border border-[#1F2937] text-xs focus:ring-2 focus:ring-rose-500/50 text-white bg-[#111827]"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsReopenOpen(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingAction}
                          onClick={handleReopenTicket}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                        >
                          {isSubmittingAction ? 'Reopening...' : 'Submit & Reopen Ticket'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        disabled={isSubmittingAction}
                        onClick={handleConfirmCloseTicket}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm &amp; Close Ticket</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmittingAction}
                        onClick={() => setIsReopenOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F2937] hover:bg-rose-900/30 text-rose-300 hover:text-rose-200 border border-[#374151] hover:border-rose-500/40 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                        <span>Issue Not Fixed / Reopen</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Complaint Header & Description Card */}
              <div className="bg-[#0B1121] border border-[#1F2937] rounded-2xl p-6 md:p-8">
                
                {/* Title Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {complaint.title}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 text-xs font-bold border rounded-full flex items-center gap-1.5 ${getPriorityColor(complaint.priority)}`}>
                      <AlertCircle className="w-3.5 h-3.5" />
                      {complaint.priority} PRIORITY
                    </span>
                    <span className="px-3 py-1 text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full capitalize">
                      {complaint.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-8 border-b border-[#1F2937] pb-6">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formattedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <Building className="w-4 h-4 text-teal-400" />
                    Unit {complaint.unitNumber} ({complaint.tower})
                  </span>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Description
                  </h3>
                  <div className="text-white leading-relaxed text-sm whitespace-pre-line bg-[#111827] p-4 md:p-6 rounded-xl border border-[#1F2937]">
                    {complaint.description}
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Attachments ({complaint.photoUrl ? '1' : '0'})
                  </h3>
                  {complaint.photoUrl ? (
                    <div className="flex flex-wrap gap-4">
                      <a 
                        href={complaint.photoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative w-48 h-32 rounded-xl overflow-hidden border border-[#1F2937] bg-[#111827] block cursor-pointer"
                      >
                        <img 
                          src={complaint.photoUrl} 
                          alt="Complaint Evidence" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    </div>
                  ) : (
                    <div className="bg-[#111827] border border-[#1F2937] border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-slate-400">
                      <Paperclip className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No attachments provided</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Status Timeline */}
              <div className="bg-[#0B1121] border border-[#1F2937] rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-6">Resolution Status</h3>
                
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1F2937]">
                  
                  {/* Map through actual history */}
                  {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
                    complaint.statusHistory.map((hist, idx) => {
                      const isLast = idx === complaint.statusHistory.length - 1;
                      const isResolvedEvent = hist.newStatus === 'RESOLVED' || hist.newStatus === 'CLOSED';
                      const isProgressEvent = hist.newStatus === 'IN_PROGRESS';
                      const isAssignedEvent = hist.newStatus === 'ASSIGNED';
                      
                      let iconColor = 'bg-[#1F2937] text-slate-400 border-[#374151]';
                      let Icon = Clock;
                      
                      if (isResolvedEvent) {
                        iconColor = 'bg-green-600 text-white border-green-600 shadow-md';
                        Icon = CheckCircle2;
                      } else if (isProgressEvent || isAssignedEvent) {
                        iconColor = 'bg-teal-600 text-white border-teal-500/50 shadow-md';
                        Icon = Wrench;
                      } else if (hist.newStatus === 'OPEN') {
                        iconColor = 'bg-teal-600 text-white border-teal-500/50 shadow-md';
                        Icon = CheckCircle2;
                      }

                      return (
                        <div key={hist.id} className="relative flex items-start gap-4">
                          <div className={`absolute -left-9 w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${iconColor}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-300">
                              {hist.newStatus.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-slate-400 mt-1">
                              {hist.note || `Status updated to ${hist.newStatus.replace('_', ' ')}.`}
                            </p>
                            <p className="text-xs text-slate-400 mt-2 font-mono">
                              {new Date(hist.timestamp).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-sm italic">No status history available.</div>
                  )}

                  {/* Future/Pending State if not resolved */}
                  {!isResolved && (
                    <div className="relative flex items-start gap-4 opacity-40">
                      <div className="absolute -left-9 w-6 h-6 rounded-full border-2 border-[#374151] bg-[#111827] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-400">Resolved</h4>
                        <p className="text-sm text-slate-400 mt-1">Awaiting confirmation</p>
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>

            </div>

            {/* Right Column - Info Panel */}
            <div className="space-y-6">
              
              {/* Ticket Info Card */}
              <div className="bg-[#0B1121] border border-[#1F2937] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-teal-400" />
                    Current Status
                  </h3>
                  <span className={`px-2.5 py-1 text-[10px] font-bold border rounded-full uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-[#1F2937]">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Technician</p>
                    {isAssigned ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-300">{complaint.assignedStaffName}</p>
                          <p className="text-xs text-slate-400">Facility Staff</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Unassigned</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resident Contact</p>
                    <p className="text-sm text-white">{complaint.residentName}</p>
                    <p className="text-sm text-slate-400">{complaint.residentContact}</p>
                  </div>
                </div>
              </div>

              {/* Communication / Updates Log */}
              <div className="bg-[#0B1121] border border-[#1F2937] rounded-2xl flex flex-col h-[400px]">
                <div className="p-4 border-b border-[#1F2937] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    Updates Log
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Auto-generated initial message based on description */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1F2937] overflow-hidden shrink-0 border border-[#374151]">
                        <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-white">{currentUser.name} <span className="text-slate-400 font-normal">(Resident)</span></span>
                      <span className="text-[10px] text-slate-400 ml-auto">{new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="ml-8 bg-[#1F2937] rounded-xl rounded-tl-none p-3 text-sm text-white shadow-sm border border-[#374151]">
                      {complaint.description}
                    </div>
                  </div>

                  {/* Comments from the array */}
                  {complaint.comments && complaint.comments.map((comment) => {
                    const isCurrentUser = comment.author === currentUser.name;
                    return (
                      <div key={comment.id} className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                            isCurrentUser 
                              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50/30' 
                              : 'bg-green-600/20 text-green-600 border border-emerald-500/30'
                          }`}>
                            {isCurrentUser ? 'R' : 'FM'}
                          </div>
                          <span className="text-xs font-bold text-white">
                            {comment.author} <span className="text-slate-400 font-normal">({comment.role === 'ADMIN' ? 'Facility Manager' : comment.role})</span>
                          </span>
                          <span className={`text-[10px] text-slate-400 ${isCurrentUser ? 'mr-auto' : 'ml-auto'}`}>
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`bg-[#1F2937] rounded-xl p-3 text-sm text-white shadow-sm border border-[#374151] ${
                          isCurrentUser ? 'mr-8 rounded-tr-none bg-teal-500/10 border-teal-500/20 text-teal-100' : 'ml-8 rounded-tl-none'
                        }`}>
                          {comment.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Disabled input for resident */}
                <div className="p-4 border-t border-[#1F2937] bg-[#111827] rounded-b-2xl">
                  <div className="relative">
                    <input 
                      type="text"
                      disabled
                      placeholder="Contact facility office for updates..."
                      className="w-full bg-[#0B1121] border border-[#1F2937] rounded-xl pl-4 pr-10 py-3 text-sm text-slate-400 focus:outline-none opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
