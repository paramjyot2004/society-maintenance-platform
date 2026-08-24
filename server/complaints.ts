import { Request, Response } from 'express';
import { prisma, getPrisma } from './db';
import { AuthenticatedRequest } from './auth';
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@prisma/client';
import { sendComplaintStatusChangeEmail } from './email';

export interface StaffMemberData {
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

export const SERVER_STAFF_MEMBERS: StaffMemberData[] = [
  {
    id: 'staff_1',
    name: 'David Miller',
    role: 'Lead Plumber & Piping Specialist',
    category: 'PLUMBING',
    phone: '+1 (555) 432-7711',
    rating: 4.9,
    activeTickets: 2,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_2',
    name: 'Marcus Vance',
    role: 'Certified Master Electrician',
    category: 'ELECTRICAL',
    phone: '+1 (555) 678-2234',
    rating: 4.8,
    activeTickets: 3,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_3',
    name: 'Elena Rostova',
    role: 'Elevator & Heavy Equipment Tech',
    category: 'ELEVATOR',
    phone: '+1 (555) 912-3345',
    rating: 4.95,
    activeTickets: 1,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_4',
    name: 'Carlos Mendez',
    role: 'Civil & Carpentry Lead',
    category: 'CARPENTRY',
    phone: '+1 (555) 345-9988',
    rating: 4.7,
    activeTickets: 0,
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'staff_5',
    name: 'Samuel Jackson',
    role: 'Sanitation & Pest Control Supervisor',
    category: 'SANITATION',
    phone: '+1 (555) 789-0012',
    rating: 4.85,
    activeTickets: 1,
    isAvailable: false,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  }
];

export async function getStaffMembersHandler(req: Request, res: Response) {
  return res.json({
    success: true,
    staff: SERVER_STAFF_MEMBERS
  });
}

// In-memory complaint store fallback when DATABASE_URL/Postgres is offline
interface MemoryComplaint {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  photoUrl?: string | null;
  userId: string;
  unitNumber: string;
  tower: string;
  residentName: string;
  residentContact: string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  staffContact?: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
  resolutionNotes?: string | null;
  resolutionPhotoUrl?: string | null;
  statusHistory: Array<{
    id: string;
    complaintId: string;
    previousStatus: ComplaintStatus | null;
    newStatus: ComplaintStatus;
    actorId: string;
    actorName: string;
    actorRole: string;
    note: string | null;
    timestamp: Date;
  }>;
}

const memoryComplaints: MemoryComplaint[] = [];
let ticketCounter = 1000;
let memoryOverdueDays = 3;

function generateTicketNumber(): string {
  ticketCounter += 1;
  return `CMP-${ticketCounter}`;
}

export interface ServerOverdueInfo {
  isOverdue: boolean;
  daysOpen: number;
  daysOverdue: number;
  thresholdDays: number;
  isResolved: boolean;
}

/**
 * Server-side Overdue Derivation:
 * Requirements:
 * - RESOLVED complaints are NEVER overdue regardless of creation age.
 * - An unresolved complaint is overdue when age exceeds or equals the configured threshold in days.
 * - Dynamic derivation prevents permanent stale flag mutations.
 */
export function deriveServerComplaintOverdue(
  complaint: { status: string; createdAt: Date | string; resolvedAt?: Date | string | null; updatedAt?: Date | string },
  thresholdDays: number = 3,
  referenceDateMs: number = Date.now()
): ServerOverdueInfo {
  const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'CLOSED';

  if (isResolved) {
    const createdMs = new Date(complaint.createdAt).getTime();
    const resolvedMs = complaint.resolvedAt 
      ? new Date(complaint.resolvedAt).getTime() 
      : (complaint.updatedAt ? new Date(complaint.updatedAt).getTime() : createdMs);
    const daysOpen = Math.max(0, Math.floor((resolvedMs - createdMs) / 86400000));
    return {
      isOverdue: false,
      daysOpen,
      daysOverdue: 0,
      thresholdDays,
      isResolved: true
    };
  }

  const createdMs = new Date(complaint.createdAt).getTime();
  const ageMs = Math.max(0, referenceDateMs - createdMs);
  const elapsedDaysExact = ageMs / 86400000;
  const daysOpen = Math.floor(elapsedDaysExact);
  const isOverdue = elapsedDaysExact >= thresholdDays;
  const daysOverdue = isOverdue ? Math.max(1, Math.floor(elapsedDaysExact - thresholdDays) + 1) : 0;

  return {
    isOverdue,
    daysOpen,
    daysOverdue,
    thresholdDays,
    isResolved: false
  };
}

/**
 * Fetch COMPLAINT_OVERDUE_DAYS from Prisma AppSetting or fallback to in-memory store
 */
export async function getOverdueThresholdDays(): Promise<number> {
  const dbClient = getPrisma();
  if (dbClient) {
    try {
      const setting = await dbClient.appSetting.findUnique({
        where: { key: 'COMPLAINT_OVERDUE_DAYS' }
      });
      if (setting && setting.value) {
        const val = parseInt(setting.value, 10);
        if (!isNaN(val) && val > 0) {
          memoryOverdueDays = val;
          return val;
        }
      }
    } catch (err) {
      console.warn('[DB] Failed to fetch COMPLAINT_OVERDUE_DAYS from Prisma, using fallback:', err);
    }
  }
  return memoryOverdueDays;
}

/**
 * Save COMPLAINT_OVERDUE_DAYS in Prisma AppSetting and in-memory store
 */
export async function setOverdueThresholdDays(days: number, updatedBy?: string): Promise<number> {
  const parsedDays = Math.round(Number(days));
  if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
    throw new Error('Invalid threshold: Must be an integer between 1 and 365 days.');
  }

