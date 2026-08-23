import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintPriority, 
  ComplaintStatus, 
  ComplaintStatusHistory, 
  CurrentUser,
  AdminSettings,
  ComplaintOverdueInfo,
  AdminDashboardStats
} from '../types';
import { getStoredToken } from './authService';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  overdueThresholdDays: 3,
};

const SETTINGS_STORAGE_KEY = 'oakwood_admin_settings';

/**
 * Authorization Guard: Ensures that only users with the ADMIN role can execute admin complaint operations.
 */
export function assertAdminAuthorization(actor: CurrentUser): void {
  if (actor.role !== 'ADMIN') {
    throw new Error('403 Forbidden: Residents and Technicians are not authorized to perform Admin complaint management actions.');
  }
}

/**
 * Server-side Admin Settings API: Fetch system admin settings including overdue threshold
 */
export function getAdminSettings(actor: CurrentUser): { success: boolean; data: AdminSettings; error?: string } {
  try {
    assertAdminAuthorization(actor);
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.overdueThresholdDays === 'number' && parsed.overdueThresholdDays > 0) {
        return { success: true, data: parsed };
      }
    }
    return { success: true, data: DEFAULT_ADMIN_SETTINGS };
  } catch (err: unknown) {
    return { success: false, data: DEFAULT_ADMIN_SETTINGS, error: (err as Error).message };
  }
}

/**
 * Server-side Admin Settings API: Update the configurable overdue threshold in days
 */
