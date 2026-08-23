/**
 * Reusable HTML and Plaintext Email Templates for Oakwood Residency Notifications
 */

export interface ComplaintStatusEmailData {
  complaintId: string;
  ticketNumber: string;
  title: string;
  description?: string;
  residentName: string;
  residentEmail: string;
  unitNumber: string;
  tower: string;
  previousStatus: string;
  newStatus: string;
  note?: string;
  adminName?: string;
  updatedAt?: string;
  appUrl?: string;
}

export interface ImportantNoticeEmailData {
  noticeId: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  publishedBy: string;
  authorRole?: string;
  date: string;
  appUrl?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  OPEN: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', label: 'OPEN' },
  SUBMITTED: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', label: 'SUBMITTED' },
  IN_PROGRESS: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE', label: 'IN PROGRESS' },
  IN_REVIEW: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE', label: 'IN REVIEW' },
  RESOLVED: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', label: 'RESOLVED (CLOSED)' },
  CLOSED: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', label: 'CLOSED' },
  ON_HOLD: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', label: 'ON HOLD' },
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

/**
 * Generates responsive HTML and plaintext for Complaint Status Updates
 */
export function renderComplaintStatusEmail(data: ComplaintStatusEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const currentStatusTheme = STATUS_COLORS[data.newStatus] || {
    bg: '#F3F4F6',
    text: '#1F2937',
    border: '#E5E7EB',
    label: formatStatus(data.newStatus)
  };

  const subject = `[${data.ticketNumber}] Complaint Status Updated to ${formatStatus(data.newStatus)} - Oakwood Residency`;

  const dateStr = data.updatedAt 
    ? new Date(data.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;">
                      Maintenance Portal
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                      Oakwood Residency
                    </h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">
                      Complaint Status Notification
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Hello <strong>${data.residentName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                The status of your maintenance complaint registered for <strong>Unit ${data.unitNumber} (${data.tower})</strong> has been updated by the society administration.
              </p>

              <!-- Status Transition Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 18px 20px;">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Ticket Identifier
                    </span>
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                      ${data.ticketNumber}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="45%" valign="top">
                          <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px;">Previous Status</span>
                          <span style="display: inline-block; font-size: 12px; font-weight: 700; color: #475569; background-color: #e2e8f0; padding: 4px 10px; border-radius: 6px;">
                            ${formatStatus(data.previousStatus)}
                          </span>
                        </td>
                        <td width="10%" align="center" style="color: #94a3b8; font-size: 16px; font-weight: bold;">
                          ➔
                        </td>
                        <td width="45%" valign="top" align="right">
                          <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px;">Current New Status</span>
                          <span style="display: inline-block; font-size: 12px; font-weight: 800; color: ${currentStatusTheme.text}; background-color: ${currentStatusTheme.bg}; border: 1px solid ${currentStatusTheme.border}; padding: 4px 10px; border-radius: 6px;">
                            ${currentStatusTheme.label}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Ticket Details -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b; width: 140px; font-weight: 600;">
                    Subject / Title
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 600;">
                    ${data.title}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-weight: 600;">
                    Updated On
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
                    ${dateStr}
                  </td>
                </tr>
                ${data.adminName ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-weight: 600;">
                    Updated By
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">
                    ${data.adminName} (Society Administration)
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Admin Note / Resolution Remarks (if any) -->
              ${data.note ? `
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 4px;">
                  ${data.newStatus === 'RESOLVED' || data.newStatus === 'CLOSED' ? 'Resolution & Closing Remarks:' : 'Admin Note / Update:'}
                </div>
                <div style="font-size: 13px; color: #14532d; line-height: 1.5;">
                  ${data.note}
                </div>
              </div>
              ` : ''}

              <!-- Closing info -->
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                You can log into your resident dashboard anytime to view the live activity logs, converse with assigned technicians, or leave your service feedback once resolved.
              </p>

              <!-- Button CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${data.appUrl || '#'}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; border: 1px solid #0f172a;">
                      Open Resident Portal
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                Oakwood Residency Homeowners Association
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This automated notification was delivered via Resend. For urgent facility emergencies, please call the 24/7 security control room.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
OAKWOOD RESIDENCY - COMPLAINT STATUS UPDATE

Hello ${data.residentName},

The status of your maintenance complaint for Unit ${data.unitNumber} (${data.tower}) has been updated.

--------------------------------------------------
Ticket ID:       ${data.ticketNumber}
Title:           ${data.title}
Previous Status: ${formatStatus(data.previousStatus)}
New Status:      ${formatStatus(data.newStatus)}
Updated At:      ${dateStr}
${data.adminName ? `Updated By:      ${data.adminName}\n` : ''}
${data.note ? `\nRemarks / Note:\n${data.note}\n` : ''}
--------------------------------------------------

You can view your complaint details and post comments in the resident portal.

Oakwood Residency Homeowners Association
Delivered via Resend
  `.trim();

  return { subject, html, text };
}

/**
 * Generates responsive HTML and plaintext for Important Circulars / Notices
 */
export function renderImportantNoticeEmail(data: ImportantNoticeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `📌 [IMPORTANT CIRCULAR] ${data.title} - Oakwood Residency`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #78350f 0%, #b45309 100%); padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;">
                      📌 Important Notice Broadcast
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                      Oakwood Residency Circular
                    </h1>
                    <p style="margin: 4px 0 0 0; color: #fde68a; font-size: 13px;">
                      Published by Society Administration for All Residents
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Category & Priority Badges -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; margin-right: 6px;">
                      ${data.category}
                    </span>
                    ${data.priority === 'URGENT' ? `
                    <span style="display: inline-block; background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 6px;">
                      URGENT ATTENTION
                    </span>
                    ` : `
                    <span style="display: inline-block; background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px;">
                      ${data.priority} PRIORITY
                    </span>
                    `}
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748b;">
                    ${data.date}
                  </td>
                </tr>
              </table>

              <!-- Notice Title -->
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.4;">
                ${data.title}
              </h2>

              <!-- Metadata Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #475569;">
                    <strong>Target Audience:</strong> ${data.targetAudience}
                  </td>
                  <td align="right" style="font-size: 12px; color: #475569;">
                    <strong>Author:</strong> ${data.publishedBy} ${data.authorRole ? `(${data.authorRole})` : ''}
                  </td>
                </tr>
              </table>

              <!-- Notice Body -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-line;">
${data.content}
              </div>

              <!-- Button CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${data.appUrl || '#'}" target="_blank" style="display: inline-block; background-color: #b45309; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px;">
                      View on Society Notice Board
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                Oakwood Residency Homeowners Association
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This important broadcast notice was emailed to registered residents via Resend.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
📌 [IMPORTANT NOTICE BROADCAST] - OAKWOOD RESIDENCY

Headline:        ${data.title}
Category:        ${data.category}
Priority:        ${data.priority}
Target Audience: ${data.targetAudience}
Published Date:  ${data.date}
Published By:    ${data.publishedBy} ${data.authorRole ? `(${data.authorRole})` : ''}

--------------------------------------------------
ANNOUNCEMENT DETAILS:
--------------------------------------------------
${data.content}

--------------------------------------------------
Please visit the Society Notice Board in the resident portal for full updates.

Oakwood Residency Homeowners Association
Delivered via Resend
  `.trim();

  return { subject, html, text };
}
