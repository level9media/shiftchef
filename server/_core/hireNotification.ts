// ─── Hire Notification ────────────────────────────────────────────────────────
// Sends a rich email to the hired worker with all shift details.
// Uses Resend if RESEND_API_KEY is set, otherwise logs to console.

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

export interface HireNotificationPayload {
  workerName: string;
  workerEmail?: string | null;
  workerPhone?: string | null;
  employerName: string;
  employerEmail?: string | null;
  employerPhone?: string | null;
  restaurantName?: string | null;
  role: string;
  startTime: number;
  endTime: number;
  payRate: string | number;
  location?: string | null;
  city?: string | null;
  description?: string | null;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

function formatArrivalTime(ms: number) {
  return new Date(ms - 10 * 60 * 1000).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

function buildHireEmailHtml(p: HireNotificationPayload): string {
  const roleLabel = ROLE_LABELS[p.role] ?? p.role;
  const hours = ((p.endTime - p.startTime) / 3600000).toFixed(1);
  const payRate = parseFloat(String(p.payRate));
  const totalPay = (payRate * parseFloat(hours) * 0.9).toFixed(2);
  const startFormatted = formatTime(p.startTime);
  const arrivalTime = formatArrivalTime(p.startTime);
  const endFormatted = new Date(p.endTime).toLocaleString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago",
  });
  const mapsQuery = [p.restaurantName, p.location, p.city].filter(Boolean).join(", ");
  const mapsUrl = mapsQuery
    ? `https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You got the shift!</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FF6B00;border-radius:12px;padding:10px 14px;">
                    <span style="color:white;font-size:18px;font-weight:900;letter-spacing:-0.5px;">Shift<span style="color:rgba(255,255,255,0.7)">Chef</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <h1 style="margin:0 0 8px 0;color:#FFFFFF;font-size:32px;font-weight:900;letter-spacing:-1px;">
                You got the shift! 🎉
              </h1>
              <p style="margin:0;color:#888780;font-size:16px;">
                Congratulations ${p.workerName} — here's everything you need to know.
              </p>
            </td>
          </tr>

          <!-- Shift Details Card -->
          <tr>
            <td style="padding:0 0 16px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #2C2C2A;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #2C2C2A;">
                    <p style="margin:0 0 4px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Shift</p>
                    <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:900;">${roleLabel}${p.restaurantName ? ` at ${p.restaurantName}` : ""}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #2C2C2A;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:50%;padding:0 12px 0 0;">
                          <p style="margin:0 0 4px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">When</p>
                          <p style="margin:0;color:#FFFFFF;font-size:14px;font-weight:600;">${startFormatted}</p>
                          <p style="margin:4px 0 0 0;color:#888780;font-size:13px;">Ends at ${endFormatted} · ${hours}h total</p>
                        </td>
                        <td style="width:50%;padding:0 0 0 12px;">
                          <p style="margin:0 0 4px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Arrive By</p>
                          <p style="margin:0;color:#FF6B00;font-size:20px;font-weight:900;">${arrivalTime}</p>
                          <p style="margin:4px 0 0 0;color:#888780;font-size:13px;">10 minutes early</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${p.location ? `
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #2C2C2A;">
                    <p style="margin:0 0 4px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Location</p>
                    <p style="margin:0;color:#FFFFFF;font-size:14px;font-weight:600;">${p.restaurantName ? `${p.restaurantName} · ` : ""}${p.location}${p.city ? `, ${p.city}` : ""}</p>
                    ${mapsUrl ? `<a href="${mapsUrl}" style="display:inline-block;margin-top:8px;color:#FF6B00;font-size:13px;text-decoration:none;font-weight:600;">📍 Open in Google Maps →</a>` : ""}
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #2C2C2A;">
                    <p style="margin:0 0 4px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Contact</p>
                    <p style="margin:0;color:#FFFFFF;font-size:14px;font-weight:600;">${p.employerName}</p>
                    ${p.employerPhone ? `<a href="tel:${p.employerPhone}" style="display:block;margin-top:4px;color:#FF6B00;font-size:13px;text-decoration:none;">${p.employerPhone}</a>` : ""}
                    ${p.employerEmail ? `<a href="mailto:${p.employerEmail}" style="display:block;margin-top:2px;color:#888780;font-size:12px;">${p.employerEmail}</a>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Pay</p>
                    <p style="margin:0;color:#4ADE80;font-size:24px;font-weight:900;">~$${totalPay}</p>
                    <p style="margin:4px 0 0 0;color:#888780;font-size:13px;">$${payRate.toFixed(2)}/hr × ${hours}h · paid after shift</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${p.description ? `
          <!-- Notes Card -->
          <tr>
            <td style="padding:0 0 16px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #2C2C2A;border-radius:16px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px 0;color:#888780;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Notes from employer</p>
                    <p style="margin:0;color:#D3D1C7;font-size:14px;line-height:1.6;">${p.description}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}

