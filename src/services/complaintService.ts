import { Complaint, ComplaintCategory } from '../types';
import { getStoredToken } from './authService';

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  photoUrl?: string;
}

export interface ComplaintApiResponse {
  success: boolean;
  message?: string;
  complaint?: Complaint;
  complaints?: Complaint[];
  error?: string;
  code?: string;
}

export interface PhotoUploadStatusResponse {
  success: boolean;
  uploadAvailable: boolean;
  provider: string;
  message: string;
}

/**
 * Check photo upload availability
 */
export async function checkPhotoUploadStatus(): Promise<PhotoUploadStatusResponse> {
  try {
    const res = await fetch('/api/uploads/status');
    if (!res.ok) {
      return {
        success: false,
        uploadAvailable: false,
        provider: 'none',
        message: 'Could not connect to photo upload service.'
      };
    }
    return await res.json();
  } catch {
    return {
      success: false,
      uploadAvailable: false,
      provider: 'none',
      message: 'Photo upload service is currently unavailable.'
    };
  }
}

/**
 * Fetch complaints belonging ONLY to the authenticated resident
 * Gracefully falls back to local data when unauthenticated (Demo / Preview mode)
 */
export async function fetchResidentComplaints(): Promise<{ success: boolean; data: Complaint[]; error?: string }> {
  try {
    const token = getStoredToken();
    
    // If no JWT token is stored in the browser (e.g. initial preview / demo session),
    // load resident complaints from local storage or mock dataset so the UI renders smoothly.
    if (!token) {
      const saved = localStorage.getItem('oakwood_complaints');
      const allComplaints: Complaint[] = saved ? JSON.parse(saved) : [];
      
      // Return complaints for Sarah Jenkins / unit A-402 in demo mode
      const demoComplaints = allComplaints.filter(c => 
        c.unitNumber === 'A-402' || 
        c.unitNumber === 'Unit 402' || 
        c.residentName === 'Sarah Jenkins' ||
        c.unitNumber?.includes('402')
      );

      return {
        success: true,
        data: demoComplaints
      };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const res = await fetch('/api/complaints', {
      method: 'GET',
      headers
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      // If 401 token invalid/expired, fall back to local demo complaints gracefully
      if (res.status === 401) {
        localStorage.removeItem('oakwood_auth_token');
        const saved = localStorage.getItem('oakwood_complaints');
        const allComplaints: Complaint[] = saved ? JSON.parse(saved) : [];
        const demoComplaints = allComplaints.filter(c => 
          c.unitNumber === 'A-402' || 
          c.residentName === 'Sarah Jenkins' ||
          c.unitNumber?.includes('402')
        );
        return {
          success: true,
          data: demoComplaints
        };
      }

      return {
        success: false,
        data: [],
        error: data.error || 'Failed to load complaints from server.'
      };
    }

    // Normalize complaint format
    const normalized: Complaint[] = (data.complaints || []).map((c: any) => ({
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
          name: h.actor?.name || h.actorName || 'Resident',
          role: h.actor?.role || h.actorRole || 'RESIDENT'
        },
        timestamp: typeof h.timestamp === 'string' ? h.timestamp : new Date(h.timestamp).toISOString(),
        note: h.note || undefined
      })),
      comments: []
    }));

    return {
      success: true,
      data: normalized
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message || 'Failed to connect to complaints API.'
    };
  }
}

/**
 * Submit a new resident complaint
 * Note: Never sends residentId/userId or status/priority; server assigns status=OPEN, priority=MEDIUM, actorId=authenticated resident
 */
export async function createResidentComplaint(input: CreateComplaintInput): Promise<{ success: boolean; data?: Complaint; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: input.category,
        photoUrl: input.photoUrl || null
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to submit complaint.'
      };
    }

    const c = data.complaint;
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
      statusHistory: (c.statusHistory || []).map((h: any) => ({
        id: h.id,
        complaintId: h.complaintId || c.id,
        previousStatus: h.previousStatus || undefined,
        newStatus: h.newStatus,
        actor: {
          id: h.actor?.id || h.actorId,
          name: h.actor?.name || h.actorName || 'Resident',
          role: h.actor?.role || h.actorRole || 'RESIDENT'
        },
        timestamp: typeof h.timestamp === 'string' ? h.timestamp : new Date(h.timestamp).toISOString(),
        note: h.note || undefined
      })),
      comments: []
    };

    return {
      success: true,
      data: formattedComplaint
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while creating complaint.'
    };
  }
}

/**
 * Fetch a single complaint by ID with its status history
 */
export async function fetchResidentComplaintById(id: string): Promise<{ success: boolean; data?: Complaint; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/complaints/${id}`, {
      method: 'GET',
      headers
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to fetch complaint details.'
      };
    }

    const c = data.complaint;
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
          name: h.actor?.name || h.actorName || 'Resident',
          role: h.actor?.role || h.actorRole || 'RESIDENT'
        },
        timestamp: typeof h.timestamp === 'string' ? h.timestamp : new Date(h.timestamp).toISOString(),
        note: h.note || undefined
      })),
      comments: []
    };

    return {
      success: true,
      data: formattedComplaint
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error fetching complaint.'
    };
  }
}