export function updateAdminOverdueThreshold(
  actor: CurrentUser,
  thresholdDays: number
): { success: boolean; data?: AdminSettings; error?: string } {
  try {
    assertAdminAuthorization(actor);

    const parsedDays = Math.round(Number(thresholdDays));
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      throw new Error('Invalid threshold: Overdue threshold must be a valid integer between 1 and 365 days.');
    }

    const currentRes = getAdminSettings(actor);
    const newSettings: AdminSettings = {
      ...(currentRes.data || DEFAULT_ADMIN_SETTINGS),
      overdueThresholdDays: parsedDays,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.name,
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    return { success: true, data: newSettings };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Server-side Overdue Derivation: Authoritative calculation of whether a complaint is overdue.
 * Rules:
 * - Resolved/Closed complaints are NEVER overdue regardless of age.
 * - Unresolved complaints older than or equal to thresholdDays are overdue.
 * - Dynamic derivation prevents permanent stale flag mutations.
 */
export function deriveComplaintOverdueStatus(
  complaint: Complaint,
  thresholdDays: number = 3,
  referenceDateMs: number = Date.now()
): ComplaintOverdueInfo {
  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';
  
  if (isResolved) {
    // Resolved complaints must NEVER be considered overdue
    const createdMs = new Date(complaint.createdAt).getTime();
    const resolvedMs = complaint.resolvedAt ? new Date(complaint.resolvedAt).getTime() : createdMs;
    const daysOpen = Math.max(0, Math.floor((resolvedMs - createdMs) / 86400000));
    return {
      isOverdue: false,
      daysOpen,
      daysOverdue: 0,
      thresholdDays,
      isResolved: true,
    };
  }

  const createdMs = new Date(complaint.createdAt).getTime();
  // Calculate total elapsed milliseconds since creation
  const ageMs = Math.max(0, referenceDateMs - createdMs);
  const elapsedDaysExact = ageMs / 86400000;
  const daysOpen = Math.floor(elapsedDaysExact);

  // Check if age exceeds or equals the configured threshold
  const isOverdue = elapsedDaysExact >= thresholdDays;
  const daysOverdue = isOverdue ? Math.max(1, Math.floor(elapsedDaysExact - thresholdDays) + 1) : 0;

  return {
    isOverdue,
    daysOpen,
    daysOverdue,
    thresholdDays,
    isResolved: false,
  };
}

export interface AdminComplaintFilters {
  category?: string;
  status?: string; // 'ALL' | 'OVERDUE' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  date?: string; // YYYY-MM-DD
  searchQuery?: string;
  overdueOnly?: boolean;
}

export interface AdminComplaintsResult {
  success: boolean;
  data?: Complaint[];
  overdueCount?: number;
  totalCount?: number;
  openCount?: number;
  inProgressCount?: number;
  resolvedCount?: number;
  thresholdDays?: number;
  error?: string;
}

/**
 * Admin API: Fetch all society complaints with multi-criteria filtering and server-side overdue prioritization.
 * Requirement: Overdue complaints MUST appear at the top of the admin complaint view.
 */
export function getAdminComplaints(
  actor: CurrentUser,
  complaints: Complaint[],
  filters?: AdminComplaintFilters,
  configuredThreshold?: number
): AdminComplaintsResult {
  try {
    assertAdminAuthorization(actor);

    // Resolve authoritative threshold
    let thresholdDays = configuredThreshold;
    if (!thresholdDays || thresholdDays < 1) {
      const settingsRes = getAdminSettings(actor);
      thresholdDays = settingsRes.data?.overdueThresholdDays || DEFAULT_ADMIN_SETTINGS.overdueThresholdDays;
    }

    const now = Date.now();
    let result = [...complaints];

    // Compute overall overdue counts for society-wide metrics
    const overdueCount = complaints.filter(c => deriveComplaintOverdueStatus(c, thresholdDays, now).isOverdue).length;
    const totalCount = complaints.length;
    const openCount = complaints.filter(c => c.status === 'OPEN' || c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' || c.status === 'ASSIGNED').length;
    const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
    const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

    if (filters) {
      const { category, status, date, searchQuery, overdueOnly } = filters;

      // Filter by category
      if (category && category !== 'ALL') {
        result = result.filter(c => c.category === category);
      }

      // Filter by overdue only
      if (overdueOnly) {
        result = result.filter(c => deriveComplaintOverdueStatus(c, thresholdDays, now).isOverdue);
      }

      // Filter by status (OVERDUE, OPEN, IN_PROGRESS, RESOLVED, or ALL)
      if (status && status !== 'ALL') {
        if (status === 'OVERDUE') {
          result = result.filter(c => deriveComplaintOverdueStatus(c, thresholdDays, now).isOverdue);
        } else if (status === 'OPEN') {
          result = result.filter(c => c.status === 'OPEN' || c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' || c.status === 'ASSIGNED');
        } else if (status === 'IN_PROGRESS') {
          result = result.filter(c => c.status === 'IN_PROGRESS');
        } else if (status === 'RESOLVED') {
          result = result.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');
        } else {
          result = result.filter(c => c.status === status);
        }
      }

      // Filter by date (matches creation date formatted YYYY-MM-DD)
      if (date && date !== 'ALL' && date.trim() !== '') {
        result = result.filter(c => {
          const complaintDate = new Date(c.createdAt).toISOString().split('T')[0];
          return complaintDate === date;
        });
      }

      // Filter by search query
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter(c => 
          c.ticketNumber.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.residentName.toLowerCase().includes(query) ||
          c.unitNumber.toLowerCase().includes(query)
        );
      }
    }

    // SERVER-SIDE SORTING: Overdue complaints MUST appear at the top of the admin complaint view.
    result.sort((a, b) => {
      const overdueA = deriveComplaintOverdueStatus(a, thresholdDays, now);
      const overdueB = deriveComplaintOverdueStatus(b, thresholdDays, now);

      // 1. Overdue complaints at the very top
      if (overdueA.isOverdue && !overdueB.isOverdue) return -1;
      if (!overdueA.isOverdue && overdueB.isOverdue) return 1;

      // 2. Among overdue complaints: sort by most overdue (highest daysOpen first)
      if (overdueA.isOverdue && overdueB.isOverdue) {
        return overdueB.daysOpen - overdueA.daysOpen;
      }

      // 3. Among non-overdue unresolved complaints vs resolved
      const isResolvedA = a.status === 'RESOLVED' || a.status === 'CLOSED';
      const isResolvedB = b.status === 'RESOLVED' || b.status === 'CLOSED';

      if (!isResolvedA && isResolvedB) return -1;
      if (isResolvedA && !isResolvedB) return 1;

      // 4. Default: Newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { 
      success: true, 
      data: result,
      overdueCount,
      totalCount,
      openCount,
      inProgressCount,
      resolvedCount,
      thresholdDays
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Admin API: Update complaint status (OPEN -> IN_PROGRESS -> RESOLVED)
 * Every status change MUST create a new ComplaintStatusHistory record with actor, timestamp, note.
 * When status is RESOLVED, the complaint is considered closed.
 */
export function updateComplaintStatusByAdmin(
  actor: CurrentUser,
  complaintId: string,
  newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
  note?: string,
  complaints: Complaint[] = []
): { success: boolean; data?: Complaint; newHistory?: ComplaintStatusHistory; error?: string } {
  try {
    assertAdminAuthorization(actor);

    const targetIndex = complaints.findIndex(c => c.id === complaintId);
    if (targetIndex === -1) {
      throw new Error(`Complaint with ID ${complaintId} not found.`);
    }

    const currentComplaint = complaints[targetIndex];
    const previousStatus = currentComplaint.status;

    // Build the mandatory ComplaintStatusHistory record
    const historyEntry: ComplaintStatusHistory = {
      id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      complaintId: currentComplaint.id,
      previousStatus: previousStatus,
      newStatus: newStatus,
      actor: {
        id: actor.id,
        name: actor.name,
        role: actor.role,
      },
      timestamp: new Date().toISOString(),
      note: note?.trim() ? note.trim() : undefined,
    };

    const isResolved = newStatus === 'RESOLVED';
    const now = new Date().toISOString();

    const updatedComplaint: Complaint = {
      ...currentComplaint,
      status: newStatus,
      updatedAt: now,
      resolvedAt: isResolved ? now : currentComplaint.resolvedAt,
      resolutionNotes: isResolved && note?.trim() ? note.trim() : currentComplaint.resolutionNotes,
      statusHistory: [...(currentComplaint.statusHistory || []), historyEntry],
      comments: [
        ...(currentComplaint.comments || []),
        {
          id: `c_${Date.now()}`,
          author: actor.name,
          role: actor.role,
          text: note?.trim() 
            ? `Status changed from ${previousStatus} to ${newStatus}. Note: "${note.trim()}"`
            : `Status changed from ${previousStatus} to ${newStatus}.`,
          timestamp: now,
          isInternal: false,
        }
      ]
    };

    return { 
      success: true, 
      data: updatedComplaint, 
      newHistory: historyEntry 
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Admin API: Set priority on a complaint (LOW, MEDIUM, HIGH)
 */
export function setComplaintPriorityByAdmin(
  actor: CurrentUser,
  complaintId: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH',
  complaints: Complaint[]
): { success: boolean; data?: Complaint; error?: string } {
  try {
    assertAdminAuthorization(actor);

    const targetIndex = complaints.findIndex(c => c.id === complaintId);
    if (targetIndex === -1) {
      throw new Error(`Complaint with ID ${complaintId} not found.`);
    }

    const currentComplaint = complaints[targetIndex];
    const now = new Date().toISOString();

    const updatedComplaint: Complaint = {
      ...currentComplaint,
      priority: priority as ComplaintPriority,
      updatedAt: now,
      comments: [
        ...(currentComplaint.comments || []),
        {
          id: `c_${Date.now()}`,
          author: actor.name,
          role: actor.role,
          text: `Priority updated to ${priority} by Administrator.`,
          timestamp: now,
          isInternal: false,
        }
      ]
    };

    return { success: true, data: updatedComplaint };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Admin API: Retrieve complete status history for a given complaint
 */
export function getComplaintStatusHistory(
  actor: CurrentUser,
  complaintId: string,
  complaints: Complaint[]
): { success: boolean; data?: ComplaintStatusHistory[]; error?: string } {
  try {
    assertAdminAuthorization(actor);

    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) {
      throw new Error(`Complaint with ID ${complaintId} not found.`);
    }

    return { 
      success: true, 
      data: complaint.statusHistory || [] 
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Server API: Fetch all society complaints for Admin from backend
 */
export async function fetchAdminComplaintsFromServer(
  filters?: AdminComplaintFilters
): Promise<{
  success: boolean;
  data: Complaint[];
  overdueCount?: number;
  totalCount?: number;
  openCount?: number;
  inProgressCount?: number;
  resolvedCount?: number;
  thresholdDays?: number;
  error?: string;
  code?: string;
}> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') {
      queryParams.set('category', filters.category);
    }
    if (filters?.status && filters.status !== 'ALL') {
      queryParams.set('status', filters.status);
    }
    if (filters?.date && filters.date !== 'ALL') {
      queryParams.set('date', filters.date);
    }
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      queryParams.set('search', filters.searchQuery.trim());
    }

    const url = `/api/admin/complaints${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, { method: 'GET', headers });
    const json = await res.json();

    if (!res.ok || !json.success) {
      return {
        success: false,
        data: [],
        error: json.error || 'Failed to fetch admin complaints.',
        code: json.code
      };
    }

    const normalized: Complaint[] = (json.complaints || []).map((c: any) => ({
      id: c.id,
      ticketNumber: c.ticketNumber,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      unitNumber: c.user?.unitNumber || c.unitNumber || 'Unit 402',
      tower: c.user?.tower || c.tower || 'Tower A',
      residentName: c.user?.name || c.residentName || 'Resident',
      residentContact: c.user?.phone || c.residentContact || '',
      photoUrl: c.photoUrl || undefined,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
      updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : new Date(c.updatedAt).toISOString(),
      resolvedAt: c.resolvedAt ? (typeof c.resolvedAt === 'string' ? c.resolvedAt : new Date(c.resolvedAt).toISOString()) : undefined,
      resolutionNotes: c.resolutionNotes || undefined,
      resolutionPhotoUrl: c.resolutionPhotoUrl || undefined,
      statusHistory: (c.statusHistory || []).map((h: any) => ({
        id: h.id,
        complaintId: h.complaintId || c.id,
        previousStatus: h.previousStatus || undefined,
        newStatus: h.newStatus,
        actor: {
          id: h.actor?.id || h.actorId,
          name: h.actor?.name || h.actorName || 'Administrator',
          role: h.actor?.role || h.actorRole || 'ADMIN'
        },
        timestamp: typeof h.timestamp === 'string' ? h.timestamp : new Date(h.timestamp).toISOString(),
        note: h.note || undefined
      })),
      comments: []
    }));

    return {
      success: true,
      data: normalized,
      overdueCount: json.overdueCount,
      totalCount: json.totalCount ?? json.total,
      openCount: json.openCount,
      inProgressCount: json.inProgressCount,
      resolvedCount: json.resolvedCount,
      thresholdDays: json.thresholdDays
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message || 'Network error fetching admin complaints.'
    };
  }
}

/**
 * Server API: Fetch system admin settings (including COMPLAINT_OVERDUE_DAYS) from server
 */
export async function fetchAdminSettingsFromServer(): Promise<{ success: boolean; data?: AdminSettings; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/admin/settings/overdue-threshold', {
      method: 'GET',
      headers
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to fetch admin settings from server.'
      };
    }

    const settings: AdminSettings = {
      overdueThresholdDays: json.overdueThresholdDays || 3,
      updatedAt: json.updatedAt,
      updatedBy: json.updatedBy
    };

    // Keep local cache updated
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    return {
      success: true,
      data: settings
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error fetching admin settings.'
    };
  }
}

/**
 * Server API: Update COMPLAINT_OVERDUE_DAYS in Prisma AppSetting on server
 */
export async function updateAdminOverdueThresholdOnServer(
  thresholdDays: number
): Promise<{ success: boolean; data?: AdminSettings; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/admin/settings/overdue-threshold', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ thresholdDays })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to update overdue threshold on server.'
      };
    }

    const newSettings: AdminSettings = {
      overdueThresholdDays: json.overdueThresholdDays,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));

    return {
      success: true,
      data: newSettings
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error updating overdue threshold on server.'
    };
  }
}

/**
 * Server API: Update complaint status by Admin on backend
 */
export async function updateComplaintStatusOnServer(
  complaintId: string,
  newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED',
  note?: string
): Promise<{ success: boolean; complaint?: Complaint; newHistory?: ComplaintStatusHistory; error?: string; code?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/admin/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: newStatus, note })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to update complaint status on server.',
        code: json.code
      };
    }

    const c = json.complaint;
    const formattedComplaint: Complaint = {
      id: c.id,
      ticketNumber: c.ticketNumber,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      unitNumber: c.user?.unitNumber || c.unitNumber || 'Unit 402',
      tower: c.user?.tower || c.tower || 'Tower A',
      residentName: c.user?.name || c.residentName || 'Resident',
      residentContact: c.user?.phone || c.residentContact || '',
      photoUrl: c.photoUrl || undefined,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
      updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : new Date(c.updatedAt).toISOString(),
      resolvedAt: c.resolvedAt ? (typeof c.resolvedAt === 'string' ? c.resolvedAt : new Date(c.resolvedAt).toISOString()) : undefined,
      resolutionNotes: c.resolutionNotes || undefined,
      resolutionPhotoUrl: c.resolutionPhotoUrl || undefined,
      statusHistory: (c.statusHistory || []).map((h: any) => ({
        id: h.id,
        complaintId: h.complaintId || c.id,
        previousStatus: h.previousStatus || undefined,
        newStatus: h.newStatus,
        actor: {
          id: h.actor?.id || h.actorId,
          name: h.actor?.name || h.actorName || 'Administrator',
          role: h.actor?.role || h.actorRole || 'ADMIN'
        },
        timestamp: typeof h.timestamp === 'string' ? h.timestamp : new Date(h.timestamp).toISOString(),
        note: h.note || undefined
      })),
      comments: []
    };

    return {
      success: true,
      complaint: formattedComplaint,
      newHistory: json.newHistory
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error updating complaint status.'
    };
  }
}

/**
 * Server API: Update complaint priority by Admin on backend
 */
export async function updateComplaintPriorityOnServer(
  complaintId: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<{ success: boolean; complaint?: Complaint; error?: string; code?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/admin/complaints/${complaintId}/priority`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ priority })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to update complaint priority on server.',
        code: json.code
      };
    }

    const c = json.complaint;
    const formattedComplaint: Complaint = {
      id: c.id,
      ticketNumber: c.ticketNumber,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      unitNumber: c.user?.unitNumber || c.unitNumber || 'Unit 402',
      tower: c.user?.tower || c.tower || 'Tower A',
      residentName: c.user?.name || c.residentName || 'Resident',
      residentContact: c.user?.phone || c.residentContact || '',
      photoUrl: c.photoUrl || undefined,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
      updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : new Date(c.updatedAt).toISOString(),
      resolvedAt: c.resolvedAt ? (typeof c.resolvedAt === 'string' ? c.resolvedAt : new Date(c.resolvedAt).toISOString()) : undefined,
      resolutionNotes: c.resolutionNotes || undefined,
      resolutionPhotoUrl: c.resolutionPhotoUrl || undefined,
      statusHistory: (c.statusHistory || []).map((h: any) => ({
        id: h.id,
        complaintId: h.complaintId || c.id,
        previousStatus: h.previousStatus || undefined,
        newStatus: h.newStatus,
        actor: {
          id: h.actor?.id || h.actorId,
          name: h.actor?.name || h.actorName || 'Administrator',
          role: h.actor?.role || h.actorRole || 'ADMIN'
        },
        timestamp: typeof h.timestamp === 'string' ? h.timestamp : new Date(h.timestamp).toISOString(),
        note: h.note || undefined
      })),
      comments: []
    };

    return {
      success: true,
      complaint: formattedComplaint
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error updating complaint priority.'
    };
  }
}

/**
 * Server API: Fetch Authoritative Admin Dashboard Statistics & Analytics (Protected by Admin Auth)
 */
export async function fetchAdminDashboardStatsFromServer(): Promise<{
  success: boolean;
  stats?: AdminDashboardStats;
  error?: string;
  code?: string;
}> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/admin/dashboard/stats', {
      method: 'GET',
      headers
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to fetch Admin Dashboard statistics from server.',
        code: json.code
      };
    }

    return {
      success: true,
      stats: json.stats
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error fetching Admin Dashboard statistics.'
    };
  }
}