  memoryOverdueDays = parsedDays;
  const dbClient = getPrisma();
  if (dbClient) {
    try {
      await dbClient.appSetting.upsert({
        where: { key: 'COMPLAINT_OVERDUE_DAYS' },
        update: {
          value: parsedDays.toString(),
          description: 'Threshold in days before an unresolved complaint is marked overdue',
          updatedBy: updatedBy || 'Admin',
          updatedAt: new Date()
        },
        create: {
          key: 'COMPLAINT_OVERDUE_DAYS',
          value: parsedDays.toString(),
          description: 'Threshold in days before an unresolved complaint is marked overdue',
          updatedBy: updatedBy || 'Admin'
        }
      });
    } catch (err) {
      console.warn('[DB] Failed to upsert COMPLAINT_OVERDUE_DAYS in Prisma:', err);
    }
  }

  return parsedDays;
}

/**
 * Controller: Create Resident Complaint
 * Requirements:
 * - Must be authenticated with RESIDENT role (guarded by requireResident)
 * - NEVER accepts residentId or userId from the browser payload (derived from req.user.id)
 * - Status is unconditionally forced to OPEN
 * - Priority is set to MEDIUM (or validated against allowed values LOW, MEDIUM, HIGH)
 * - Creates an initial ComplaintStatusHistory record with actorId = authenticated resident, timestamp = now
 */
export async function createResidentComplaintHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to file a complaint.',
        code: 'UNAUTHENTICATED'
      });
    }

    const { title, description, category, photoUrl } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Complaint title is required.'
      });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Complaint description is required.'
      });
    }

    // Validate Category
    const allowedCategories: ComplaintCategory[] = [
      'PLUMBING',
      'ELECTRICAL',
      'ELEVATOR',
      'SECURITY',
      'CARPENTRY',
      'SANITATION',
      'LANDSCAPING',
      'CIVIL_WORK',
      'OTHER'
    ];

    const validCategory = allowedCategories.includes(category as ComplaintCategory)
      ? (category as ComplaintCategory)
      : 'OTHER';

    // Enforcement: Initial status must be OPEN, priority must be MEDIUM
    const initialStatus: ComplaintStatus = 'OPEN';
    const initialPriority: ComplaintPriority = 'MEDIUM';
    const now = new Date();
    const cleanPhotoUrl = (photoUrl && typeof photoUrl === 'string' && photoUrl.trim()) ? photoUrl.trim() : null;

    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable. DATABASE_URL is required.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const ticketNumber = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;

      const createdComplaint = await dbClient.complaint.create({
        data: {
          ticketNumber,
          title: title.trim(),
          description: description.trim(),
          category: validCategory,
          priority: initialPriority,
          status: initialStatus,
          photoUrl: cleanPhotoUrl,
          unitNumber: user.unitNumber || 'Unit 402',
          tower: user.tower || 'Tower A',
          residentName: user.name || 'Resident',
          residentContact: user.phone || user.email || 'N/A',
          userId: user.id, // Derived strictly from server session
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: initialStatus,
              actorId: user.id, // Authenticated resident actor
              actorName: user.name || 'Resident',
              actorRole: user.role || 'RESIDENT',
              note: 'Complaint registered by resident',
              timestamp: now
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              unitNumber: true,
              tower: true,
              phone: true
            }
          },
          statusHistory: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully.',
        complaint: createdComplaint
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma create complaint failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to save complaint to PostgreSQL database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create complaint. Please try again.'
    });
  }
}

/**
 * Controller: Get Resident's Own Complaints
 * Requirements:
 * - Must be authenticated with RESIDENT role
 * - Returns ONLY complaints belonging to the authenticated resident (userId === req.user.id)
 */
export async function getResidentComplaintsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const userComplaints = await dbClient.complaint.findMany({
        where: {
          userId: user.id // STRICT ISOLATION: View ONLY own complaints
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              unitNumber: true,
              tower: true,
              phone: true
            }
          },
          statusHistory: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.json({
        success: true,
        complaints: userComplaints
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma findMany resident complaints failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve resident complaints from database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error fetching resident complaints:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch complaints.'
    });
  }
}

/**
 * Controller: Get Single Complaint Details & Status History
 * Requirements:
 * - Must be authenticated
 * - If resident: must belong to the resident (userId === req.user.id)
 * - Returns complete status history
 */
export async function getResidentComplaintByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const complaint = await dbClient.complaint.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              unitNumber: true,
              tower: true,
              phone: true
            }
          },
          statusHistory: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        }
      });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          error: 'Complaint not found.'
        });
      }

      // Security check: residents can ONLY access their own complaints
      if (user.role === 'RESIDENT' && complaint.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view your own complaints.',
          code: 'FORBIDDEN_OWN_ONLY'
        });
      }

      return res.json({
        success: true,
        complaint
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma findUnique complaint failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve complaint from database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error fetching complaint by id:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve complaint.'
    });
  }
}

