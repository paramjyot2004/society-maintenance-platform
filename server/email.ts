import { Resend } from 'resend';
import {
  ComplaintStatusEmailData,
  ImportantNoticeEmailData,
  renderComplaintStatusEmail,
  renderImportantNoticeEmail
} from './emailTemplates';

/**
 * Lazy initialization of Resend client to avoid module-load crashes if key is missing.
 */
let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey.trim());
  }
  return resendInstance;
}

export function isResendConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY;
  return Boolean(apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0);
}

export function getSenderEmail(): string {
  return process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim() !== ''
    ? process.env.RESEND_FROM_EMAIL.trim()
    : 'Oakwood Residency <onboarding@resend.dev>';
}

// In-memory deduplication set to avoid sending duplicate emails unnecessarily
// Key: `status_${complaintId}_${newStatus}_${previousStatus}` or `notice_important_${noticeId}`
const sentEmailsCache = new Map<string, number>();

// Clean up old cache entries periodically (older than 24 hours)
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of sentEmailsCache.entries()) {
    if (timestamp < cutoff) {
      sentEmailsCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

export function getDeduplicationCacheSize(): number {
  return sentEmailsCache.size;
}

/**
 * Sends a complaint status change email to the resident.
 * 
 * Rules:
 * 1. Never crashes the application if Resend is not configured or errors out.
 * 2. Clearly indicates whether email service is configured and whether email was actually delivered.
 * 3. Never fakes successful email delivery.
 * 4. Deduplicates rapid duplicate requests for identical status changes.
 */
export async function sendComplaintStatusChangeEmail(
  data: ComplaintStatusEmailData
): Promise<{
  success: boolean;
  configured: boolean;
  delivered: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
  ticketNumber?: string;
  recipient?: string;
  emailId?: string;
}> {
  try {
    const { complaintId, ticketNumber, newStatus, previousStatus, residentEmail } = data;

    if (!complaintId || !ticketNumber || !newStatus || !residentEmail) {
      return {
        success: false,
        configured: isResendConfigured(),
        delivered: false,
        error: 'Missing required complaint status email fields (complaintId, ticketNumber, newStatus, residentEmail)'
      };
    }

    // Deduplication check (prevent duplicate send within 60s for identical state transition)
    const dedupKey = `status_${complaintId}_${newStatus}_${previousStatus || ''}`;
    const lastSent = sentEmailsCache.get(dedupKey);
    const now = Date.now();

    if (lastSent && now - lastSent < 60 * 1000) {
      console.log(`[Resend] Skipping duplicate status email for ${ticketNumber} -> ${newStatus}`);
      return {
        success: true,
        configured: isResendConfigured(),
        delivered: false,
        skipped: true,
        message: 'Duplicate email prevented by deduplication safeguard',
        ticketNumber,
        recipient: residentEmail
      };
    }

    const appUrl = process.env.APP_URL || '';
    const emailPayload = renderComplaintStatusEmail({
      ...data,
      appUrl
    });

    const resend = getResendClient();
    const fromEmail = getSenderEmail();

    // If Resend is NOT configured: clearly indicate that email is not configured and NOT delivered
    if (!resend) {
      console.warn('[Resend] RESEND_API_KEY is not configured in environment variables.');
      return {
        success: false,
        configured: false,
        delivered: false,
        error: 'Email service is not configured (RESEND_API_KEY is missing). No email was sent.',
        message: 'Resend API key is not configured. Email notification was skipped.',
        ticketNumber,
        recipient: residentEmail
      };
    }

    // Dispatch via Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: [residentEmail],
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text
    });

    if (result.error) {
      console.error('[Resend Error sending complaint status email]:', result.error);
      return {
        success: false,
        configured: true,
        delivered: false,
        error: result.error.message || 'Resend delivery failed',
        ticketNumber,
        recipient: residentEmail
      };
    }

    // Store in deduplication cache
    sentEmailsCache.set(dedupKey, now);

    console.log(`[Resend] Successfully dispatched complaint status email for ${ticketNumber} to ${residentEmail} (ID: ${result.data?.id})`);
    return {
      success: true,
      configured: true,
      delivered: true,
      emailId: result.data?.id,
      ticketNumber,
      recipient: residentEmail,
      message: `Email successfully delivered to ${residentEmail}`
    };
  } catch (err: unknown) {
    console.error('[Resend Exception Handler - Complaint Status Email]:', err);
    return {
      success: false,
      configured: isResendConfigured(),
      delivered: false,
      error: (err as Error).message || 'Unexpected exception while sending email'
    };
  }
}

