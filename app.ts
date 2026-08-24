import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { Resend } from 'resend';
import { 
  renderComplaintStatusEmail, 
  renderImportantNoticeEmail,
  ComplaintStatusEmailData,
  ImportantNoticeEmailData
} from './server/emailTemplates';
import {
  hashPassword,
  comparePassword,
  generateToken,
  findUserByEmail,
  createNewUser,
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireResident,
  getAdminSetupSecret,
  AuthenticatedRequest
} from './server/auth';
import {
  createResidentComplaintHandler,
  getResidentComplaintsHandler,
  getResidentComplaintByIdHandler,
  getAdminComplaintsHandler,
  updateAdminComplaintStatusHandler,
  updateAdminComplaintPriorityHandler,
  getAdminComplaintStatusHistoryHandler,
  getAdminSettingsHandler,
  updateAdminSettingsHandler,
  getAdminDashboardStatsHandler
} from './server/complaints';
import {
  getNoticesHandler,
  createNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler
} from './server/notices';
import {
  isResendConfigured,
  getSenderEmail,
  getDeduplicationCacheSize,
  sendComplaintStatusChangeEmail,
  sendImportantNoticeBroadcastEmail
} from './server/email';
import { getPhotoUploadStatusHandler } from './server/upload';

// Load environment variables
dotenv.config();

export const app = express();
const PORT = 3000;

// Parsers Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(authenticateToken);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// -------------------------------------------------------------
// Authentication & RBAC API Routes
// -------------------------------------------------------------

/**
 * Resident Registration Endpoint
 * Security Enforcements:
 * - Passwords securely hashed with bcrypt
 * - ALWAYS forces role to RESIDENT (public users cannot register as ADMIN)
 * - Validates input fields and checks duplicate email
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, unitNumber, tower, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required.'
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Create resident user - STRICLY RESIDENT ROLE
    const newUser = await createNewUser({
      email,
      passwordHash,
      name,
      role: 'RESIDENT', // Enforce RESIDENT
      unitNumber: unitNumber || '',
      tower: tower || '',
      phone: phone || ''
    });

    // Generate JWT
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      unitNumber: newUser.unitNumber,
      tower: newUser.tower,
      phone: newUser.phone
    });

    // Set secure HTTP cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'Resident account created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        unitNumber: newUser.unitNumber,
        tower: newUser.tower,
        phone: newUser.phone
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create resident account. Please try again.'
    });
  }
});

/**
 * Login Endpoint
 * - Validates credentials against DB / secure hash
 * - Returns signed JWT and sets HTTP cookie
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      unitNumber: user.unitNumber,
      tower: user.tower,
      phone: user.phone
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        unitNumber: user.unitNumber,
        tower: user.tower,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during login.'
    });
  }
});

/**
 * Logout Endpoint
 */
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

/**
 * Get Verified Current User Session (/api/auth/me)
 * Guarded server-side via requireAuth
 */
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

/**
 * Secure Admin Bootstrap / Creation Endpoint
 * Admins CANNOT be registered through public signup.
 * Requires secret header 'x-admin-setup-secret' matching ADMIN_SETUP_SECRET.
 */
app.post('/api/auth/admin/bootstrap', async (req, res) => {
  try {
    const providedSecret = req.headers['x-admin-setup-secret'] || req.body.setupSecret;
    if (!providedSecret || providedSecret !== getAdminSetupSecret()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. Invalid administrator setup authorization secret.',
        code: 'INVALID_ADMIN_SECRET'
      });
    }

    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Admin email, password, and name are required.'
      });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    const passwordHash = await hashPassword(password);
    const newAdmin = await createNewUser({
      email,
      passwordHash,
      name,
      role: 'ADMIN',
      unitNumber: 'Management Office',
      tower: 'Tower A',
      phone: phone || '+1 (555) 019-2834'
    });

    return res.status(201).json({
      success: true,
      message: 'Administrator provisioned securely.',
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      }
    });
  } catch (error: any) {
    console.error('Admin bootstrap error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to provision administrator.'
    });
  }
});

/**
 * Admin Verification Endpoint - Strictly Protected by requireAdmin
 */
app.get('/api/admin/verify', requireAdmin, (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    message: 'Authorized as Administrator.',
    admin: req.user
  });
});

/**
 * Resident Verification Endpoint - Strictly Protected by requireResident
 */
app.get('/api/resident/verify', requireResident, (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    message: 'Authorized as Resident.',
    resident: req.user
  });
});

// -------------------------------------------------------------
// Step 4: Resident Complaint & Photo Storage APIs
// -------------------------------------------------------------

/**
 * Check photo upload storage availability
 */
app.get('/api/uploads/status', getPhotoUploadStatusHandler);

/**
 * Resident Complaint Endpoints
 * - Protected strictly by requireResident
 * - Identity derived server-side from req.user
 */
app.post('/api/complaints', requireResident, createResidentComplaintHandler);
app.get('/api/complaints', requireResident, getResidentComplaintsHandler);
app.get('/api/complaints/:id', requireAuth, getResidentComplaintByIdHandler);

// -------------------------------------------------------------
// Step 5: Admin Complaint Management APIs
// -------------------------------------------------------------

/**
 * Admin Complaint Endpoints
 * - Strictly protected by requireAdmin
 * - Admin can:
 *   1. View all complaints with category, status, date, search filters (GET /api/admin/complaints)
 *   2. Change priority: LOW, MEDIUM, HIGH (PATCH /api/admin/complaints/:id/priority)
 *   3. Change status: OPEN -> IN_PROGRESS -> RESOLVED with optional note (PATCH /api/admin/complaints/:id/status)
 *   4. View complete status history (GET /api/admin/complaints/:id/history)
 * - RESOLVED is terminal and cannot be reopened
 * - Residents forbidden server-side
 */