/**
 * Controller: Get All Complaints (Admin Only)
 * Requirements:
 * - Must be authenticated with ADMIN role (guarded by requireAdmin)
 * - Uses AppSetting COMPLAINT_OVERDUE_DAYS (server-side configured threshold)
 * - Calculates overdue status strictly server-side:
 *   - RESOLVED complaints are NEVER overdue
 *   - Unresolved complaints older than thresholdDays are overdue
 * - Overdue complaints are automatically sorted above non-overdue complaints
 * - Returns overdue count and SLA breakdown
 * - Supports filtering by category, status ('ALL' | 'OVERDUE' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'), date (YYYY-MM-DD), and search keyword
 */
export async function getAdminComplaintsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { category, status, date, search, priority, unit, resident, threshold } = req.query as {
      category?: string;
      status?: string;
      date?: string;
      search?: string;
      priority?: string;
      unit?: string;
      resident?: string;
      threshold?: string;
    };

    // 1. Resolve server-side threshold from AppSetting (or optional query override)
    let thresholdDays = await getOverdueThresholdDays();
    if (threshold && !isNaN(parseInt(threshold, 10)) && parseInt(threshold, 10) > 0) {
      thresholdDays = parseInt(threshold, 10);
    }

    const now = Date.now();
    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    let rawComplaints: any[] = [];

    try {
      const whereClause: any = {};

      // Filter by category
      if (category && category !== 'ALL') {
        whereClause.category = category as ComplaintCategory;
      }

      // Filter by priority / urgency
      if (priority && priority !== 'ALL') {
        whereClause.priority = priority as ComplaintPriority;
      }

      // Filter by standard DB status (for OVERDUE, we fetch unresolved and filter by server overdue math)
      if (status && status !== 'ALL' && status !== 'OVERDUE') {
        if (status === 'OPEN') {
          whereClause.status = 'OPEN';
        } else if (status === 'IN_PROGRESS') {
          whereClause.status = 'IN_PROGRESS';
        } else if (status === 'RESOLVED') {
          whereClause.status = 'RESOLVED';
        } else if (status === 'CLOSED') {
          whereClause.status = 'CLOSED';
        } else {
          whereClause.status = status as ComplaintStatus;
        }
      }

      // Filter by date (matches creation date)
      if (date && date !== 'ALL' && date.trim()) {
        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setUTCHours(23, 59, 59, 999);

        whereClause.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }

      // Search query across complaint ID, resident, unit, title, description
      if (search && search.trim()) {
        const s = search.trim();
        whereClause.OR = [
          { ticketNumber: { contains: s, mode: 'insensitive' } },
          { title: { contains: s, mode: 'insensitive' } },
          { description: { contains: s, mode: 'insensitive' } },
          { residentName: { contains: s, mode: 'insensitive' } },
          { residentContact: { contains: s, mode: 'insensitive' } },
          { unitNumber: { contains: s, mode: 'insensitive' } },
          { tower: { contains: s, mode: 'insensitive' } },
          { user: { is: { name: { contains: s, mode: 'insensitive' } } } },
          { user: { is: { email: { contains: s, mode: 'insensitive' } } } }
        ];
      }

      // Direct unit filter
      if (unit && unit !== 'ALL' && unit.trim()) {
        const u = unit.trim();
        whereClause.AND = [
          ...(whereClause.AND || []),
          {
            OR: [
              { unitNumber: { contains: u, mode: 'insensitive' } },
              { tower: { contains: u, mode: 'insensitive' } }
            ]
          }
        ];
      }

      // Direct resident filter
      if (resident && resident !== 'ALL' && resident.trim()) {
        const r = resident.trim();
        whereClause.AND = [
          ...(whereClause.AND || []),
          {
            OR: [
              { residentName: { contains: r, mode: 'insensitive' } },
              { residentContact: { contains: r, mode: 'insensitive' } },
              { user: { is: { name: { contains: r, mode: 'insensitive' } } } },
              { user: { is: { email: { contains: r, mode: 'insensitive' } } } }
            ]
          }
        ];
      }

      rawComplaints = await dbClient.complaint.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              unitNumber: true,
              tower: true,
              phone: true
            }
          },
          statusHistory: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma admin findMany complaints failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve admin complaints from PostgreSQL database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }

    // 2. Server-side Overdue calculation and enrichment
    let processedComplaints = rawComplaints.map(c => {
      const overdueInfo = deriveServerComplaintOverdue(c, thresholdDays, now);
      return {
        ...c,
        isOverdue: overdueInfo.isOverdue,
        overdueInfo
      };
    });

    // Compute society metrics
    const overdueCount = processedComplaints.filter(c => c.isOverdue).length;
    const openCount = processedComplaints.filter(c => c.status === 'OPEN').length;
    const inProgressCount = processedComplaints.filter(c => c.status === 'IN_PROGRESS').length;
    const resolvedCount = processedComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const totalCount = processedComplaints.length;

    // Filter by OVERDUE if explicitly requested
    if (status === 'OVERDUE') {
      processedComplaints = processedComplaints.filter(c => c.isOverdue);
    }

    // 3. SERVER-SIDE SORTING: Overdue complaints MUST appear at the top
    processedComplaints.sort((a, b) => {
      // 1. Overdue complaints strictly above non-overdue
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      // 2. Among overdue complaints: sort by most overdue first (highest daysOpen)
      if (a.isOverdue && b.isOverdue) {
        return b.overdueInfo.daysOpen - a.overdueInfo.daysOpen;
      }

      // 3. Among non-overdue: unresolved first, then resolved
      const isResolvedA = a.status === 'RESOLVED' || a.status === 'CLOSED';
      const isResolvedB = b.status === 'RESOLVED' || b.status === 'CLOSED';

      if (!isResolvedA && isResolvedB) return -1;
      if (isResolvedA && !isResolvedB) return 1;

      // 4. Default: Newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json({
      success: true,
      complaints: processedComplaints,
      total: processedComplaints.length,
      totalCount,
      overdueCount,
      openCount,
      inProgressCount,
      resolvedCount,
      thresholdDays
    });
  } catch (error: any) {
    console.error('Error fetching admin complaints:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin complaints.'
    });
  }
}

