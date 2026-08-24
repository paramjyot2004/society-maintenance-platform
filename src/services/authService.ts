import { CurrentUser, UserRole } from '../types';

const TOKEN_STORAGE_KEY = 'oakwood_auth_token';
const USER_STORAGE_KEY = 'oakwood_auth_user';

export interface RegisterResidentPayload {
  email: string;
  password: string;
  name: string;
  unitNumber: string;
  tower: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    unitNumber?: string | null;
    tower?: string | null;
    phone?: string | null;
    avatar?: string | null;
  };
  error?: string;
  message?: string;
}

/**
 * Get stored JWT token
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store JWT token
 */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.error('Failed to store token in localStorage:', err);
  }
}

/**
 * Remove stored JWT token
 */
export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove token from localStorage:', err);
  }
}

/**
 * Helper to build standard auth headers
 */
export function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Register a new Resident
 * Strictly enforcers role: RESIDENT
 */
export async function registerResident(payload: RegisterResidentPayload): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: AuthResponse = await res.json();
    if (res.ok && data.token && data.user) {
      setStoredToken(data.token);
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error while attempting registration.'
    };
  }
}

/**
 * Login with email and password
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: AuthResponse = await res.json();
    if (res.ok && data.token && data.user) {
      setStoredToken(data.token);
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error while attempting login.'
    };
  }
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<boolean> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    removeStoredToken();
  }
  return true;
}

/**
 * Fetch authenticated current user profile from server (/api/auth/me)
 */
export async function fetchCurrentSessionUser(): Promise<CurrentUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        removeStoredToken();
      }
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      const u = data.user;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        unitNumber: u.unitNumber || '',
        tower: u.tower || '',
        phone: u.phone || '',
        avatar: u.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };
    }
  } catch (err) {
    console.warn('Session verification error:', err);
  }
  return null;
}

/**
 * Verify server-side admin privilege
 */
export async function verifyAdminPrivilege(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/verify', {
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Verify server-side resident access
 */
export async function verifyResidentPrivilege(): Promise<boolean> {
  try {
    const res = await fetch('/api/resident/verify', {
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Update current user profile on server (/api/auth/profile)
 */
export async function updateUserProfile(payload: {
  name?: string;
  phone?: string;
  unitNumber?: string;
  tower?: string;
}): Promise<{ success: boolean; user?: CurrentUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      if (data.token) {
        setStoredToken(data.token);
      }
      const u = data.user;
      const formattedUser: CurrentUser = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        unitNumber: u.unitNumber || '',
        tower: u.tower || '',
        phone: u.phone || '',
        avatar: u.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      };
      return { success: true, user: formattedUser };
    }
    return { success: false, error: data.error || 'Failed to update profile.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating profile.' };
  }
}
