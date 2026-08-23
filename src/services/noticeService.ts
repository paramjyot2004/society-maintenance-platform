import { 
  Notice, 
  CurrentUser, 
  CreateNoticeInput, 
  UpdateNoticeInput, 
  NoticeFilters 
} from '../types';
import { getStoredToken } from './authService';

export const NOTICES_STORAGE_KEY = 'oakwood_notices';

/**
 * Server-side Authorization Guard for Notice Management:
 * Enforces that only users with the ADMIN role can create, edit, delete, or mark notices as important.
 */
export function assertNoticeAdminAuthorization(actor: CurrentUser): void {
  if (actor.role !== 'ADMIN') {
    throw new Error('403 Forbidden: Only society Administrators are authorized to publish, edit, delete, or pin circular notices.');
  }
}

/**
 * Helper to determine if a notice is flagged as important/pinned
 */
export function isNoticeImportant(notice: Notice): boolean {
  return Boolean(notice.isPinned || notice.isImportant);
}

/**
 * Fetch Notices from Server (GET /api/notices)
 * - Public / Resident & Admin can fetch.
 * - Server automatically returns Important / Pinned notices at the top.
 */
export async function fetchNoticesFromServer(
  filters?: NoticeFilters
): Promise<{ success: boolean; data: Notice[]; total?: number; importantCount?: number; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') {
      params.append('category', filters.category);
    }
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      params.append('search', filters.searchQuery.trim());
    }
    if (filters?.importantOnly) {
      params.append('importantOnly', 'true');
    }

    const queryString = params.toString();
    const url = `/api/notices${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        data: [],
        error: json.error || 'Failed to retrieve notices from server.'
      };
    }

    const fetchedNotices: Notice[] = json.notices || [];

    // Sync to local cache
    if (fetchedNotices.length > 0) {
      localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(fetchedNotices));
    }

    return {
      success: true,
      data: fetchedNotices,
      total: json.total,
      importantCount: json.importantCount
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      error: err.message || 'Network error while fetching notices.'
    };
  }
}

/**
 * Create Notice on Server (POST /api/notices)
 * - Admin Only.
 * - createdById is extracted server-side from authenticated admin session token.
 */
export async function createNoticeOnServer(
  input: CreateNoticeInput
): Promise<{ success: boolean; notice?: Notice; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/notices', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: input.title,
        content: input.content,
        category: input.category,
        priority: input.priority,
        targetAudience: input.targetAudience,
        isPinned: Boolean(input.isPinned || input.isImportant),
        isImportant: Boolean(input.isPinned || input.isImportant)
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to create notice on server.'
      };
    }

    return {
      success: true,
      notice: json.notice
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while creating notice.'
    };
  }
}

/**
 * Update Notice on Server (PUT /api/notices/:id)
 * - Admin Only.
 */
export async function updateNoticeOnServer(
  noticeId: string,
  updates: UpdateNoticeInput
): Promise<{ success: boolean; notice?: Notice; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/notices/${noticeId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: updates.title,
        content: updates.content,
        category: updates.category,
        priority: updates.priority,
        targetAudience: updates.targetAudience,
        isPinned: updates.isPinned !== undefined ? updates.isPinned : updates.isImportant,
        isImportant: updates.isImportant !== undefined ? updates.isImportant : updates.isPinned
      })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to update notice on server.'
      };
    }

    return {
      success: true,
      notice: json.notice
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while updating notice.'
    };
  }
}

/**
 * Delete Notice on Server (DELETE /api/notices/:id)
 * - Admin Only.
 */
export async function deleteNoticeOnServer(
  noticeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/notices/${noticeId}`, {
      method: 'DELETE',
      headers
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return {
        success: false,
        error: json.error || 'Failed to delete notice on server.'
      };
    }

    return {
      success: true
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while deleting notice.'
    };
  }
}

/**
 * Synchronous / Local Fallback Helper: getNotices
 * - Allowed for both RESIDENT and ADMIN roles.
 * - Requirement: Important / Pinned notices MUST appear pinned at the top of the notice board.
 * - Secondary sort: Newest notices first.
 */
