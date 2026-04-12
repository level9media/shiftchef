/**
 * ShiftChef SMS Notifications via Twilio
 *
 * Fires on these events:
 *  1. Worker applies to a job       → Employer gets SMS
 *  2. Worker is hired               → Worker gets SMS
 *  3. Worker is rejected            → Worker gets SMS
 *  4. Worker clocks in              → Employer gets SMS
 *  5. Worker clocks out             → Employer gets SMS (with hours + total owed)
 *  6. Payment released to worker    → Worker gets SMS
 *
 * Requires Railway env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER  (e.g. +15125550000)
 */

const ROLE_LABELS: Record<string, string> = {
  cook: "Line Cook",
  sous_chef: "Sous Chef",
  prep: "Prep Cook",
  dishwasher: "Dishwasher",
  cleaner: "Cleaner",
  server: "Server",
  bartender: "Bartender",
  host: "Host/Hostess",
  manager: "Manager",
};

function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return `+${cleaned}`;
  return cleaned.length >= 10 ? `+1${cleaned.slice(-10)}` : null;
}

async function sendSMS(to: string | null | undefined, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    // Twilio not configured — log and skip silently
    console.log(`[SMS] Twilio not configured. Would send to ${to}: ${body}`);
    return;
  }

  const toFormatted = formatPhone(to);
  if (!toFormatted) {
    console.log(`[SMS] Invalid or missing phone number: ${to}`);
    return;
  }

  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toFormatted,
          Body: body,
        }).toString(),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[SMS] Twilio error (${res.status}): ${err}`);
    } else {
      console.log(`[SMS] Sent to ${toFormatted}: ${body.substring(0, 60)}...`);
    }
  } catch (err) {
    console.warn("[SMS] Send failed:", err);
  }
}

// ── 1. New application — notify employer ──────────────────────────────────────
export async function smsNewApplication(params: {
  employerPhone?: string | null;
  workerName: string;
  role: string;
  restaurantName?: string | null;
  city?: string | null;
}): Promise<void> {
  const role = ROLE_LABELS[params.role] ?? params.role;
  const venue = params.restaurantName ?? "your venue";
  const body =
    `ShiftChef: New applicant! ${params.workerName} applied for your ${role} shift at ${venue}. ` +
    `Open the app to review & hire → shiftchef.co/login`;
  await sendSMS(params.employerPhone, body);
}

// ── 2. Worker hired — notify worker ──────────────────────────────────────────
export async function smsWorkerHired(params: {
  workerPhone?: string | null;
  workerName: string;
  role: string;
  restaurantName?: string | null;
  startTime: number; // UTC ms
  location?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
}): Promise<void> {
  const role = ROLE_LABELS[params.role] ?? params.role;
  const venue = params.restaurantName ?? "the venue";
  const date = new Date(params.startTime).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
  let body =
    `ShiftChef: You're hired! 🎉 ${role} at ${venue} — ${date} CT. ` +
    `Address: ${params.location ?? "See app for details"}. `;
  if (params.contactName && params.contactPhone) {
    body += `Contact: ${params.contactName} ${params.contactPhone}. `;
  }
  body += `Open app to confirm → shiftchef.co/login`;
  await sendSMS(params.workerPhone, body);
}

// ── 3. Worker rejected — notify worker ───────────────────────────────────────
export async function smsWorkerRejected(params: {
  workerPhone?: string | null;
  workerName: string;
  role: string;
}): Promise<void> {
  const role = ROLE_LABELS[params.role] ?? params.role;
  const body =
    `ShiftChef: The ${role} position was filled by another candidate. ` +
    `New shifts are posted daily — keep applying! → shiftchef.co/login`;
  await sendSMS(params.workerPhone, body);
}

// ── 4. Worker clocked in — notify employer ────────────────────────────────────
export async function smsWorkerCheckedIn(params: {
  employerPhone?: string | null;
  workerName: string;
  role: string;
  restaurantName?: string | null;
  checkInTime: number; // UTC ms
}): Promise<void> {
  const role = ROLE_LABELS[params.role] ?? params.role;
  const time = new Date(params.checkInTime).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
  const body =
    `ShiftChef: ${params.workerName} just clocked in for the ${role} shift at ` +
    `${params.restaurantName ?? "your venue"} at ${time} CT.`;
  await sendSMS(params.employerPhone, body);
}

// ── 5. Worker clocked out — notify employer ───────────────────────────────────
export async function smsWorkerCheckedOut(params: {
  employerPhone?: string | null;
  workerName: string;
  role: string;
  restaurantName?: string | null;
  hoursWorked: number;
  totalOwed: number;
}): Promise<void> {
  const role = ROLE_LABELS[params.role] ?? params.role;
  const body =
    `ShiftChef: ${params.workerName} clocked out from the ${role} shift at ${params.restaurantName ?? "your venue"}. ` +
    `Hours: ${params.hoursWorked}h | Total owed: $${params.totalOwed.toFixed(2)}. ` +
    `Approve payment in the app → shiftchef.co/login`;
  await sendSMS(params.employerPhone, body);
}

// ── 6. Payment released to worker ────────────────────────────────────────────
export async function smsPaymentReleased(params: {
  workerPhone?: string | null;
  workerName: string;
  amount: number;
  restaurantName?: string | null;
}): Promise<void> {
  const body =
    `ShiftChef: Your payment of $${params.amount.toFixed(2)} from ${params.restaurantName ?? "your shift"} ` +
    `has been released to your account. Funds arrive in 1–2 business days. 💰`;
  await sendSMS(params.workerPhone, body);
}
