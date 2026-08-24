import { Request, Response } from 'express';
import { getPrisma } from './db';
import { AuthenticatedRequest } from './auth';
import prismaPkg from '@prisma/client';
import type { NoticeCategory as NoticeCategoryType, NoticePriority as NoticePriorityType } from '@prisma/client';
import { sendImportantNoticeBroadcastEmail } from './email';

const PrismaEnums = (prismaPkg as any).default || prismaPkg;
const NoticeCategory: Record<string, string> = PrismaEnums.NoticeCategory || {
  GENERAL: 'GENERAL',
  MAINTENANCE: 'MAINTENANCE',
  EMERGENCY: 'EMERGENCY',
  EVENT: 'EVENT',
  RULE: 'RULE'
};
const NoticePriority: Record<string, string> = PrismaEnums.NoticePriority || {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  CRITICAL: 'CRITICAL'
};

export interface MemoryNotice {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  isPinned: boolean;
  isImportant: boolean;
  authorId?: string | null;
  author: string;
  authorRole: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory fallback notices
const memoryNotices: MemoryNotice[] = [
  {
    id: 'not_001',
    title: 'Scheduled Water Supply Interruption for Tank Cleaning',
    content: 'Please be informed that the Overhead Water Tanks of Tower A and Tower B will undergo bi-annual automated scrubbing and chlorination. Main water supply will be paused from 10:00 AM to 3:00 PM this coming Thursday, August 27th. Please store sufficient water in advance.',
    category: 'MAINTENANCE',
    priority: 'HIGH',
    targetAudience: 'Tower A & B Residents',
    isPinned: true,
    isImportant: true,
    author: 'Estate Management Office',
    authorRole: 'Chief Facility Manager',
    date: 'August 22, 2026',
    createdAt: new Date('2026-08-22T08:00:00Z'),
    updatedAt: new Date('2026-08-22T08:00:00Z')
  },
  {
    id: 'not_002',
    title: 'Annual General Body Meeting (AGM) & Committee Elections',
    content: 'The 12th Annual General Body Meeting of Oakwood Residency will be held in the Central Clubhouse Banquet Hall on Sunday, September 6, 2026 at 10:30 AM. Agenda includes annual budget approval, security system upgrade proposals, and committee nominations.',
    category: 'EVENT',
    priority: 'NORMAL',
    targetAudience: 'All Homeowners',
    isPinned: true,
    isImportant: true,
    author: 'Rajesh Sharma',
    authorRole: 'Society Secretary',
    date: 'August 20, 2026',
    createdAt: new Date('2026-08-20T10:30:00Z'),
    updatedAt: new Date('2026-08-20T10:30:00Z')
  },
  {
    id: 'not_003',
    title: 'Urgent: Strict Speed Limit 15 km/h in Basement Parking',
    content: 'Multiple instances of speeding vehicles in Basement Level 1 & 2 have been reported by the security team. Please adhere strictly to the 15 km/h limit. Speed bumps have been re-painted with reflective neon markers.',
    category: 'RULE',
    priority: 'URGENT',
    targetAudience: 'All Residents & Drivers',
    isPinned: false,
    isImportant: false,
    author: 'Security Directorate',
    authorRole: 'Head of Safety',
    date: 'August 19, 2026',
    createdAt: new Date('2026-08-19T14:15:00Z'),
    updatedAt: new Date('2026-08-19T14:15:00Z')
  },
  {
    id: 'not_004',
    title: 'Monsoon Pest Control & Mosquito Fogging Drive',
    content: 'Fogging drive will be conducted across all common areas, garden walkways, basement drain channels, and podiums starting this Friday evening at 6:30 PM. Please keep balcony windows closed during fogging.',
    category: 'MAINTENANCE',
    priority: 'NORMAL',
    targetAudience: 'All Towers',
    isPinned: false,
    isImportant: false,
    author: 'Health & Sanitation Committee',
    authorRole: 'Committee Member',
    date: 'August 18, 2026',
    createdAt: new Date('2026-08-18T09:00:00Z'),
    updatedAt: new Date('2026-08-18T09:00:00Z')
  },
  {
    id: 'not_005',
    title: 'Emergency Power Substation Transformer Testing',
    content: 'The electrical safety board will conduct preventive thermal imaging and load-switching tests on the main 11kV transformer unit between 2:00 AM and 4:00 AM on Wednesday. Diesel generators will support elevators and corridor lighting during the test.',
    category: 'EMERGENCY',
    priority: 'HIGH',
    targetAudience: 'All Residents',
    isPinned: false,
    isImportant: false,
    author: 'Engineering & Electrical Team',
    authorRole: 'Senior Electrical Engineer',
    date: 'August 17, 2026',
    createdAt: new Date('2026-08-17T11:00:00Z'),
    updatedAt: new Date('2026-08-17T11:00:00Z')
  }
];

/**
 * Controller: Get All Notices (Public / Resident / Admin)
 * Requirements:
 * - Residents & Admins can view notices.
 * - IMPORTANT / PINNED notices are sorted strictly at the top.
 * - Secondary sort: Newest notices first.
 * - Supports filtering by category, search query, and importantOnly flag.
 */
export async function getNoticesHandler(req: Request, res: Response) {
  try {
    const { category, search, importantOnly } = req.query as {
      category?: string;
      search?: string;
      importantOnly?: string;
    };

    const dbClient = getPrisma();
    let rawNotices: any[] = [];

    if (dbClient) {
      try {
        const whereClause: any = {};

        if (category && category !== 'ALL') {
          whereClause.category = category as NoticeCategory;
        }

        if (importantOnly === 'true') {
          whereClause.OR = [
            { isPinned: true },
            { isImportant: true }
          ];
        }

        if (search && search.trim()) {
          const s = search.trim();
          whereClause.AND = [
            {
              OR: [
                { title: { contains: s, mode: 'insensitive' } },
                { content: { contains: s, mode: 'insensitive' } },
                { author: { contains: s, mode: 'insensitive' } },
                { targetAudience: { contains: s, mode: 'insensitive' } }
              ]
            }
          ];
        }

        rawNotices = await dbClient.notice.findMany({
          where: whereClause,
          include: {
            authorUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true
              }
            }
          },
          orderBy: [
            { isPinned: 'desc' },
            { isImportant: 'desc' },
            { createdAt: 'desc' }
          ]
        });
      } catch (dbErr) {
        console.warn('[DB] Prisma findMany notices failed, falling back to memory store:', dbErr);
        rawNotices = [];
      }
    }

