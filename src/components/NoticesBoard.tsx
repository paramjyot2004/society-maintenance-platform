import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Pin, 
  PlusCircle, 
  Calendar, 
  User, 
  Tag, 
  AlertOctagon, 
  Wrench, 
  PartyPopper, 
  FileText, 
  X, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  Layers,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  Notice, 
  CurrentUser, 
  CreateNoticeInput, 
  UpdateNoticeInput, 
  NoticeCategory, 
  NoticePriority 
} from '../types';
import { 
  getNotices, 
  isNoticeImportant 
} from '../services/noticeService';

interface NoticesBoardProps {
  notices: Notice[];
  currentUser: CurrentUser;
  onAddNotice: (notice: CreateNoticeInput) => void;
  onUpdateNotice: (id: string, updates: UpdateNoticeInput) => void;
  onDeleteNotice: (id: string) => void;
  onTogglePin: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export const NoticesBoard: React.FC<NoticesBoardProps> = ({
  notices,
  currentUser,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onTogglePin,
  onShowToast
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterImportantOnly, setFilterImportantOnly] = useState<boolean>(false);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deletingNotice, setDeletingNotice] = useState<Notice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);

  // Form State for Create Notice
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createCategory, setCreateCategory] = useState<NoticeCategory>('MAINTENANCE');
  const [createPriority, setCreatePriority] = useState<NoticePriority>('NORMAL');
  const [createAudience, setCreateAudience] = useState('All Residents & Homeowners');
  const [createIsPinned, setCreateIsPinned] = useState(false);

  // Form State for Edit Notice
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<NoticeCategory>('MAINTENANCE');
  const [editPriority, setEditPriority] = useState<NoticePriority>('NORMAL');
  const [editAudience, setEditAudience] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(false);

  // Server-authoritative notices filtering and sorting (Important notices pinned at top)
  const filteredNotices = useMemo(() => {
    const res = getNotices(currentUser, notices, {
      category: filterCategory,
      searchQuery: searchQuery,
      importantOnly: filterImportantOnly
    });
    return res.data;
  }, [currentUser, notices, filterCategory, searchQuery, filterImportantOnly]);

  const totalNoticesCount = notices.length;
  const importantNoticesCount = notices.filter(n => isNoticeImportant(n)).length;

  // Open Edit Modal
  const handleOpenEdit = (notice: Notice) => {
    if (!isAdmin) {
      onShowToast?.('Unauthorized: Only administrators can edit notices.');
      return;
    }
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditContent(notice.content);
    setEditCategory(notice.category);
    setEditPriority(notice.priority);
    setEditAudience(notice.targetAudience);
    setEditIsPinned(isNoticeImportant(notice));
  };

  // Submit Create Notice
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onShowToast?.('Unauthorized: Only administrators can publish notices.');
      return;
    }
    if (!createTitle.trim() || !createContent.trim()) {
      onShowToast?.('Please provide both notice title and content.');
      return;
    }

    onAddNotice({
      title: createTitle.trim(),
      content: createContent.trim(),
      category: createCategory,
      priority: createPriority,
      targetAudience: createAudience.trim() || 'All Residents & Homeowners',
      isPinned: createIsPinned,
      isImportant: createIsPinned
    });

    // Reset Form
    setCreateTitle('');
    setCreateContent('');
    setCreateCategory('MAINTENANCE');
    setCreatePriority('NORMAL');
    setCreateAudience('All Residents & Homeowners');
    setCreateIsPinned(false);
    setShowCreateModal(false);
  };

  // Submit Edit Notice
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    if (!isAdmin) {
      onShowToast?.('Unauthorized: Only administrators can edit notices.');
      return;
    }
    if (!editTitle.trim() || !editContent.trim()) {
      onShowToast?.('Please provide both notice title and content.');
      return;
    }

    onUpdateNotice(editingNotice.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      category: editCategory,
      priority: editPriority,
      targetAudience: editAudience.trim() || 'All Residents & Homeowners',
      isPinned: editIsPinned,
      isImportant: editIsPinned
    });

    setEditingNotice(null);
  };

  // Confirm Delete Notice
  const handleConfirmDelete = () => {
    if (!deletingNotice) return;
    if (!isAdmin) {
      onShowToast?.('Unauthorized: Only administrators can delete notices.');
      return;
    }

    onDeleteNotice(deletingNotice.id);
    setDeletingNotice(null);
  };

  // Helper for category styling & icon
  const getCategoryTheme = (cat: NoticeCategory) => {
    switch (cat) {
      case 'EMERGENCY':
        return { 
          bg: 'bg-red-50 text-red-700 border-red-200', 
          icon: AlertOctagon, 
          label: 'Emergency Alert',
          accent: 'border-red-500'
        };
      case 'MAINTENANCE':
        return { 
          bg: 'bg-blue-50 text-blue-700 border-blue-200', 
          icon: Wrench, 
          label: 'Maintenance',
          accent: 'border-blue-500'
        };
      case 'EVENT':
        return { 
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20', 
          icon: PartyPopper, 
          label: 'Community Event',
          accent: 'border-teal-500/50'
        };
      case 'RULE':
        return { 
          bg: 'bg-amber-50 text-amber-800 border-amber-200', 
          icon: FileText, 
          label: 'Society Rule',
          accent: 'border-amber-500'
        };
      default:
        return { 
          bg: 'bg-[#1F2937] text-slate-300 border-[#1F2937]', 
          icon: Megaphone, 
          label: 'General Circular',
          accent: 'border-slate-400'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#111827] p-5 rounded-2xl border border-[#1F2937] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-500/10 text-teal-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/20 flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5" />
              Oakwood Residency Broadcasts
            </span>
            {importantNoticesCount > 0 && (
              <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <Pin className="w-3 h-3 fill-amber-400 text-amber-600" />
                {importantNoticesCount} Pinned Announcement{importantNoticesCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Society Circulars & Notice Board
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Official broadcasts, emergency alerts, maintenance schedules, and AGM notices for all residents. Important notices remain pinned at the top.
          </p>
        </div>

        {/* Action Controls & Admin Create Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search circulars, topics, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-[#374151] text-xs bg-[#0B1121] focus:bg-[#111827] focus:ring-2 focus:ring-teal-500/50 w-52 sm:w-64 focus:outline-hidden transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Admin Publish Notice Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setCreateTitle('');
                setCreateContent('');
                setCreateCategory('MAINTENANCE');
                setCreatePriority('NORMAL');
                setCreateAudience('All Residents & Homeowners');
                setCreateIsPinned(false);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 shadow-teal-500/20 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] p-3 rounded-2xl border border-[#1F2937] shadow-2xs">
        
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => { setFilterCategory('ALL'); setFilterImportantOnly(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterCategory === 'ALL' && !filterImportantOnly
                ? 'bg-[#1F2937] text-white shadow-xs border border-[#374151]'
                : 'bg-[#0B1121] text-slate-400 hover:bg-[#1F2937] border border-[#1F2937]'
            }`}
          >
            All Notices ({totalNoticesCount})
          </button>

          {/* Quick Filter: Important / Pinned */}
          <button
            onClick={() => setFilterImportantOnly(!filterImportantOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterImportantOnly
                ? 'bg-amber-500/20 text-amber-300 shadow-amber-500/20 ring-1 ring-amber-500/50'
                : 'bg-[#0B1121] text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <Pin className={`w-3 h-3 ${filterImportantOnly ? 'fill-white' : 'fill-amber-400'}`} />
            <span>Important Pinned ({importantNoticesCount})</span>
          </button>

          {(['MAINTENANCE', 'EMERGENCY', 'EVENT', 'RULE', 'GENERAL'] as NoticeCategory[]).map((cat) => {
            const count = notices.filter(n => n.category === cat).length;
            const isSelected = filterCategory === cat && !filterImportantOnly;
            return (
              <button
                key={cat}
                onClick={() => { setFilterCategory(cat); setFilterImportantOnly(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F2937] text-white shadow-xs border border-[#374151]'
                    : 'bg-[#0B1121] text-slate-400 hover:bg-[#1F2937] border border-[#1F2937]'
                }`}
              >
                {cat.charAt(0) + cat.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* Clear Filters Indicator */}
        {(filterCategory !== 'ALL' || filterImportantOnly || searchQuery) && (
          <button
            onClick={() => {
              setFilterCategory('ALL');
              setFilterImportantOnly(false);
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#1F2937] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Notices Grid (Important / Pinned notices displayed at top) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[#111827] rounded-2xl border border-[#1F2937] shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#1F2937] text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No circulars found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {filterImportantOnly 
                ? 'There are currently no circulars marked as important / pinned.' 
                : 'No circular notices match your selected filters or search query.'}
            </p>
            {(filterCategory !== 'ALL' || filterImportantOnly || searchQuery) && (
              <button
                onClick={() => {
                  setFilterCategory('ALL');
                  setFilterImportantOnly(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const { bg, icon: Icon, label } = getCategoryTheme(notice.category);
            const isImportant = isNoticeImportant(notice);

            return (
              <div
                key={notice.id}
                className={`bg-[#111827] rounded-2xl p-5 border transition-all flex flex-col justify-between relative group ${
                  isImportant
                    ? 'border-amber-500/30 ring-1 ring-amber-500/30 shadow-amber-500/10 shadow-lg bg-gradient-to-br from-amber-500/10 via-[#111827] to-[#111827]'
                    : 'border-[#1F2937] shadow-2xs hover:shadow-md'
                }`}
              >
                <div>
                  
                  {/* Top Bar: Category Pill, Priority Pill & Pin/Admin Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    
                    <div className="flex flex-wrap items-center gap-1.5">
                      
                      {/* IMPORTANT PINNED BADGE */}
                      {isImportant && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-2xs">
                          <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>Pinned Important</span>
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${bg}`}>
                        <Icon className="w-3 h-3 shrink-0" />
                        <span>{label}</span>
                      </span>

                      {/* Urgent Priority Badge */}
                      {notice.priority === 'URGENT' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                          Urgent Attention
                        </span>
                      )}
                      {notice.priority === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          High Priority
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Pin, Edit, Delete (Admin) or View (Resident) */}
                    <div className="flex items-center gap-1">
                      
                      {/* ADMIN: Mark as Important / Pin toggle button */}
                      {isAdmin ? (
                        <button
                          onClick={() => onTogglePin(notice.id)}
                          title={isImportant ? 'Unpin this notice' : 'Mark notice as Important (Pin to top)'}
                          className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isImportant
                              ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-[#1F2937]'
                          }`}
                        >
                          <Pin className={`w-4 h-4 ${isImportant ? 'fill-amber-700' : ''}`} />
                        </button>
                      ) : isImportant ? (
                        <span title="Pinned Announcement" className="p-1 text-amber-600">
                          <Pin className="w-4 h-4 fill-amber-400" />
                        </span>
                      ) : null}

                      {/* ADMIN: Edit Button */}
                      {isAdmin && (
                        <button
                          onClick={() => handleOpenEdit(notice)}
                          title="Edit this notice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* ADMIN: Delete Button */}
                      {isAdmin && (
                        <button
                          onClick={() => setDeletingNotice(notice)}
                          title="Delete this notice"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>
                  </div>

                  {/* Notice Title */}
                  <h3 
                    onClick={() => setViewingNotice(notice)}
                    className="text-base font-bold text-white leading-snug mb-2 hover:text-teal-400 cursor-pointer transition-colors"
                  >
                    {notice.title}
                  </h3>

                  {/* Notice Content (Excerpt) */}
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line line-clamp-4 mb-3">
                    {notice.content}
                  </p>

                  {/* Read more trigger if content is detailed */}
                  {notice.content.length > 200 && (
                    <button
                      onClick={() => setViewingNotice(notice)}
                      className="text-[11px] font-bold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1 mb-2 cursor-pointer"
                    >
                      <span>Read Full Circular</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Notice Footer Metadata */}
                <div className="mt-3 pt-3 border-t border-[#1F2937] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{notice.author} • <span className="text-slate-400 font-normal">{notice.authorRole}</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-[#1F2937] px-2 py-0.5 rounded text-[10px] text-slate-400 font-semibold">
                      To: {notice.targetAudience}
                    </span>
                    <span className="text-slate-400">{notice.date}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Create Notice (Admin Only) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1121]/80 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Broadcast Society Notice</h3>
                  <p className="text-[11px] text-slate-400">Publish circular to all residents and towers</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Notice Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notice Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elevators Power Backup Maintenance & Schedule"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden"
                />
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] bg-[#111827] font-medium text-slate-200"
                  >
                    <option value="MAINTENANCE">Maintenance & Service</option>
                    <option value="EMERGENCY">Emergency & Safety</option>
                    <option value="EVENT">Community & AGM Event</option>
                    <option value="RULE">Society Rules & Guidelines</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as NoticePriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] bg-[#111827] font-medium text-slate-200"
                  >
                    <option value="NORMAL">Normal Notice</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Immediate Action</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tower A & B Residents, All Residents, Vehicle Owners"
                  value={createAudience}
                  onChange={(e) => setCreateAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden"
                />
              </div>

              {/* Notice Body */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Announcement Body *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide full schedules, emergency contact numbers, instructions, or meeting agenda..."
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Mark as Important / Pinned Checkbox */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsPinned}
                    onChange={(e) => setCreateIsPinned(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      Mark as Important (Pin to top of board)
                    </span>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      Pinned notices are authoritatively prioritized at the very top of all resident feeds.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1F2937] text-xs font-semibold text-slate-300 hover:bg-[#374151] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 shadow-teal-500/20 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Notice</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Notice (Admin Only) */}
      {editingNotice && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1121]/80 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Society Notice</h3>
                  <p className="text-[11px] text-slate-400">Update circular details and pinned status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingNotice(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              {/* Notice Headline */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Notice Headline *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden font-medium"
                />
              </div>

              {/* Category & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] bg-[#111827] font-medium text-slate-200"
                  >
                    <option value="MAINTENANCE">Maintenance & Service</option>
                    <option value="EMERGENCY">Emergency & Safety</option>
                    <option value="EVENT">Community & AGM Event</option>
                    <option value="RULE">Society Rules & Guidelines</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as NoticePriority)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] bg-[#111827] font-medium text-slate-200"
                  >
                    <option value="NORMAL">Normal Notice</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Immediate Action</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden"
                />
              </div>

              {/* Notice Body */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Announcement Body *
                </label>
                <textarea
                  required
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#374151] focus:ring-2 focus:ring-teal-500/50 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Mark as Important / Pinned Checkbox */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsPinned}
                    onChange={(e) => setEditIsPinned(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      Mark as Important (Pin to top of board)
                    </span>
                    <p className="text-[11px] text-amber-900/80 mt-0.5">
                      Pinned notices stay anchored at the top of the notice board.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="px-4 py-2 rounded-xl bg-[#1F2937] text-xs font-semibold text-slate-300 hover:bg-[#374151] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation (Admin Only) */}
      {deletingNotice && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1121]/80 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Notice Circular</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-[#0B1121] p-3.5 rounded-xl border border-[#1F2937] mb-4">
              <p className="text-xs font-bold text-white line-clamp-2">
                "{deletingNotice.title}"
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Published on {deletingNotice.date} by {deletingNotice.author}
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Are you sure you want to permanently remove this announcement from the resident notice board?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingNotice(null)}
                className="px-4 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: Full Notice View Modal (For Residents and Admins) */}
      {viewingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1121]/80 backdrop-blur-xs">
          <div className="bg-[#111827] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#1F2937] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#1F2937] mb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {isNoticeImportant(viewingNotice) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Pin className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>Pinned Important</span>
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getCategoryTheme(viewingNotice.category).bg}`}>
                    {getCategoryTheme(viewingNotice.category).label}
                  </span>
                  {viewingNotice.priority === 'URGENT' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      Urgent Attention
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-white leading-snug">
                  {viewingNotice.title}
                </h2>
              </div>
              <button
                onClick={() => setViewingNotice(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-400 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author & Target Bar */}
            <div className="bg-[#0B1121] p-3 rounded-xl border border-[#1F2937] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-slate-200">{viewingNotice.author}</span>
                <span className="text-slate-400">• {viewingNotice.authorRole}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="bg-[#111827] px-2.5 py-1 rounded-md border border-[#1F2937] font-semibold text-slate-300">
                  Target: {viewingNotice.targetAudience}
                </span>
                <span className="text-slate-400 font-medium">{viewingNotice.date}</span>
              </div>
            </div>

            {/* Full Body Text */}
            <div className="prose prose-slate max-w-none mb-6">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {viewingNotice.content}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
              <div className="text-[11px] text-slate-400">
                {viewingNotice.updatedAt && viewingNotice.updatedAt !== viewingNotice.createdAt && (
                  <span>Updated: {new Date(viewingNotice.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        const target = viewingNotice;
                        setViewingNotice(null);
                        handleOpenEdit(target);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Edit Notice
                    </button>
                    <button
                      onClick={() => {
                        const target = viewingNotice;
                        setViewingNotice(null);
                        setDeletingNotice(target);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Delete Notice
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewingNotice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