/**
 * Sends an email broadcast to residents when an important notice is published.
 * 
 * Rules:
 * 1. Never crashes the application if Resend is not configured.
 * 2. Clearly indicates whether email service is configured and whether email was actually delivered.
 * 3. Never fakes successful email delivery.
 * 4. Deduplicates rapid duplicate broadcasts for identical notice within 120s.
 */
export async function sendImportantNoticeBroadcastEmail(
  data: ImportantNoticeEmailData & { recipientEmails?: Array<{ email: string; name?: string }> }
): Promise<{
  success: boolean;
  configured: boolean;
  delivered: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
  noticeId?: string;
  totalRecipients?: number;
  successfulDeliveries?: number;
  details?: Array<{ email: string; success: boolean; id?: string; error?: string }>;
}> {
  try {
    const { noticeId, title, content, recipientEmails } = data;

    if (!noticeId || !title || !content) {
      return {
        success: false,
        configured: isResendConfigured(),
        delivered: false,
        error: 'Missing required notice fields (noticeId, title, content)'
      };
    }

    // Default recipients list if not provided
    const targetRecipients: Array<{ email: string; name?: string }> =
      recipientEmails && recipientEmails.length > 0
        ? recipientEmails
        : [
            { email: 'sarah.jenkins@oakwood.io', name: 'Sarah Jenkins' },
            { email: 'anita.desai@email.com', name: 'Anita Desai' },
            { email: 'm.chang@techhub.io', name: 'Michael Chang' },
            { email: 'robert.fox@global.net', name: 'Robert Fox' },
            { email: 'emma.watson@design.co', name: 'Emma Watson' }
          ];

    // Filter valid emails
    const validEmails = targetRecipients
      .map(r => r.email)
      .filter(e => Boolean(e && typeof e === 'string' && e.includes('@')));

    if (validEmails.length === 0) {
      return {
        success: false,
        configured: isResendConfigured(),
        delivered: false,
        error: 'No valid resident recipient emails found'
      };
    }

    // Deduplication check (prevent duplicate broadcasts within 120s)
    const dedupKey = `notice_important_${noticeId}`;
    const lastSent = sentEmailsCache.get(dedupKey);
    const now = Date.now();

    if (lastSent && now - lastSent < 120 * 1000) {
      console.log(`[Resend] Skipping duplicate important notice broadcast for ${noticeId}`);
      return {
        success: true,
        configured: isResendConfigured(),
        delivered: false,
        skipped: true,
        message: 'Duplicate important notice email broadcast prevented by deduplication safeguard',
        noticeId,
        totalRecipients: validEmails.length,
        successfulDeliveries: 0
      };
    }

    const appUrl = process.env.APP_URL || '';
    const emailPayload = renderImportantNoticeEmail({
      ...data,
      appUrl
    });

    const resend = getResendClient();
    const fromEmail = getSenderEmail();

    // If Resend is NOT configured: clearly indicate that email is not configured and NOT delivered
    if (!resend) {
      console.warn('[Resend] RESEND_API_KEY is not configured in environment variables.');
      return {
        success: false,
        configured: false,
        delivered: false,
        error: 'Email service is not configured (RESEND_API_KEY is missing). Notice emails were not sent.',
        message: 'Resend API key is not configured. Important notice broadcast email was skipped.',
        noticeId,
        totalRecipients: validEmails.length,
        successfulDeliveries: 0
      };
    }

    // Dispatch via Resend to each resident
    const results: Array<{ email: string; success: boolean; id?: string; error?: string }> = [];

    for (const email of validEmails) {
      try {
        const sendRes = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: emailPayload.subject,
          html: emailPayload.html,
          text: emailPayload.text
        });

        if (sendRes.error) {
          results.push({ email, success: false, error: sendRes.error.message });
        } else {
          results.push({ email, success: true, id: sendRes.data?.id });
        }
      } catch (sendErr: unknown) {
        results.push({ email, success: false, error: (sendErr as Error).message });
      }
    }

    sentEmailsCache.set(dedupKey, now);

    const successfulCount = results.filter(r => r.success).length;
    console.log(`[Resend] Important notice broadcast dispatched to ${successfulCount}/${validEmails.length} residents`);

    return {
      success: successfulCount > 0,
      configured: true,
      delivered: successfulCount > 0,
      noticeId,
      totalRecipients: validEmails.length,
      successfulDeliveries: successfulCount,
      details: results,
      message: `Broadcast delivered to ${successfulCount} of ${validEmails.length} residents`
    };
  } catch (err: unknown) {
    console.error('[Resend Exception Handler - Important Notice Email]:', err);
    return {
      success: false,
      configured: isResendConfigured(),
      delivered: false,
      error: (err as Error).message || 'Unexpected exception while broadcasting notice email'
    };
  }
}
