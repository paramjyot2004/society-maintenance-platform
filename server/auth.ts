import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma, getPrisma } from './db';
import type { Role } from '@prisma/client';

dotenv.config();

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'oakwood-residency-default-jwt-secret-key-do-not-use-in-prod';
}

export function getAdminSetupSecret(): string {
  return process.env.ADMIN_SETUP_SECRET || 'oakwood-admin-bootstrap-secret-change-in-production';
}

const JWT_EXPIRES_IN = '7d';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  unitNumber?: string | null;
  tower?: string | null;
  phone?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Hash password securely with bcrypt salt rounds
 */
export async function hashPassword(plainText: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainText, saltRounds);
}

/**
 * Compare plain text password against stored hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate signed JWT token
 */
export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      unitNumber: payload.unitNumber || null,
      tower: payload.tower || null,
      phone: payload.phone || null,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token and extract payload
 */
export function verifyToken(token: string): AuthUserPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUserPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * In-memory fallback user store when database is connecting or unmigrated in dev
 */
export interface InMemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  unitNumber?: string | null;
  tower?: string | null;
  phone?: string | null;
  createdAt: Date;
}

export const inMemoryUsers: Map<string, InMemoryUser> = new Map();

// Initialize in-memory seed users with securely hashed passwords
async function seedDefaultUsers() {
  const defaultAdminPassword = await hashPassword('Admin@Oakwood123');
  const defaultResidentPassword = await hashPassword('Resident@Oakwood123');

  const defaultAdmin: InMemoryUser = {
    id: 'usr-admin-001',
    email: 'admin@oakwoodresidency.com',
    passwordHash: defaultAdminPassword,
    name: 'Eleanor Vance',
    role: 'ADMIN',
    unitNumber: 'Tower A - Office',
    tower: 'Tower A',
    phone: '+1 (555) 019-2834',
    createdAt: new Date()
  };

  const defaultResident: InMemoryUser = {
    id: 'usr-res-104b',
    email: 'sarah.c@oakwood.com',
    passwordHash: defaultResidentPassword,
    name: 'Sarah Connor',
    role: 'RESIDENT',
    unitNumber: '104-B',
    tower: 'Tower B',
    phone: '+1 (555) 234-5678',
    createdAt: new Date()
  };

  inMemoryUsers.set(defaultAdmin.email.toLowerCase(), defaultAdmin);
  inMemoryUsers.set(defaultResident.email.toLowerCase(), defaultResident);

  // Also seed into DB if DB is accessible
  try {
    const client = getPrisma();
    if (client) {
      const adminExists = await client.user.findUnique({ where: { email: defaultAdmin.email } });
      if (!adminExists) {
        await client.user.create({
          data: {
            id: defaultAdmin.id,
            email: defaultAdmin.email,
            password: defaultAdminPassword,
            name: defaultAdmin.name,
            role: 'ADMIN',
            unitNumber: defaultAdmin.unitNumber,
            tower: defaultAdmin.tower,
            phone: defaultAdmin.phone
          }
        });
      }
      const resExists = await client.user.findUnique({ where: { email: defaultResident.email } });
      if (!resExists) {
        await client.user.create({
          data: {
            id: defaultResident.id,
            email: defaultResident.email,
            password: defaultResidentPassword,
            name: defaultResident.name,
            role: 'RESIDENT',
            unitNumber: defaultResident.unitNumber,
            tower: defaultResident.tower,
            phone: defaultResident.phone
          }
        });
      }
    }
  } catch (err) {
    // Non-blocking fallback to inMemory store
  }
}

// Seed on module start
seedDefaultUsers().catch(console.error);

/**
 * Find user by email from Prisma DB with fallback to in-memory store
 */
export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (dbUser) return dbUser;
  } catch (err) {
    // Database connection or table not ready yet, fallback to in-memory
  }

  const memUser = inMemoryUsers.get(normalizedEmail);
  if (memUser) {
    return {
      id: memUser.id,
      email: memUser.email,
      password: memUser.passwordHash,
      name: memUser.name,
      role: memUser.role,
      unitNumber: memUser.unitNumber,
      tower: memUser.tower,
      phone: memUser.phone,
      avatar: null,
      createdAt: memUser.createdAt,
      updatedAt: memUser.createdAt
    };
  }

  return null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id }
    });
    if (dbUser) return dbUser;
  } catch (err) {
    // Fallback to in-memory
  }

  for (const user of inMemoryUsers.values()) {
    if (user.id === id) {
      return {
        id: user.id,
        email: user.email,
        password: user.passwordHash,
        name: user.name,
        role: user.role,
        unitNumber: user.unitNumber,
        tower: user.tower,
        phone: user.phone,
        avatar: null,
        createdAt: user.createdAt,
        updatedAt: user.createdAt
      };
    }
  }

  return null;
}

/**
 * Create new user in DB (or in-memory store if DB is offline)
 */
export async function createNewUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  unitNumber?: string | null;
  tower?: string | null;
  phone?: string | null;
}) {
  const normalizedEmail = data.email.trim().toLowerCase();
  const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

  // Store in in-memory map
  const memUser: InMemoryUser = {
    id,
    email: normalizedEmail,
    passwordHash: data.passwordHash,
    name: data.name.trim(),
    role: data.role,
    unitNumber: data.unitNumber || null,
    tower: data.tower || null,
    phone: data.phone || null,
    createdAt: new Date()
  };
  inMemoryUsers.set(normalizedEmail, memUser);

  // Attempt database save
  try {
    const dbUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: data.passwordHash,
        name: data.name.trim(),
        role: data.role,
        unitNumber: data.unitNumber || null,
        tower: data.tower || null,
        phone: data.phone || null,
      }
    });
    return dbUser;
  } catch (err) {
    // Return memory user if DB is unavailable
    return {
      id: memUser.id,
      email: memUser.email,
      password: memUser.passwordHash,
      name: memUser.name,
      role: memUser.role,
      unitNumber: memUser.unitNumber,
      tower: memUser.tower,
      phone: memUser.phone,
      avatar: null,
      createdAt: memUser.createdAt,
      updatedAt: memUser.createdAt
    };
  }
}

/**
 * Extract auth token from Authorization header or Cookie
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

/**
 * Authentication Middleware: Validates JWT and attaches verified user payload
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    req.user = undefined;
    next();
    return;
  }

  req.user = payload;
  next();
}

/**
 * Strict authentication guard: Rejects unauthenticated requests (HTTP 401)
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.',
      code: 'UNAUTHENTICATED'
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication session.',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Admin authorization guard: Server-side check that strictly enforces ADMIN role (HTTP 403)
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Forbidden. Administrator access required.',
        code: 'FORBIDDEN_ADMIN_ONLY'
      });
      return;
    }
    next();
  });
}

/**
 * Resident authorization guard: Server-side check that ensures user is authenticated as RESIDENT (or ADMIN)
 */
export function requireResident(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.user || (req.user.role !== 'RESIDENT' && req.user.role !== 'ADMIN')) {
      res.status(403).json({
        success: false,
        error: 'Forbidden. Resident access required.',
        code: 'FORBIDDEN_RESIDENT_ONLY'
      });
      return;
    }
    next();
  });
}