app.get('/api/admin/complaints', requireAdmin, getAdminComplaintsHandler);
app.get('/api/admin/complaints/:id', requireAdmin, getResidentComplaintByIdHandler);
app.patch('/api/admin/complaints/:id/status', requireAdmin, updateAdminComplaintStatusHandler);
app.patch('/api/admin/complaints/:id/priority', requireAdmin, updateAdminComplaintPriorityHandler);
app.get('/api/admin/complaints/:id/history', requireAdmin, getAdminComplaintStatusHistoryHandler);

// Also map direct /api/complaints/:id mutations to requireAdmin
app.patch('/api/complaints/:id/status', requireAdmin, updateAdminComplaintStatusHandler);
app.patch('/api/complaints/:id/priority', requireAdmin, updateAdminComplaintPriorityHandler);

// -------------------------------------------------------------
// Step 6: Overdue Complaint Detection & SLA Settings APIs
// -------------------------------------------------------------
app.get('/api/admin/settings', requireAdmin, getAdminSettingsHandler);
app.get('/api/admin/settings/overdue-threshold', requireAdmin, getAdminSettingsHandler);
app.put('/api/admin/settings/overdue-threshold', requireAdmin, updateAdminSettingsHandler);
app.post('/api/admin/settings/overdue-threshold', requireAdmin, updateAdminSettingsHandler);
app.patch('/api/admin/settings/overdue-threshold', requireAdmin, updateAdminSettingsHandler);

// -------------------------------------------------------------
// Step 9: Admin Dashboard Statistics & Real-time Metrics APIs
// - Strictly protected by requireAdmin
// - Computes real aggregated statistics from database server-side
// -------------------------------------------------------------
app.get('/api/admin/dashboard/stats', requireAdmin, getAdminDashboardStatsHandler);
app.get('/api/admin/dashboard', requireAdmin, getAdminDashboardStatsHandler);
app.get('/api/admin/stats', requireAdmin, getAdminDashboardStatsHandler);

// -------------------------------------------------------------
// Step 7: Notice Board APIs
// -------------------------------------------------------------
// Public / Resident & Admin: View notices (Important/Pinned at top)
app.get('/api/notices', getNoticesHandler);

// Admin Only: Notice Management (Create, Edit, Delete, Pin/Mark Important)
app.post('/api/notices', requireAdmin, createNoticeHandler);
app.post('/api/admin/notices', requireAdmin, createNoticeHandler);
app.put('/api/notices/:id', requireAdmin, updateNoticeHandler);
app.patch('/api/notices/:id', requireAdmin, updateNoticeHandler);
app.put('/api/admin/notices/:id', requireAdmin, updateNoticeHandler);
app.patch('/api/admin/notices/:id', requireAdmin, updateNoticeHandler);
app.delete('/api/notices/:id', requireAdmin, deleteNoticeHandler);
app.delete('/api/admin/notices/:id', requireAdmin, deleteNoticeHandler);

// -------------------------------------------------------------
// Step 8: Email Notifications APIs (Resend Integration)
// -------------------------------------------------------------

/**
 * Endpoint for downloading complete Steps 1-4 Project ZIP archive
 */
app.get('/api/download-project-zip', (req, res) => {
  const zipPath = path.join(process.cwd(), 'oakwood-residency-steps-1-4.zip');
  res.download(zipPath, 'oakwood-residency-steps-1-4.zip');
});

/**
 * Health & Resend Configuration Status
 */
app.get('/api/notifications/status', (req, res) => {
  res.json({
    status: 'ok',
    resendConfigured: isResendConfigured(),
    senderEmail: getSenderEmail(),
    deduplicationCacheSize: getDeduplicationCacheSize()
  });
});

/**
 * Endpoint 1: Send email notification when admin changes a complaint status
 * Requirement:
 * - Send an email to the complaint's resident.
 * - Include complaint identifier/details and the new status.
 * - Do not send duplicate emails unnecessarily.
 * - Handle failures gracefully without corrupting transaction.
 * - If Resend is not configured: do not crash, clearly indicate not configured, do not fake delivery.
 */
app.post('/api/notifications/complaint-status', async (req, res) => {
  try {
    const result = await sendComplaintStatusChangeEmail(req.body);
    return res.json(result);
  } catch (err: unknown) {
    console.error('[Resend Route Error]:', err);
    return res.json({
      success: false,
      configured: isResendConfigured(),
      delivered: false,
      error: (err as Error).message || 'Failed to dispatch complaint status email'
    });
  }
});

/**
 * Endpoint 2: Send email notification when admin publishes an IMPORTANT notice
 * Requirement:
 * - When an admin publishes an IMPORTANT notice, send an email notification to residents.
 * - Handle email failures gracefully.
 * - Do not send duplicate emails unnecessarily.
 * - If Resend is not configured: do not crash, clearly indicate not configured, do not fake delivery.
 */
app.post('/api/notifications/important-notice', async (req, res) => {
  try {
    const result = await sendImportantNoticeBroadcastEmail(req.body);
    return res.json(result);
  } catch (err: unknown) {
    console.error('[Resend Route Error]:', err);
    return res.json({
      success: false,
      configured: isResendConfigured(),
      delivered: false,
      error: (err as Error).message || 'Failed to dispatch important notice email broadcast'
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oakwood Residency App server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