export function getNotices(
  actor: CurrentUser,
  noticesList: Notice[],
  filters?: NoticeFilters
): { success: boolean; data: Notice[]; error?: string } {
  try {
    let result = [...noticesList];

    // Apply filtering
    if (filters) {
      const { category, searchQuery, importantOnly } = filters;

      // Filter by category
      if (category && category !== 'ALL') {
        result = result.filter(n => n.category === category);
      }

      // Filter by important / pinned only
      if (importantOnly) {
        result = result.filter(n => isNoticeImportant(n));
      }

      // Filter by search query
      if (searchQuery && searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter(n => 
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.author.toLowerCase().includes(query) ||
          n.targetAudience.toLowerCase().includes(query)
        );
      }
    }

    // Authoritative Server-side sorting:
    // 1. Important / Pinned notices ALWAYS appear pinned at the top
    // 2. Newest notice first
    result.sort((a, b) => {
      const aImportant = isNoticeImportant(a);
      const bImportant = isNoticeImportant(b);

      if (aImportant && !bImportant) return -1;
      if (!aImportant && bImportant) return 1;

      // Secondary: Sort by date / createdAt (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime() || 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });

    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, data: [], error: (err as Error).message };
  }
}

/**
 * Local Fallback: createNotice
 */
export function createNotice(
  actor: CurrentUser,
  currentNotices: Notice[],
  input: CreateNoticeInput
): { success: boolean; data?: Notice[]; createdNotice?: Notice; error?: string } {
  try {
    assertNoticeAdminAuthorization(actor);

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Validation Error: Notice headline is required.');
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new Error('Validation Error: Notice content cannot be empty.');
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const nowIso = now.toISOString();
    const isPinnedState = Boolean(input.isPinned || input.isImportant);

    const newNotice: Notice = {
      id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category || 'GENERAL',
      priority: input.priority || 'NORMAL',
      date: formattedDate,
      createdAt: nowIso,
      updatedAt: nowIso,
      author: actor.name,
      authorRole: actor.role === 'ADMIN' ? 'Society Administration' : 'Management Office',
      targetAudience: input.targetAudience?.trim() || 'All Residents & Homeowners',
      isPinned: isPinnedState,
      isImportant: isPinnedState,
    };

    const updatedNotices = [newNotice, ...currentNotices];
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(updatedNotices));

    return { 
      success: true, 
      data: updatedNotices, 
      createdNotice: newNotice 
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Local Fallback: updateNotice
 */
export function updateNotice(
  actor: CurrentUser,
  currentNotices: Notice[],
  noticeId: string,
  updates: UpdateNoticeInput
): { success: boolean; data?: Notice[]; updatedNotice?: Notice; error?: string } {
  try {
    assertNoticeAdminAuthorization(actor);

    const existingIndex = currentNotices.findIndex(n => n.id === noticeId);
    if (existingIndex === -1) {
      throw new Error(`Not Found: Notice with ID ${noticeId} does not exist.`);
    }

    if (updates.title !== undefined && updates.title.trim().length === 0) {
      throw new Error('Validation Error: Notice headline cannot be empty.');
    }

    if (updates.content !== undefined && updates.content.trim().length === 0) {
      throw new Error('Validation Error: Notice content cannot be empty.');
    }

    const existing = currentNotices[existingIndex];
    const isPinnedUpdated = updates.isPinned !== undefined 
      ? updates.isPinned 
      : updates.isImportant !== undefined 
      ? updates.isImportant 
      : existing.isPinned;

    const modifiedNotice: Notice = {
      ...existing,
      ...(updates.title !== undefined && { title: updates.title.trim() }),
      ...(updates.content !== undefined && { content: updates.content.trim() }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.targetAudience !== undefined && { targetAudience: updates.targetAudience.trim() }),
      isPinned: isPinnedUpdated,
      isImportant: isPinnedUpdated,
      updatedAt: new Date().toISOString(),
    };

    const updatedNotices = [...currentNotices];
    updatedNotices[existingIndex] = modifiedNotice;
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(updatedNotices));

    return { 
      success: true, 
      data: updatedNotices, 
      updatedNotice: modifiedNotice 
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Local Fallback: deleteNotice
 */
export function deleteNotice(
  actor: CurrentUser,
  currentNotices: Notice[],
  noticeId: string
): { success: boolean; data?: Notice[]; error?: string } {
  try {
    assertNoticeAdminAuthorization(actor);

    const exists = currentNotices.some(n => n.id === noticeId);
    if (!exists) {
      throw new Error(`Not Found: Notice with ID ${noticeId} does not exist.`);
    }

    const updatedNotices = currentNotices.filter(n => n.id !== noticeId);
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(updatedNotices));

    return { success: true, data: updatedNotices };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Local Fallback: toggleNoticeImportance
 */
export function toggleNoticeImportance(
  actor: CurrentUser,
  currentNotices: Notice[],
  noticeId: string,
  targetState?: boolean
): { success: boolean; data?: Notice[]; error?: string; isImportant?: boolean } {
  try {
    assertNoticeAdminAuthorization(actor);

    const existing = currentNotices.find(n => n.id === noticeId);
    if (!existing) {
      throw new Error(`Not Found: Notice with ID ${noticeId} does not exist.`);
    }

    const nextState = targetState !== undefined ? targetState : !isNoticeImportant(existing);

    const updatedNotices = currentNotices.map(n => {
      if (n.id === noticeId) {
        return {
          ...n,
          isPinned: nextState,
          isImportant: nextState,
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(updatedNotices));

    return { success: true, data: updatedNotices, isImportant: nextState };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}