    if (rawNotices.length === 0 && memoryNotices.length > 0) {
      let filtered = [...memoryNotices];

      if (category && category !== 'ALL') {
        filtered = filtered.filter(n => n.category === category);
      }

      if (importantOnly === 'true') {
        filtered = filtered.filter(n => n.isPinned || n.isImportant);
      }

      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        filtered = filtered.filter(n =>
          n.title.toLowerCase().includes(s) ||
          n.content.toLowerCase().includes(s) ||
          n.author.toLowerCase().includes(s) ||
          n.targetAudience.toLowerCase().includes(s)
        );
      }

      rawNotices = filtered;
    }

    // Format & sort notices: Important / Pinned notices strictly on top, then newest first
    const formatted = rawNotices.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      targetAudience: n.targetAudience,
      isPinned: Boolean(n.isPinned || n.isImportant),
      isImportant: Boolean(n.isPinned || n.isImportant),
      authorId: n.authorId,
      author: n.author || n.authorUser?.name || 'Society Administration',
      authorRole: n.authorRole || 'ADMIN',
      date: n.date instanceof Date 
        ? n.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : (typeof n.date === 'string' ? n.date : new Date(n.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })),
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
      updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : n.updatedAt
    }));

    formatted.sort((a, b) => {
      const aPinned = a.isPinned || a.isImportant;
      const bPinned = b.isPinned || b.isImportant;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json({
      success: true,
      notices: formatted,
      total: formatted.length,
      importantCount: formatted.filter(n => n.isPinned || n.isImportant).length
    });
  } catch (error: any) {
    console.error('Error fetching notices:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve society notices.'
    });
  }
}

/**
 * Controller: Create Notice (Admin Only)
 * Requirements:
 * - Strictly guarded by requireAdmin.
 * - createdById / authorId MUST be derived from authenticated admin session (never from browser payload).
 * - Sets title, content, category, priority, and isImportant/isPinned.
 */