/**
 * Controller: Get Admin App Settings (Specifically COMPLAINT_OVERDUE_DAYS)
 * Requirements:
 * - Guarded by requireAdmin
 * - Reads from Prisma AppSetting or memory fallback
 */
export async function getAdminSettingsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const overdueThresholdDays = await getOverdueThresholdDays();
    return res.json({
      success: true,
      overdueThresholdDays,
      key: 'COMPLAINT_OVERDUE_DAYS',
      description: 'Threshold in days before an unresolved complaint is marked overdue'
    });
  } catch (error: any) {
    console.error('Error fetching admin settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve admin settings.'
    });
  }
}

/**
 * Controller: Update Admin App Settings (Specifically COMPLAINT_OVERDUE_DAYS)
 * Requirements:
 * - Guarded by requireAdmin
 * - Validates thresholdDays is an integer between 1 and 365
 * - Persists into AppSetting table in Prisma
 * - Returns updated threshold
 */
export async function updateAdminSettingsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { thresholdDays, days, overdueThresholdDays } = req.body;
    const rawVal = thresholdDays ?? days ?? overdueThresholdDays;

    if (rawVal === undefined || rawVal === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: thresholdDays (must be integer between 1 and 365).'
      });
    }

    const parsedDays = parseInt(rawVal, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      return res.status(400).json({
        success: false,
        error: 'Invalid threshold: Threshold must be a valid integer between 1 and 365 days.'
      });
    }

    const savedDays = await setOverdueThresholdDays(parsedDays, user.name || user.email);

    return res.json({
      success: true,
      message: `Overdue SLA threshold updated to ${savedDays} day(s).`,
      overdueThresholdDays: savedDays,
      key: 'COMPLAINT_OVERDUE_DAYS'
    });
  } catch (error: any) {
    console.error('Error updating admin settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update admin settings.'
    });
  }
}

/**
 * Controller: Update Complaint Status (Admin Only)
 * Requirements:
 * - Guarded by requireAdmin
 * - Status transition: OPEN -> IN_PROGRESS -> RESOLVED
 * - Admin CANNOT close complaints (CLOSED is reserved for resident confirmation)
 * - Allows optional admin note and optional technician assignment
 * - Creates a NEW ComplaintStatusHistory record
 */
export async function updateAdminComplaintStatusHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required to update complaint status.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { id } = req.params;
    const { status, note, assignedStaffId, assignedStaffName, staffContact } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Target status is required.'
      });
    }

    // REQUIREMENT 3: Admin cannot close tickets directly
    if (status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Administrators cannot close complaints. Only the resident can confirm resolution and close the ticket.'
      });
    }

    const validStatuses: ComplaintStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status as ComplaintStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Admin allowed statuses are: ${validStatuses.join(', ')}.`
      });
    }

    const targetStatus = status as ComplaintStatus;
    const now = new Date();
    const cleanNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;

    // Resolve technician info if passed
    let finalStaffId: string | null | undefined = undefined;
    let finalStaffName: string | null | undefined = undefined;
    let finalStaffContact: string | null | undefined = undefined;

    if (assignedStaffId !== undefined) {
      if (assignedStaffId) {
        const found = SERVER_STAFF_MEMBERS.find(s => s.id === assignedStaffId);
        finalStaffId = assignedStaffId;
        finalStaffName = found ? found.name : (assignedStaffName || 'Technician');
        finalStaffContact = found ? found.phone : (staffContact || '');
      } else {
        finalStaffId = null;
        finalStaffName = null;
        finalStaffContact = null;
      }
    } else if (assignedStaffName !== undefined) {
      if (assignedStaffName) {
        const found = SERVER_STAFF_MEMBERS.find(s => s.name.toLowerCase() === assignedStaffName.toLowerCase());
        finalStaffId = found ? found.id : `staff_${Date.now()}`;
        finalStaffName = assignedStaffName;
        finalStaffContact = found ? found.phone : (staffContact || '');
      } else {
        finalStaffId = null;
        finalStaffName = null;
        finalStaffContact = null;
      }
    }

    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const existing = await dbClient.complaint.findUnique({
        where: { id },
        include: {
          statusHistory: true
        }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Complaint not found.'
        });
      }

      const isBecomingResolved = targetStatus === 'RESOLVED';

      // Perform transaction to update complaint and create status history
      const result = await dbClient.$transaction(async (tx) => {
        // 1. Create new status history record
        let historyNote = cleanNote;
        if (finalStaffName !== undefined && finalStaffName !== existing.assignedStaffName) {
          const techNote = finalStaffName 
            ? `Technician assigned: ${finalStaffName}` 
            : 'Technician unassigned';
          historyNote = historyNote ? `${techNote} - Note: ${historyNote}` : techNote;
        }

        const createdHistory = await tx.complaintStatusHistory.create({
          data: {
            complaintId: existing.id,
            previousStatus: existing.status,
            newStatus: targetStatus,
            actorId: user.id,
            actorName: user.name || 'Administrator',
            actorRole: user.role || 'ADMIN',
            timestamp: now,
            note: historyNote
          },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        });

        // 2. Prepare update payload
        const updateData: any = {
          status: targetStatus,
          resolvedAt: isBecomingResolved ? (existing.resolvedAt || now) : null,
          resolutionNotes: isBecomingResolved && cleanNote ? cleanNote : existing.resolutionNotes,
          updatedAt: now
        };

        if (finalStaffId !== undefined) {
          updateData.assignedStaffId = finalStaffId;
          updateData.assignedStaffName = finalStaffName;
          updateData.staffContact = finalStaffContact;
        }

        // 3. Update complaint
        const updatedComplaint = await tx.complaint.update({
          where: { id: existing.id },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                unitNumber: true,
                tower: true,
                phone: true
              }
            },
            statusHistory: {
              include: {
                actor: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              },
              orderBy: {
                timestamp: 'asc'
              }
            }
          }
        });

        return { updatedComplaint, createdHistory };
      });

      // Trigger Resend email notification in background asynchronously
      try {
        if (result.updatedComplaint.user?.email) {
          sendComplaintStatusChangeEmail({
            complaintId: result.updatedComplaint.id,
            ticketNumber: result.updatedComplaint.ticketNumber,
            title: result.updatedComplaint.title,
            description: result.updatedComplaint.description,
            residentName: result.updatedComplaint.user.name || 'Resident',
            residentEmail: result.updatedComplaint.user.email,
            unitNumber: result.updatedComplaint.user.unitNumber || 'N/A',
            tower: result.updatedComplaint.user.tower || 'Oakwood',
            previousStatus: existing.status,
            newStatus: targetStatus,
            note: cleanNote || undefined,
            adminName: user.name || 'Society Administration',
            updatedAt: now.toISOString()
          }).catch(emailErr => {
            console.warn('[Resend Background Email Error]:', emailErr);
          });
        }
      } catch (emailTriggerErr) {
        console.warn('[Resend Trigger Exception]:', emailTriggerErr);
      }

      return res.json({
        success: true,
        message: `Complaint status updated to ${targetStatus}.`,
        complaint: result.updatedComplaint,
        newHistory: result.createdHistory
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma update complaint status failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to update complaint status in database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update complaint status.'
    });
  }
}

/**
 * Controller: Assign Technician to Complaint (Admin Only)
 * Requirements:
 * - Must be authenticated with ADMIN role
 * - Loads/validates staff member
 * - Updates assignedStaffId, assignedStaffName, staffContact
 * - Appends a ComplaintStatusHistory record tracking technician assignment in audit log
 */
export async function assignAdminComplaintTechnicianHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required to assign technicians.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { id } = req.params;
    const { assignedStaffId, assignedStaffName, staffContact, note } = req.body;

    // Find staff member if staffId provided
    let finalStaffId: string | null = null;
    let finalStaffName: string | null = null;
    let finalStaffContact: string | null = null;

    if (assignedStaffId) {
      const foundStaff = SERVER_STAFF_MEMBERS.find(s => s.id === assignedStaffId);
      finalStaffId = assignedStaffId;
      finalStaffName = foundStaff ? foundStaff.name : (assignedStaffName || 'Technician');
      finalStaffContact = foundStaff ? foundStaff.phone : (staffContact || '');
    } else if (assignedStaffName && assignedStaffName.trim()) {
      finalStaffName = assignedStaffName.trim();
      const foundStaff = SERVER_STAFF_MEMBERS.find(s => s.name.toLowerCase() === finalStaffName!.toLowerCase());
      finalStaffId = foundStaff ? foundStaff.id : `staff_${Date.now()}`;
      finalStaffContact = foundStaff ? foundStaff.phone : (staffContact || '');
    }

    const now = new Date();
    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const existing = await dbClient.complaint.findUnique({
        where: { id },
        include: { statusHistory: true }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Complaint not found.'
        });
      }

      const prevTechName = existing.assignedStaffName;
      const actionDescription = finalStaffName
        ? (prevTechName 
            ? `Technician reassigned from ${prevTechName} to ${finalStaffName} (${finalStaffContact || 'Facility Staff'})`
            : `Technician assigned: ${finalStaffName} (${finalStaffContact || 'Facility Staff'})`)
        : `Technician unassigned (previously ${prevTechName || 'N/A'})`;

      const historyNote = note && typeof note === 'string' && note.trim() 
        ? `${actionDescription} - Note: ${note.trim()}`
        : actionDescription;

      // Perform transaction
      const result = await dbClient.$transaction(async (tx) => {
        // 1. Create history entry
        const createdHistory = await tx.complaintStatusHistory.create({
          data: {
            complaintId: existing.id,
            previousStatus: existing.status,
            newStatus: existing.status,
            actorId: user.id,
            actorName: user.name || 'Administrator',
            actorRole: 'ADMIN',
            note: historyNote,
            timestamp: now
          },
          include: {
            actor: {
              select: { id: true, name: true, role: true }
            }
          }
        });

        // 2. Update complaint
        const updatedComplaint = await tx.complaint.update({
          where: { id: existing.id },
          data: {
            assignedStaffId: finalStaffId,
            assignedStaffName: finalStaffName,
            staffContact: finalStaffContact,
            updatedAt: now
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, unitNumber: true, tower: true, phone: true }
            },
            statusHistory: {
              include: {
                actor: { select: { id: true, name: true, role: true } }
              },
              orderBy: { timestamp: 'asc' }
            }
          }
        });

        return { updatedComplaint, createdHistory };
      });

      return res.json({
        success: true,
        message: finalStaffName ? `Assigned technician ${finalStaffName} to complaint.` : 'Technician unassigned.',
        complaint: result.updatedComplaint,
        newHistory: result.createdHistory
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma assign technician failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to assign technician in database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error assigning technician:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to assign technician.'
    });
  }
}

/**
 * Controller: Resident Confirm Resolution / Reopen Complaint (Resident Only)
 * Requirements:
 * - After admin marks complaint RESOLVED, the resident who created the complaint can:
 *   1. [ Confirm & Close Ticket ]: Transitions RESOLVED -> CLOSED
 *   2. [ Issue Not Fixed / Reopen ]: Transitions RESOLVED -> OPEN
 * - Creates a ComplaintStatusHistory record with actorRole = RESIDENT and appropriate note.
 */
export async function residentConfirmComplaintHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    const { id } = req.params;
    const { action, note, reason } = req.body;

    if (!action || (action !== 'CONFIRM_CLOSE' && action !== 'REOPEN')) {
      return res.status(400).json({
        success: false,
        error: "Action must be either 'CONFIRM_CLOSE' or 'REOPEN'."
      });
    }

    const now = new Date();
    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const existing = await dbClient.complaint.findUnique({
        where: { id },
        include: { statusHistory: true }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Complaint not found.'
        });
      }

      // Must be the resident who created the complaint
      if (user.role !== 'ADMIN' && existing.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden. You can only confirm or reopen your own complaints.',
          code: 'FORBIDDEN_OWN_ONLY'
        });
      }

      const targetStatus: ComplaintStatus = action === 'CONFIRM_CLOSE' ? 'CLOSED' : 'OPEN';
      const cleanNote = (note || reason || '').trim();
      const historyNote = action === 'CONFIRM_CLOSE'
        ? (cleanNote ? `Resident confirmed resolution and closed ticket: ${cleanNote}` : 'Resident confirmed resolution and closed ticket.')
        : (cleanNote ? `Resident reopened complaint (Issue not fixed): ${cleanNote}` : 'Resident reported issue not fixed and reopened complaint.');

      // Perform transaction
      const result = await dbClient.$transaction(async (tx) => {
        const createdHistory = await tx.complaintStatusHistory.create({
          data: {
            complaintId: existing.id,
            previousStatus: existing.status,
            newStatus: targetStatus,
            actorId: user.id,
            actorName: user.name || 'Resident',
            actorRole: 'RESIDENT',
            note: historyNote,
            timestamp: now
          },
          include: {
            actor: {
              select: { id: true, name: true, role: true }
            }
          }
        });

        const updatedComplaint = await tx.complaint.update({
          where: { id: existing.id },
          data: {
            status: targetStatus,
            resolvedAt: targetStatus === 'CLOSED' ? (existing.resolvedAt || now) : null,
            resolutionNotes: targetStatus === 'CLOSED' && cleanNote ? cleanNote : existing.resolutionNotes,
            updatedAt: now
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, unitNumber: true, tower: true, phone: true }
            },
            statusHistory: {
              include: {
                actor: { select: { id: true, name: true, role: true } }
              },
              orderBy: { timestamp: 'asc' }
            }
          }
        });

        return { updatedComplaint, createdHistory };
      });

      return res.json({
        success: true,
        message: action === 'CONFIRM_CLOSE' ? 'Complaint confirmed and closed.' : 'Complaint reopened successfully.',
        complaint: result.updatedComplaint,
        newHistory: result.createdHistory
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma resident confirm complaint failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to process resident complaint confirmation: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error in resident complaint action:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process resident complaint confirmation.'
    });
  }
}

/**
 * Controller: Add Comment or Update Note to Complaint (Admin / User)
 * Requirements:
 * - Allows adding an update note/comment without having to change status
 * - Creates a new ComplaintStatusHistory record preserving the audit log
 */
export async function addAdminComplaintCommentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED'
      });
    }

    const { id } = req.params;
    const { note, text, comment } = req.body;
    const cleanComment = (note || text || comment || '').trim();

    if (!cleanComment) {
      return res.status(400).json({
        success: false,
        error: 'Comment / update text is required.'
      });
    }

    const now = new Date();
    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const existing = await dbClient.complaint.findUnique({
        where: { id },
        include: { statusHistory: true }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Complaint not found.'
        });
      }

      if (user.role === 'RESIDENT' && existing.userId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden. You can only comment on your own complaints.',
          code: 'FORBIDDEN_OWN_ONLY'
        });
      }

      const createdHistory = await dbClient.complaintStatusHistory.create({
        data: {
          complaintId: existing.id,
          previousStatus: existing.status,
          newStatus: existing.status,
          actorId: user.id,
          actorName: user.name || (user.role === 'ADMIN' ? 'Administrator' : 'Resident'),
          actorRole: user.role,
          timestamp: now,
          note: cleanComment
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      const updatedComplaint = await dbClient.complaint.update({
        where: { id: existing.id },
        data: { updatedAt: now },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              unitNumber: true,
              tower: true,
              phone: true
            }
          },
          statusHistory: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Comment added successfully.',
        complaint: updatedComplaint,
        newHistory: createdHistory
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma add comment failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to add comment in database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add comment.'
    });
  }
}


/**
 * Controller: Update Complaint Priority (Admin Only)
 * Requirements:
 * - Guarded by requireAdmin
 * - Priority: LOW, MEDIUM, HIGH
 * - Updates priority on complaint
 */
export async function updateAdminComplaintPriorityHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required to update complaint priority.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { id } = req.params;
    const { priority } = req.body;

    const validPriorities: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
    if (!priority || !validPriorities.includes(priority as ComplaintPriority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid priority '${priority}'. Allowed priorities are: ${validPriorities.join(', ')}.`
      });
    }

    const targetPriority = priority as ComplaintPriority;
    const now = new Date();

    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const existing = await dbClient.complaint.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Complaint not found.'
        });
      }

      const updatedComplaint = await dbClient.complaint.update({
        where: { id },
        data: {
          priority: targetPriority,
          updatedAt: now
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              unitNumber: true,
              tower: true,
              phone: true
            }
          },
          statusHistory: {
            include: {
              actor: {
                select: {
                  id: true,
                  name: true,
                  role: true
                }
              }
            },
            orderBy: {
              timestamp: 'asc'
            }
          }
        }
      });

      return res.json({
        success: true,
        message: `Complaint priority updated to ${targetPriority}.`,
        complaint: updatedComplaint
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma update complaint priority failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to update complaint priority in database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error updating complaint priority:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update complaint priority.'
    });
  }
}

