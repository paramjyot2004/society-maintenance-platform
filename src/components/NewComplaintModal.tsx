import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Droplet, Zap, ArrowUpDown, ShieldAlert, Hammer, Trash2, Trees, Home, HelpCircle,
  UploadCloud, AlertCircle, Loader2, CheckCircle2, Info, Trash, ChevronDown, Camera, Link, RefreshCw
} from 'lucide-react';
import { ComplaintCategory, ComplaintPriority, CurrentUser } from '../types';

interface NewComplaintModalProps {
  currentUser: CurrentUser;
  onClose: () => void;
  onSubmit: (complaintData: {
    title: string;
    description: string;
    category: ComplaintCategory;
    priority?: ComplaintPriority;
    locationUnit?: string;
    photoUrl?: string;
  }) => Promise<any> | any;
  isSubmitting?: boolean;
}

const CATEGORIES: { value: ComplaintCategory; label: string; icon: React.ElementType }[] = [
  { value: 'PLUMBING', label: 'Plumbing', icon: Droplet },
  { value: 'ELECTRICAL', label: 'Electrical', icon: Zap },
  { value: 'ELEVATOR', label: 'Elevator/Lift', icon: ArrowUpDown },
  { value: 'CARPENTRY', label: 'Carpentry & Doors', icon: Hammer },
  { value: 'SANITATION', label: 'Sanitation & Chute', icon: Trash2 },
  { value: 'SECURITY', label: 'Security & Access', icon: ShieldAlert },
  { value: 'CIVIL_WORK', label: 'Civil & Painting', icon: Home },
  { value: 'LANDSCAPING', label: 'Garden & Common', icon: Trees },
  { value: 'OTHER', label: 'General / Other', icon: HelpCircle },
];

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  currentUser,
  onClose,
  onSubmit,
  isSubmitting = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory | ''>('');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [locationUnit, setLocationUnit] = useState(
    currentUser.unitNumber
      ? (currentUser.tower ? `${currentUser.unitNumber}, ${currentUser.tower}` : currentUser.unitNumber)
      : 'A-402, Tower A'
  );
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [successTicket, setSuccessTicket] = useState<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is too large. Please select a photo under 10MB.');
      return;
    }
    setErrorMessage(null);
    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setPhotoUrl(e.target.result as string);
    };
    reader.onerror = () => setErrorMessage('Failed to read image file.');
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };
  
  const handleClearPhoto = () => {
    setPhotoUrl('');
    setPhotoFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!category) return setErrorMessage('Please select an issue category.');
    if (!title.trim()) return setErrorMessage('Please enter an issue summary.');
    if (!description.trim()) return setErrorMessage('Please provide a detailed description.');

    try {
      const res = await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category: category as ComplaintCategory,
        priority,
        locationUnit: locationUnit.trim(),
        photoUrl: photoUrl.trim() || undefined
      });

      if (res && (res.success === true || res.ticketNumber) && res.success !== false) {
        const ticket = res.data || res;
        setSuccessTicket(ticket);
        setErrorMessage(null);
      } else {
        const apiError = res?.error || 'Failed to submit complaint to the server. Please try again.';
        setErrorMessage(apiError);
        setSuccessTicket(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit complaint. Please try again.');
      setSuccessTicket(null);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === category);
  const SelectedIcon = selectedCategory?.icon;

  if (successTicket) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B1121] flex flex-col animate-in fade-in">
        <div className="border-b border-[#1F2937] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="cursor-pointer hover:text-white" onClick={onClose}>Complaints</span>
            <span>&gt;</span>
            <span className="text-white">Raise New Request</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2937]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-[#1F2937] p-8 rounded-2xl w-full max-w-md text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Complaint Submitted</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your maintenance request has been successfully registered. The facility management team will review it shortly.
            </p>
            {successTicket.ticketNumber && (
              <div className="bg-[#0B1121] border border-[#1F2937] rounded-xl p-4 mb-6">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Ticket Reference</p>
                <p className="text-lg text-teal-400 font-mono font-bold">{successTicket.ticketNumber}</p>
              </div>
            )}
            <button onClick={onClose} className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-500/20 border border-teal-500/50 text-white font-bold py-3 rounded-xl transition-colors">
              Back to My Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1121] flex flex-col animate-in fade-in overflow-y-auto">
      
      {/* Top Header */}
      <div className="border-b border-[#1F2937] px-4 md:px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 font-medium">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={onClose}>Complaints</span>
          <span>&gt;</span>
          <span className="text-white">Raise New Request</span>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1F2937] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8 items-center pb-20">
        
        <div className="w-full max-w-3xl mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Raise a Complaint</h1>
          <p className="text-slate-400 text-xs md:text-sm">Submit a new maintenance or facility request for the Oakwood Heights management team to address.</p>
        </div>

        <div className="w-full max-w-3xl bg-[#111827] border border-[#1F2937] rounded-2xl p-5 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-3.5 rounded-xl flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-white text-xs mb-0.5">Submission Error</p>
                  <p className="text-xs text-rose-300 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Row 1: Category & Unit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-4 py-3 rounded-xl flex items-center justify-between hover:border-teal-500/50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-sm"
                >
                  <span className="flex items-center gap-2">
                    {SelectedIcon && <SelectedIcon className="w-4 h-4 text-teal-400" />}
                    {selectedCategory ? selectedCategory.label : 'Select an issue category'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#111827] border border-[#1F2937] rounded-xl shadow-xl overflow-hidden z-20">
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            type="button"
                            key={cat.value}
                            onClick={() => {
                              setCategory(cat.value);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-[#1F2937] transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {cat.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Location / Unit *
                </label>
                <input
                  type="text"
                  required
                  value={locationUnit}
                  onChange={(e) => setLocationUnit(e.target.value)}
                  placeholder="e.g. A-402, Tower A"
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 placeholder:text-slate-500 transition-colors"
                />
              </div>
            </div>

            {/* Urgency Simulation / Defaults Banner */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Urgency Level
                </label>
                <p className="text-xs text-slate-400">Select urgency level for SLA prioritization.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('LOW')}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    priority === 'LOW'
                      ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'bg-[#1F2937] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Low
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('MEDIUM')}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    priority === 'MEDIUM'
                      ? 'bg-orange-600/20 border border-amber-500/30 text-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'bg-[#1F2937] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Medium
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('HIGH')}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    priority === 'HIGH'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'bg-[#1F2937] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  High
                </button>
              </div>
            </div>

            {/* Description / Summary */}
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Issue Summary *
              </label>
              <input
                type="text"
                required
                placeholder="Brief title (e.g. Broken elevator button in Lobby)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#111827] border border-[#1F2937] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description *
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide detailed information about the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1F2937] text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 placeholder:text-slate-500 transition-colors resize-none"
                />
                <span className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-medium">
                  {description.length}/500 characters
                </span>
              </div>
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Attachments (Optional)
              </label>
              
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />

              {!photoUrl ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? 'border-teal-500 bg-teal-500/10' 
                      : 'border-[#374151] bg-[#111827] hover:bg-[#1F2937]/50 hover:border-teal-500/50'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-teal-400 mx-auto mb-3" />
                  <p className="text-sm text-white font-medium mb-1">
                    Upload a file or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
              ) : (
                <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#1F2937]">
                      <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Attached Successfully
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{photoFileName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-sm font-bold text-slate-400 hover:text-white px-4 py-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-bold px-8 py-3 rounded-xl shadow-lg shadow-teal-500/20 border border-teal-500/50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
