import { Complaint, ComplaintStatus, Notice, SocietyUnit, CurrentUser } from '../types';

export interface EmailServiceResponse {
  success: boolean;
  configured?: boolean;
  delivered?: boolean;
  simulated?: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
  ticketNumber?: string;
  recipient?: string;
  emailId?: string;
  successfulDeliveries?: number;
  totalRecipients?: number;
  details?: Array<{ email: string; success: boolean; id?: string; error?: string }>;
}

/**
 * Checks if Resend email notifications are active & configured on server
 */
export async function checkEmailServiceStatus(): Promise<{
  resendConfigured: boolean;
  senderEmail: string;
}> {
  try {
    const res = await fetch('/api/notifications/status');
    if (!res.ok) {
      return { resendConfigured: false, senderEmail: 'Not configured' };
    }
    const data = await res.json();
    return {
      resendConfigured: Boolean(data.resendConfigured),
      senderEmail: data.senderEmail || 'Oakwood Residency <onboarding@resend.dev>'
    };
  } catch {
    return { resendConfigured: false, senderEmail: 'Not configured' };
  }
}

/**
 * Resolves the resident's verified email address for a given complaint
 */
export function resolveResidentEmail(complaint: Complaint, units: SocietyUnit[] = []): string {
  // 1. Check matching unit in Society Directory
  const matchingUnit = units.find(u => 
    u.unitNumber.toLowerCase().trim() === complaint.unitNumber.toLowerCase().trim()
  );

  if (matchingUnit && matchingUnit.email) {
    return matchingUnit.email;
  }

  // 2. Map known residents by name
  const nameMap: Record<string, string> = {
    'sarah jenkins': 'sarah.jenkins@oakwood.io',
    'anita desai': 'anita.desai@email.com',
    'michael chang': 'm.chang@techhub.io',
    'arthur pendelton': 'm.chang@techhub.io',
    'robert fox': 'robert.fox@global.net',
    'emma watson': 'emma.watson@design.co',
    'priya patel': 'priya.patel@oakwood.io',
    'david kumar': 'david.k@email.com',
    'rajesh sharma': 'secretary@oakwoodresidency.org',
  };

  const normalized = (complaint.residentName || '').toLowerCase().trim();
  if (nameMap[normalized]) {
    return nameMap[normalized];
  }

  // Fallback to standard domain format
  const sanitized = normalized.replace(/\s+/g, '.');
  return sanitized ? `${sanitized}@oakwood.io` : 'sarah.jenkins@oakwood.io';
}

/**
 * Calls backend API to send an email via Resend when an admin changes a complaint status.
 * Rules:
 * - Sends email to the complaint's resident.
 * - Includes complaint identifier/details and the new status.
 * - Handles email failure gracefully without failing or corrupting the main transaction.
 */
export async function sendComplaintStatusEmailNotification(
  complaint: Complaint,
  newStatus: ComplaintStatus,
  previousStatus: ComplaintStatus,
  note?: string,
  actor?: CurrentUser,
  units?: SocietyUnit[]
): Promise<EmailServiceResponse> {
  try {
    const residentEmail = resolveResidentEmail(complaint, units);

    const payload = {
      complaintId: complaint.id,
      ticketNumber: complaint.ticketNumber,
      title: complaint.title,
      description: complaint.description,
      residentName: complaint.residentName,
      residentEmail: residentEmail,
      unitNumber: complaint.unitNumber,
      tower: complaint.tower,
      previousStatus: previousStatus,
      newStatus: newStatus,
      note: note || complaint.resolutionNotes,
      adminName: actor?.name || 'Society Administration',
      updatedAt: new Date().toISOString()
    };

    const res = await fetch('/api/notifications/complaint-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[EmailService] Server returned non-200 for complaint status email:', errText);
      return {
        success: false,
        error: `Server responded with status ${res.status}`
      };
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    // Fail gracefully: Log error, but NEVER throw so the calling transaction proceeds smoothly
    console.error('[EmailService] Failed to send complaint status notification via Resend:', err);
    return {
      success: false,
      error: (err as Error).message || 'Network error while triggering email service'
    };
  }
}

/**
 * Calls backend API to send an email notification when an admin publishes an IMPORTANT notice.
 * Rules:
 * - Sends email notification to registered society residents.
 * - Handles failures gracefully without breaking notice creation/publishing.
 */
export async function sendImportantNoticeEmailNotification(
  notice: Notice,
  units: SocietyUnit[] = []
): Promise<EmailServiceResponse> {
  try {
    // Extract unique resident emails from units directory
    const recipientMap = new Map<string, string>();

    // Add units from society list
    units.forEach(u => {
      if (u.email && u.email.includes('@')) {
        recipientMap.set(u.email.toLowerCase(), u.ownerName || u.tenantName || 'Resident');
      }
    });

    // Ensure sample residents are covered
    if (recipientMap.size === 0) {
      recipientMap.set('sarah.jenkins@oakwood.io', 'Sarah Jenkins');
      recipientMap.set('anita.desai@email.com', 'Anita Desai');
      recipientMap.set('m.chang@techhub.io', 'Michael Chang');
      recipientMap.set('robert.fox@global.net', 'Robert Fox');
      recipientMap.set('emma.watson@design.co', 'Emma Watson');
    }

    const recipientEmails = Array.from(recipientMap.entries()).map(([email, name]) => ({
      email,
      name
    }));

    const payload = {
      noticeId: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      publishedBy: notice.author,
      authorRole: notice.authorRole,
      date: notice.date,
      recipientEmails: recipientEmails
    };

    const res = await fetch('/api/notifications/important-notice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[EmailService] Server returned non-200 for important notice email:', errText);
      return {
        success: false,
        error: `Server responded with status ${res.status}`
      };
    }

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    console.error('[EmailService] Failed to send important notice notification via Resend:', err);
    return {
      success: false,
      error: (err as Error).message || 'Network error while triggering notice email service'
    };
  }
}