/**
 * Controller: Get Complete Complaint Status History (Admin Only)
 */
export async function getAdminComplaintStatusHistoryHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { id } = req.params;
    const dbClient = getPrisma();

    if (!dbClient) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured or unavailable.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    try {
      const history = await dbClient.complaintStatusHistory.findMany({
        where: { complaintId: id },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      return res.json({
        success: true,
        history
      });
    } catch (dbErr: any) {
      console.error('[DB] Prisma get complaint status history failed:', dbErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve complaint status history from database: ' + (dbErr.message || 'Database error'),
        code: 'DATABASE_ERROR'
      });
    }
  } catch (error: any) {
    console.error('Error fetching complaint status history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve complaint status history.'
    });
  }
}

/**
 * Controller: Get Authoritative Server-Side Admin Dashboard Statistics & Analytics
 * Route: GET /api/admin/dashboard/stats
 * Strictly Protected by requireAdmin
 * Returns real, aggregated metrics computed from the database / memory store.
 */
export async function getAdminDashboardStatsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Admin privileges required to access Admin Dashboard statistics.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const thresholdDays = await getOverdueThresholdDays();
    const now = Date.now();
    const dbClient = getPrisma();

    let complaintsList: Array<{
      id: string;
      ticketNumber: string;
      title: string;
      description: string;
      category: ComplaintCategory;
      priority: ComplaintPriority;
      status: ComplaintStatus;
      unitNumber?: string | null;
      tower?: string | null;
      residentName?: string | null;
      residentContact?: string | null;
      createdAt: Date | string;
      updatedAt: Date | string;
      resolvedAt?: Date | string | null;
      user?: {
        name?: string | null;
        unitNumber?: string | null;
        tower?: string | null;
      } | null;
    }> = [];

    if (dbClient) {
      try {
        complaintsList = await dbClient.complaint.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                unitNumber: true,
                tower: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } catch (dbErr) {
        console.warn('[DB] Prisma query in dashboard stats failed, using memory store:', dbErr);
        complaintsList = [];
      }
    }

    if (complaintsList.length === 0 && memoryComplaints.length > 0) {
      complaintsList = [...memoryComplaints];
    }

    const totalComplaints = complaintsList.length;

    // 1. Status Breakdown
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;

    // 2. Category Breakdown
    const ALL_CATEGORIES: ComplaintCategory[] = [
      'PLUMBING',
      'ELECTRICAL',
      'ELEVATOR',
      'SECURITY',
      'CARPENTRY',
      'SANITATION',
      'LANDSCAPING',
      'CIVIL_WORK',
      'OTHER'
    ];

    const categoryBreakdown: Record<ComplaintCategory, {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      active: number;
      percentage: number;
    }> = {
      PLUMBING: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      ELECTRICAL: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      ELEVATOR: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      SECURITY: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      CARPENTRY: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      SANITATION: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      LANDSCAPING: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      CIVIL_WORK: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 },
      OTHER: { total: 0, open: 0, inProgress: 0, resolved: 0, active: 0, percentage: 0 }
    };

    // 3. Priority Breakdown
    const priorityBreakdown = {
      LOW: { total: 0, active: 0, resolved: 0 },
      MEDIUM: { total: 0, active: 0, resolved: 0 },
      HIGH: { total: 0, active: 0, resolved: 0 }
    };

    // 4. Overdue & Resolution Duration metrics
    const overdueList: Array<{
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
    }> = [];

    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;
    let compliantWithSlaCount = 0;
    let urgentActiveCount = 0;

    complaintsList.forEach(c => {
      const isResolved = c.status === 'RESOLVED' || (c.status as string) === 'CLOSED';
      const isInProgress = c.status === 'IN_PROGRESS';
      const isOpen = !isResolved && !isInProgress;

      // Status
      if (isResolved) resolvedCount += 1;
      else if (isInProgress) inProgressCount += 1;
      else openCount += 1;

      // Category
      const catKey: ComplaintCategory = (c.category in categoryBreakdown) ? c.category : 'OTHER';
      categoryBreakdown[catKey].total += 1;
      if (isResolved) {
        categoryBreakdown[catKey].resolved += 1;
      } else if (isInProgress) {
        categoryBreakdown[catKey].inProgress += 1;
        categoryBreakdown[catKey].active += 1;
      } else {
        categoryBreakdown[catKey].open += 1;
        categoryBreakdown[catKey].active += 1;
      }

      // Priority
      const priKey = (c.priority === 'HIGH' || (c.priority as string) === 'URGENT') ? 'HIGH' : (c.priority === 'LOW' ? 'LOW' : 'MEDIUM');
      priorityBreakdown[priKey].total += 1;
      if (isResolved) {
        priorityBreakdown[priKey].resolved += 1;
      } else {
        priorityBreakdown[priKey].active += 1;
        if (c.priority === 'HIGH' || (c.priority as string) === 'URGENT') {
          urgentActiveCount += 1;
        }
      }

      // Overdue derivation
      const overdueInfo = deriveServerComplaintOverdue(c, thresholdDays, now);
      if (overdueInfo.isOverdue) {
        overdueList.push({
          id: c.id,
          ticketNumber: c.ticketNumber,
          title: c.title,
          category: c.category,
          priority: c.priority,
          status: c.status,
          residentName: c.user?.name || c.residentName || 'Resident',
          unitNumber: c.user?.unitNumber || c.unitNumber || 'N/A',
          tower: c.user?.tower || c.tower || 'Oakwood',
          daysOpen: overdueInfo.daysOpen,
          daysOverdue: overdueInfo.daysOverdue,
          createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString()
        });
      }

      // SLA Compliance & Duration
      const createdMs = new Date(c.createdAt).getTime();
      if (isResolved) {
        const resolvedMs = c.resolvedAt ? new Date(c.resolvedAt).getTime() : (c.updatedAt ? new Date(c.updatedAt).getTime() : createdMs);
        const durationHours = Math.max(0, (resolvedMs - createdMs) / 3600000);
        totalResolutionHours += durationHours;
        resolvedWithDurationCount += 1;

        const durationDays = durationHours / 24;
        if (durationDays <= thresholdDays) {
          compliantWithSlaCount += 1;
        }
      } else {
        // Active complaint: compliant if not overdue yet
        if (!overdueInfo.isOverdue) {
          compliantWithSlaCount += 1;
        }
      }
    });

    // Calculate percentages for categories
    ALL_CATEGORIES.forEach(cat => {
      categoryBreakdown[cat].percentage = totalComplaints > 0 
        ? Math.round((categoryBreakdown[cat].total / totalComplaints) * 100) 
        : 0;
    });

    // Sort overdue list: most overdue first
    overdueList.sort((a, b) => b.daysOpen - a.daysOpen);

    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 100;
    const avgResolutionHours = resolvedWithDurationCount > 0 
      ? Math.round((totalResolutionHours / resolvedWithDurationCount) * 10) / 10 
      : 0;
    const avgResolutionDays = avgResolutionHours > 0 
      ? Math.round((avgResolutionHours / 24) * 10) / 10 
      : 0;
    const slaComplianceRate = totalComplaints > 0 
      ? Math.round((compliantWithSlaCount / totalComplaints) * 100) 
      : 100;

    // Recent 5 complaints
    const recentComplaints = complaintsList.slice(0, 5).map(c => ({
      id: c.id,
      ticketNumber: c.ticketNumber,
      title: c.title,
      status: c.status,
      priority: c.priority,
      category: c.category,
      residentName: c.user?.name || c.residentName || 'Resident',
      unitNumber: c.user?.unitNumber || c.unitNumber || 'N/A',
      tower: c.user?.tower || c.tower || 'Oakwood',
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString()
    }));

    return res.json({
      success: true,
      stats: {
        totalComplaints,
        byStatus: {
          OPEN: openCount,
          IN_PROGRESS: inProgressCount,
          RESOLVED: resolvedCount,
          openPercentage: totalComplaints > 0 ? Math.round((openCount / totalComplaints) * 100) : 0,
          inProgressPercentage: totalComplaints > 0 ? Math.round((inProgressCount / totalComplaints) * 100) : 0,
          resolvedPercentage: resolutionRate
        },
        byCategory: categoryBreakdown,
        byPriority: priorityBreakdown,
        overdue: {
          overdueThresholdDays: thresholdDays,
          overdueCount: overdueList.length,
          overdueComplaints: overdueList
        },
        summary: {
          resolutionRate,
          urgentActiveCount,
          avgResolutionHours,
          avgResolutionDays,
          slaComplianceRate,
          activeTicketsCount: openCount + inProgressCount,
          overdueThresholdDays: thresholdDays,
          totalResolvedCount: resolvedCount,
          totalComplaints
        },
        recentComplaints,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error generating admin dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Admin Dashboard statistics.'
    });
  }
}