          <!-- Tips Card -->
          <tr>
            <td style="padding:0 0 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1200;border:1px solid #412402;border-radius:16px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px 0;color:#EF9F27;font-size:13px;font-weight:700;">✓ &nbsp;Arrive at ${arrivalTime} — 10 min before shift starts</p>
                    <p style="margin:0 0 12px 0;color:#EF9F27;font-size:13px;font-weight:700;">✓ &nbsp;Tap START SHIFT in the app when you arrive</p>
                    <p style="margin:0 0 12px 0;color:#EF9F27;font-size:13px;font-weight:700;">✓ &nbsp;Tap END SHIFT in the app when you finish</p>
                    <p style="margin:0;color:#EF9F27;font-size:13px;font-weight:700;">✓ &nbsp;Payment releases automatically after employer approves</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0;text-align:center;">
              <p style="margin:0 0 8px 0;color:#444441;font-size:12px;">Questions? Contact your employer directly or reply to this email.</p>
              <p style="margin:0;color:#444441;font-size:12px;">ShiftChef · Austin, TX · <a href="https://shiftchef.co" style="color:#444441;">shiftchef.co</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildRejectionEmailHtml(workerName: string, role: string): string {
  const roleLabel = ROLE_LABELS[role] ?? role;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Application Update</title></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 32px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background:#FF6B00;border-radius:12px;padding:10px 14px;">
                  <span style="color:white;font-size:18px;font-weight:900;">Shift<span style="color:rgba(255,255,255,0.7)">Chef</span></span>
                </td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;">
              <h1 style="margin:0 0 8px 0;color:#FFFFFF;font-size:28px;font-weight:900;">Position filled</h1>
              <p style="margin:0;color:#888780;font-size:16px;line-height:1.6;">
                Hi ${workerName}, the <strong style="color:#FFFFFF;">${roleLabel}</strong> position you applied for has been filled by another candidate.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #2C2C2A;border-radius:16px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 12px 0;color:#FFFFFF;font-size:16px;font-weight:700;">Don't give up — keep applying!</p>
                    <p style="margin:0;color:#888780;font-size:14px;line-height:1.6;">
                      New shifts are posted every day. Workers with complete profiles and higher ratings get hired faster.
                      Check the live feed for new opportunities in your city.
                    </p>
                    <a href="https://shiftchef.co/feed" style="display:inline-block;margin-top:16px;background:#FF6B00;color:white;font-size:14px;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;">Browse Open Shifts →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;color:#444441;font-size:12px;">ShiftChef · <a href="https://shiftchef.co" style="color:#444441;">shiftchef.co</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ShiftChef <notifications@shiftchef.co>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[HireNotification] Resend failed (${res.status}): ${err}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[HireNotification] Resend error:", err);
    return false;
  }
}

export async function sendHireNotification(payload: HireNotificationPayload): Promise<void> {
  if (!payload.workerEmail) {
    console.log(`[HireNotification] No email for worker ${payload.workerName} — skipping`);
    return;
  }

  const html = buildHireEmailHtml(payload);
  const subject = `You're hired! ${ROLE_LABELS[payload.role] ?? payload.role} at ${payload.restaurantName ?? "ShiftChef"}`;

  const sent = await sendViaResend(payload.workerEmail, subject, html);
  if (!sent) {
    console.log(`[HireNotification] Would send to ${payload.workerEmail}: ${subject}`);
  }
}

export async function sendRejectionNotification(
  workerEmail: string,
  workerName: string,
  role: string
): Promise<void> {
  if (!workerEmail) return;

  const html = buildRejectionEmailHtml(workerName, role);
  const subject = "Application update from ShiftChef";

  const sent = await sendViaResend(workerEmail, subject, html);
  if (!sent) {
    console.log(`[RejectionNotification] Would send to ${workerEmail}`);
  }
}