export async function createNoticeHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Only administrators can publish notices.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { title, content, category, priority, targetAudience, isPinned, isImportant } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Notice title is required and cannot be empty.'
      });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Notice content is required and cannot be empty.'
      });
    }

    const validCategory = Object.values(NoticeCategory).includes(category) ? category : 'GENERAL';
    const validPriority = Object.values(NoticePriority).includes(priority) ? priority : 'NORMAL';
    const finalPinned = Boolean(isPinned || isImportant);
    const audience = targetAudience && typeof targetAudience === 'string' && targetAudience.trim()
      ? targetAudience.trim()
      : 'All Residents & Homeowners';

    // Author ID MUST come from authenticated session
    const authorId = user.id;
    const authorName = user.name || 'Society Administration';
    const authorRole = 'ADMIN';
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const dbClient = getPrisma();
    let createdNotice: any = null;

    if (dbClient) {
      try {
        createdNotice = await dbClient.notice.create({
          data: {
            title: title.trim(),
            content: content.trim(),
            category: validCategory as NoticeCategory,
            priority: validPriority as NoticePriority,
            targetAudience: audience,
            isPinned: finalPinned,
            isImportant: finalPinned,
            authorId: authorId,
            author: authorName,
            authorRole: authorRole,
            date: now
          }
        });
      } catch (dbErr) {
        console.warn('[DB] Prisma create notice failed, falling back to memory store:', dbErr);
      }
    }

    if (!createdNotice) {
      const memoryItem: MemoryNotice = {
        id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        content: content.trim(),
        category: validCategory,
        priority: validPriority,
        targetAudience: audience,
        isPinned: finalPinned,
        isImportant: finalPinned,
        authorId: authorId,
        author: authorName,
        authorRole: authorRole,
        date: formattedDate,
        createdAt: now,
        updatedAt: now
      };
      memoryNotices.unshift(memoryItem);
      createdNotice = memoryItem;
    }

    const resultNotice = {
      id: createdNotice.id,
      title: createdNotice.title,
      content: createdNotice.content,
      category: createdNotice.category,
      priority: createdNotice.priority,
      targetAudience: createdNotice.targetAudience,
      isPinned: Boolean(createdNotice.isPinned || createdNotice.isImportant),
      isImportant: Boolean(createdNotice.isPinned || createdNotice.isImportant),
      authorId: createdNotice.authorId,
      author: createdNotice.author,
      authorRole: createdNotice.authorRole,
      date: formattedDate,
      createdAt: createdNotice.createdAt instanceof Date ? createdNotice.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: createdNotice.updatedAt instanceof Date ? createdNotice.updatedAt.toISOString() : new Date().toISOString()
    };

    // If marked as Important or Pinned: trigger Resend broadcast in background asynchronously
    if (resultNotice.isImportant || resultNotice.isPinned) {
      try {
        // Query resident emails if db available
        let recipientEmails: Array<{ email: string; name?: string }> | undefined = undefined;
        if (dbClient) {
          dbClient.user.findMany({
            where: { role: 'RESIDENT' },
            select: { email: true, name: true }
          }).then(residents => {
            const list = residents.map(r => ({ email: r.email, name: r.name }));
            sendImportantNoticeBroadcastEmail({
              noticeId: resultNotice.id,
              title: resultNotice.title,
              content: resultNotice.content,
              category: resultNotice.category,
              priority: resultNotice.priority,
              targetAudience: resultNotice.targetAudience,
              publishedBy: resultNotice.author,
              authorRole: resultNotice.authorRole,
              date: resultNotice.date,
              recipientEmails: list.length > 0 ? list : undefined
            }).catch(broadcastErr => {
              console.warn('[Resend Background Notice Broadcast Error]:', broadcastErr);
            });
          }).catch(() => {
            sendImportantNoticeBroadcastEmail({
              noticeId: resultNotice.id,
              title: resultNotice.title,
              content: resultNotice.content,
              category: resultNotice.category,
              priority: resultNotice.priority,
              targetAudience: resultNotice.targetAudience,
              publishedBy: resultNotice.author,
              authorRole: resultNotice.authorRole,
              date: resultNotice.date
            }).catch(broadcastErr => {
              console.warn('[Resend Background Notice Broadcast Fallback Error]:', broadcastErr);
            });
          });
        } else {
          sendImportantNoticeBroadcastEmail({
            noticeId: resultNotice.id,
            title: resultNotice.title,
            content: resultNotice.content,
            category: resultNotice.category,
            priority: resultNotice.priority,
            targetAudience: resultNotice.targetAudience,
            publishedBy: resultNotice.author,
            authorRole: resultNotice.authorRole,
            date: resultNotice.date
          }).catch(broadcastErr => {
            console.warn('[Resend Background Notice Broadcast Memory Error]:', broadcastErr);
          });
        }
      } catch (broadcastTriggerErr) {
        console.warn('[Resend Notice Trigger Exception]:', broadcastTriggerErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Notice published successfully.',
      notice: resultNotice
    });
  } catch (error: any) {
    console.error('Error creating notice:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while publishing notice.'
    });
  }
}

