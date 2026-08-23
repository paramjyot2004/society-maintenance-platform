export type UserRole = 'RESIDENT' | 'ADMIN' | 'TECHNICIAN';

export type ComplaintCategory = 
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'ELEVATOR'
  | 'SECURITY'
  | 'CARPENTRY'
  | 'SANITATION'
  | 'LANDSCAPING'
  | 'CIVIL_WORK'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'ASSIGNED'
  | 'CLOSED';

export interface ComplaintComment {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: string;
  isInternal?: boolean;
}

export interface ComplaintStatusHistory {
  id: string;
  complaintId: string;
  previousStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  actor: {
    id: string;
    name: string;
    role: UserRole;
  };
  timestamp: string;
  note?: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  unitNumber: string;
  tower: string;
  residentName: string;
  residentContact: string;
  userId?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  scheduledSlot?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  staffContact?: string;
  estimatedResolution?: string;
  resolutionNotes?: string;
  resolutionPhotoUrl?: string;
  rating?: number;
  feedback?: string;
  statusHistory: ComplaintStatusHistory[];
  comments: ComplaintComment[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  category: ComplaintCategory;
  phone: string;
  rating: number;
  activeTickets: number;
  isAvailable: boolean;
  avatar: string;
}

export type NoticeCategory = 'GENERAL' | 'MAINTENANCE' | 'EMERGENCY' | 'EVENT' | 'RULE';
export type NoticePriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  date: string;
  author: string;
  authorRole: string;
  targetAudience: string;
  isPinned: boolean;
  isImportant?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoticeInput {
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  targetAudience?: string;
  isPinned?: boolean;
  isImportant?: boolean;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  category?: NoticeCategory;
  priority?: NoticePriority;
  targetAudience?: string;
  isPinned?: boolean;
  isImportant?: boolean;
}

export interface NoticeFilters {
  category?: string;
  searchQuery?: string;
  importantOnly?: boolean;
}

export interface MaintenanceBill {
  id: string;
  unitNumber: string;
  residentName: string;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidDate?: string;
  transactionId?: string;
  paymentMethod?: string;
  breakdown: {
    maintenanceCharge: number;
    sinkingFund: number;
    waterCharge: number;
    parkingCharge: number;
    securityCharge: number;
    tax: number;
  };
}

export interface SocietyUnit {
  id: string;
  unitNumber: string;
  tower: string;
  floor: number;
  ownerName: string;
  tenantName?: string;
  occupancyType: 'OWNER_OCCUPIED' | 'RENTED' | 'VACANT';
  contact: string;
  email: string;
  dueAmount: number;
  dueStatus: 'CLEAR' | 'PENDING' | 'OVERDUE';
}

export interface AdminSettings {
  overdueThresholdDays: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ComplaintOverdueInfo {
  isOverdue: boolean;
  daysOpen: number;
  daysOverdue: number;
  thresholdDays: number;
  isResolved: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  unitNumber: string;
  tower: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface AdminDashboardStats {
  totalComplaints: number;
  byStatus: {
    OPEN: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    openPercentage: number;
    inProgressPercentage: number;
    resolvedPercentage: number;
  };
  byCategory: Record<ComplaintCategory, {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    active: number;
    percentage: number;
  }>;
  byPriority: {
    LOW: { total: number; active: number; resolved: number };
    MEDIUM: { total: number; active: number; resolved: number };
    HIGH: { total: number; active: number; resolved: number };
  };
  overdue: {
    overdueThresholdDays: number;
    overdueCount: number;
    overdueComplaints: Array<{
      id: string;
      ticketNumber: string;
      title: string;
      category: ComplaintCategory;
      priority: ComplaintPriority;
      status: ComplaintStatus;
      residentName: string;
      unitNumber: string;
      tower: string;
      daysOpen: number;
      daysOverdue: number;
      createdAt: string;
    }>;
  };
  summary: {
    resolutionRate: number;
    urgentActiveCount: number;
    avgResolutionHours: number;
    avgResolutionDays: number;
    slaComplianceRate: number;
    activeTicketsCount: number;
    overdueThresholdDays: number;
    totalResolvedCount: number;
    totalComplaints: number;
  };
  recentComplaints?: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: ComplaintStatus;
    priority: ComplaintPriority;
    category: ComplaintCategory;
    residentName: string;
    unitNumber: string;
    tower: string;
    createdAt: string;
  }>;
  generatedAt?: string;
}

