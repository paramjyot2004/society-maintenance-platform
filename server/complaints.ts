import { Request, Response } from 'express';
import { prisma, getPrisma } from './db';
import { AuthenticatedRequest } from './auth';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@prisma/client';
import { sendComplaintStatusChangeEmail } from './email';

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

    if (dbClient) {
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
      } catch (dbErr) {
        console.warn('[DB] Prisma create complaint failed, falling back to memory store:', dbErr);
      }
    }

    // In-memory fallback
    const memId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticketNumber = generateTicketNumber();
    const newMemoryComplaint: MemoryComplaint = {
      id: memId,
      ticketNumber,
      title: title.trim(),
      description: description.trim(),
      category: validCategory,
      priority: initialPriority,
      status: initialStatus,
      photoUrl: cleanPhotoUrl,
      userId: user.id,
      unitNumber: user.unitNumber || 'Unit 402',
      tower: user.tower || 'Tower A',
      residentName: user.name || 'Resident',
      residentContact: user.phone || user.email || '',
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          id: `hist_${Date.now()}`,
          complaintId: memId,
          previousStatus: null,
          newStatus: initialStatus,
          actorId: user.id,
          actorName: user.name || 'Resident',
          actorRole: user.role || 'RESIDENT',
          note: 'Complaint registered by resident',
          timestamp: now
        }
      ]
    };

    memoryComplaints.unshift(newMemoryComplaint);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint: newMemoryComplaint
    });
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

    if (dbClient) {
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
      } catch (dbErr) {
        console.warn('[DB] Prisma findMany complaints failed, using memory store:', dbErr);
      }
    }

    // In-memory fallback: filter by user.id
    const userComplaints = memoryComplaints
      .filter(c => c.userId === user.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.json({
      success: true,
      complaints: userComplaints
    });
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

    if (dbClient) {
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
      } catch (dbErr) {
        console.warn('[DB] Prisma findUnique complaint failed, using memory store:', dbErr);
      }
    }

    // In-memory fallback
    const complaint = memoryComplaints.find(c => c.id === id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.'
      });
    }

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

    const { category, status, date, search, threshold } = req.query as {
      category?: string;
      status?: string;
      date?: string;
      search?: string;
      threshold?: string;
    };

    // 1. Resolve server-side threshold from AppSetting (or optional query override)
    let thresholdDays = await getOverdueThresholdDays();
    if (threshold && !isNaN(parseInt(threshold, 10)) && parseInt(threshold, 10) > 0) {
      thresholdDays = parseInt(threshold, 10);
    }

    const now = Date.now();
    const dbClient = getPrisma();
    let rawComplaints: any[] = [];

    if (dbClient) {
      try {
        const whereClause: any = {};

        // Filter by category
        if (category && category !== 'ALL') {
          whereClause.category = category as ComplaintCategory;
        }

        // Filter by standard DB status (for OVERDUE, we fetch unresolved and filter by server overdue math)
        if (status && status !== 'ALL' && status !== 'OVERDUE') {
          if (status === 'OPEN') {
            whereClause.status = 'OPEN';
          } else if (status === 'IN_PROGRESS') {
            whereClause.status = 'IN_PROGRESS';
          } else if (status === 'RESOLVED') {
            whereClause.status = 'RESOLVED';
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

        // Search query
        if (search && search.trim()) {
          const s = search.trim();
          whereClause.OR = [
            { ticketNumber: { contains: s, mode: 'insensitive' } },
            { title: { contains: s, mode: 'insensitive' } },
            { description: { contains: s, mode: 'insensitive' } },
            { residentName: { contains: s, mode: 'insensitive' } },
            { unitNumber: { contains: s, mode: 'insensitive' } }
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
      } catch (dbErr) {
        console.warn('[DB] Prisma admin findMany complaints failed, using memory store:', dbErr);
        rawComplaints = [];
      }
    }

    // In-memory fallback if db returned nothing or failed
    if (rawComplaints.length === 0 && memoryComplaints.length > 0) {
      let filtered = [...memoryComplaints];

      if (category && category !== 'ALL') {
        filtered = filtered.filter(c => c.category === category);
      }

      if (status && status !== 'ALL' && status !== 'OVERDUE') {
        if (status === 'OPEN') {
          filtered = filtered.filter(c => c.status === 'OPEN');
        } else if (status === 'IN_PROGRESS') {
          filtered = filtered.filter(c => c.status === 'IN_PROGRESS');
        } else if (status === 'RESOLVED') {
          filtered = filtered.filter(c => c.status === 'RESOLVED');
        } else {
          filtered = filtered.filter(c => c.status === status);
        }
      }

      if (date && date !== 'ALL' && date.trim()) {
        filtered = filtered.filter(c => {
          const cDate = new Date(c.createdAt).toISOString().split('T')[0];
          return cDate === date;
        });
      }

      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter(c => 
          c.ticketNumber.toLowerCase().includes(s) ||
          c.title.toLowerCase().includes(s) ||
          c.description.toLowerCase().includes(s) ||
          c.residentName.toLowerCase().includes(s) ||
          c.unitNumber.toLowerCase().includes(s)
        );
      }

      rawComplaints = filtered;
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
 * - RESOLVED is terminal and cannot be reopened (returns 400)
 * - Allows optional admin note
 * - Creates a NEW ComplaintStatusHistory record with:
 *   - complaintId
 *   - previousStatus
 *   - newStatus
 *   - actorId: authenticated admin id (req.user.id)
 *   - actorName: req.user.name
 *   - actorRole: req.user.role (ADMIN)
 *   - timestamp: now
 *   - note: optional note
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
    const { status, note } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Target status is required.'
      });
    }

    const validStatuses: ComplaintStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status as ComplaintStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status '${status}'. Allowed statuses are: ${validStatuses.join(', ')}.`
      });
    }

    const targetStatus = status as ComplaintStatus;
    const now = new Date();
    const cleanNote = note && typeof note === 'string' && note.trim() ? note.trim() : null;

    const dbClient = getPrisma();

    if (dbClient) {
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

        // TERMINAL STATE RULE: RESOLVED is terminal and cannot be reopened
        if (existing.status === 'RESOLVED') {
          return res.status(400).json({
            success: false,
            error: 'Complaint is already RESOLVED and cannot be reopened or transitioned.',
            code: 'TERMINAL_STATE'
          });
        }

        const isBecomingResolved = targetStatus === 'RESOLVED';

        // Perform transaction to update complaint and create status history
        const result = await dbClient.$transaction(async (tx) => {
          // 1. Create new status history record
          const createdHistory = await tx.complaintStatusHistory.create({
            data: {
              complaintId: existing.id,
              previousStatus: existing.status,
              newStatus: targetStatus,
              actorId: user.id,
              actorName: user.name || 'Administrator',
              actorRole: user.role || 'ADMIN',
              timestamp: now,
              note: cleanNote
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

          // 2. Update complaint
          const updatedComplaint = await tx.complaint.update({
            where: { id: existing.id },
            data: {
              status: targetStatus,
              resolvedAt: isBecomingResolved ? now : existing.resolvedAt,
              resolutionNotes: isBecomingResolved && cleanNote ? cleanNote : existing.resolutionNotes,
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
      } catch (dbErr) {
        console.warn('[DB] Prisma update complaint status failed, falling back to memory store:', dbErr);
      }
    }

    // In-memory fallback
    const targetComplaint = memoryComplaints.find(c => c.id === id);
    if (!targetComplaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.'
      });
    }

    // TERMINAL STATE RULE: RESOLVED is terminal and cannot be reopened
    if (targetComplaint.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        error: 'Complaint is already RESOLVED and cannot be reopened or transitioned.',
        code: 'TERMINAL_STATE'
      });
    }

    const previousStatus = targetComplaint.status;
    const isBecomingResolved = targetStatus === 'RESOLVED';

    const newHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      complaintId: targetComplaint.id,
      previousStatus: previousStatus,
      newStatus: targetStatus,
      actorId: user.id,
      actorName: user.name || 'Administrator',
      actorRole: user.role || 'ADMIN',
      note: cleanNote,
      timestamp: now
    };

    targetComplaint.status = targetStatus;
    targetComplaint.updatedAt = now;
    if (isBecomingResolved) {
      targetComplaint.resolvedAt = now;
      if (cleanNote) targetComplaint.resolutionNotes = cleanNote;
    }
    targetComplaint.statusHistory.push(newHistoryEntry);

    // Trigger Resend email notification in background asynchronously
    try {
      if (targetComplaint.residentContact && targetComplaint.residentContact.includes('@')) {
        sendComplaintStatusChangeEmail({
          complaintId: targetComplaint.id,
          ticketNumber: targetComplaint.ticketNumber,
          title: targetComplaint.title,
          description: targetComplaint.description,
          residentName: targetComplaint.residentName || 'Resident',
          residentEmail: targetComplaint.residentContact,
          unitNumber: targetComplaint.unitNumber || 'N/A',
          tower: targetComplaint.tower || 'Oakwood',
          previousStatus: previousStatus,
          newStatus: targetStatus,
          note: cleanNote || undefined,
          adminName: user.name || 'Society Administration',
          updatedAt: now.toISOString()
        }).catch(emailErr => {
          console.warn('[Resend Background Email Error - Memory Fallback]:', emailErr);
        });
      }
    } catch (emailTriggerErr) {
      console.warn('[Resend Trigger Exception]:', emailTriggerErr);
    }

    return res.json({
      success: true,
      message: `Complaint status updated to ${targetStatus}.`,
      complaint: targetComplaint,
      newHistory: newHistoryEntry
    });
  } catch (error: any) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update complaint status.'
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

    if (dbClient) {
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
      } catch (dbErr) {
        console.warn('[DB] Prisma update complaint priority failed, using memory store:', dbErr);
      }
    }

    // In-memory fallback
    const targetComplaint = memoryComplaints.find(c => c.id === id);
    if (!targetComplaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.'
      });
    }

    targetComplaint.priority = targetPriority;
    targetComplaint.updatedAt = now;

    return res.json({
      success: true,
      message: `Complaint priority updated to ${targetPriority}.`,
      complaint: targetComplaint
    });
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

    if (dbClient) {
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
      } catch (dbErr) {
        console.warn('[DB] Prisma get complaint status history failed, using memory store:', dbErr);
      }
    }

    const complaint = memoryComplaints.find(c => c.id === id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.'
      });
    }

    return res.json({
      success: true,
      history: complaint.statusHistory
    });
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