/**
 * Controller: Update Notice (Admin Only)
 * Requirements:
 * - Strictly guarded by requireAdmin.
 * - Updates title, content, category, priority, targetAudience, isPinned/isImportant.
 */
export async function updateNoticeHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Only administrators can edit notices.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Notice ID parameter is required.'
      });
    }

    const { title, content, category, priority, targetAudience, isPinned, isImportant } = req.body;

    if (title !== undefined && (!title || typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Notice title cannot be empty.'
      });
    }

    if (content !== undefined && (!content || typeof content !== 'string' || !content.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Notice content cannot be empty.'
      });
    }

    const dbClient = getPrisma();
    let updatedNotice: any = null;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (content !== undefined) dataToUpdate.content = content.trim();
    if (category && Object.values(NoticeCategory).includes(category)) dataToUpdate.category = category as NoticeCategory;
    if (priority && Object.values(NoticePriority).includes(priority)) dataToUpdate.priority = priority as NoticePriority;
    if (targetAudience !== undefined) dataToUpdate.targetAudience = targetAudience.trim();
    if (isPinned !== undefined || isImportant !== undefined) {
      const pinVal = Boolean(isPinned !== undefined ? isPinned : isImportant);
      dataToUpdate.isPinned = pinVal;
      dataToUpdate.isImportant = pinVal;
    }

    if (dbClient) {
      try {
        updatedNotice = await dbClient.notice.update({
          where: { id },
          data: dataToUpdate
        });
      } catch (dbErr) {
        console.warn(`[DB] Prisma notice update failed for ID ${id}, trying memory store:`, dbErr);
      }
    }

    // Memory fallback
    if (!updatedNotice) {
      const memIdx = memoryNotices.findIndex(n => n.id === id);
      if (memIdx !== -1) {
        memoryNotices[memIdx] = {
          ...memoryNotices[memIdx],
          ...dataToUpdate,
          updatedAt: new Date()
        };
        updatedNotice = memoryNotices[memIdx];
      }
    }

    if (!updatedNotice) {
      return res.status(404).json({
        success: false,
        error: `Notice with ID '${id}' not found.`
      });
    }

    const resultNotice = {
      id: updatedNotice.id,
      title: updatedNotice.title,
      content: updatedNotice.content,
      category: updatedNotice.category,
      priority: updatedNotice.priority,
      targetAudience: updatedNotice.targetAudience,
      isPinned: Boolean(updatedNotice.isPinned || updatedNotice.isImportant),
      isImportant: Boolean(updatedNotice.isPinned || updatedNotice.isImportant),
      authorId: updatedNotice.authorId,
      author: updatedNotice.author,
      authorRole: updatedNotice.authorRole,
      date: typeof updatedNotice.date === 'string' 
        ? updatedNotice.date 
        : new Date(updatedNotice.date || updatedNotice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      createdAt: updatedNotice.createdAt instanceof Date ? updatedNotice.createdAt.toISOString() : updatedNotice.createdAt,
      updatedAt: updatedNotice.updatedAt instanceof Date ? updatedNotice.updatedAt.toISOString() : new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'Notice updated successfully.',
      notice: resultNotice
    });
  } catch (error: any) {
    console.error('Error updating notice:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while updating notice.'
    });
  }
}

/**
 * Controller: Delete Notice (Admin Only)
 * Requirements:
 * - Strictly guarded by requireAdmin.
 * - Removes notice from persistent database.
 */
export async function deleteNoticeHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Only administrators can delete notices.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Notice ID parameter is required.'
      });
    }

    let deleted = false;
    const dbClient = getPrisma();

    if (dbClient) {
      try {
        await dbClient.notice.delete({
          where: { id }
        });
        deleted = true;
      } catch (dbErr) {
        console.warn(`[DB] Prisma delete notice failed for ID ${id}:`, dbErr);
      }
    }

    const memIdx = memoryNotices.findIndex(n => n.id === id);
    if (memIdx !== -1) {
      memoryNotices.splice(memIdx, 1);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Notice with ID '${id}' not found.`
      });
    }

    return res.json({
      success: true,
      message: `Notice '${id}' deleted successfully.`
    });
  } catch (error: any) {
    console.error('Error deleting notice:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while deleting notice.'
    });
  }
}
