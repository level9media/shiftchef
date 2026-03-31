/**
 * hireNotification.ts
 * Sends rich hire notifications when an employer accepts a worker.
 */

import { notifyOwner } from "./notification";

export interface HireDetails {
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

const ROLE_LABELS: Record<string, string> = {
  cook: "Cook", sous_chef: "Sous Chef", prep: "Prep Cook",
  dishwasher: "Dishwasher", cleaner: "Cleaner", server: "Server",
  bartender: "Bartender", host: "Host", manager: "Manager",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago",
  });
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago",
  });
}

function getMapsLink(location?: string | null, restaurantName?: string | null): string {
  const query = [restaurantName, location].filter(Boolean).join(", ");
  if (!query) return "";
  return "https://maps.google.com/?q=" + encodeURIComponent(query);
}

function calcHours(startMs: number, endMs: number): string {
  return ((endMs - startMs) / (1000 * 60 * 60)).toFixed(1);
}

function calcTotalPay(startMs: number, endMs: number, payRate: string | number): string {
  const hours = (endMs - startMs) / (1000 * 60 * 60);
  return (hours * Number(payRate)).toFixed(2);
}

export async function sendHireNotification(details: HireDetails): Promise<void> {
  const roleLabel = ROLE_LABELS[details.role] ?? details.role;
  const shiftDate = formatDate(details.startTime);
  const arrivalTime = formatTime(details.startTime - 10 * 60 * 1000);
  const endTimeStr = formatTime(details.endTime);
  const hours = calcHours(details.startTime, details.endTime);
  const totalPay = calcTotalPay(details.startTime, details.endTime, details.payRate);
  const mapsLink = getMapsLink(details.location, details.restaurantName);
  const venueName = details.restaurantName ?? "the venue";
  const workerContact = details.workerPhone
    ? "Phone: " + details.workerPhone
    : details.workerEmail
    ? "Email: " + details.workerEmail
    : "No contact info on file";
  const employerContact = details.employerPhone
    ? details.employerPhone
    : details.employerEmail
    ? details.employerEmail
    : "Contact via ShiftChef app";

  const workerLines: string[] = [
    "CONGRATULATIONS — YOU'RE HIRED!",
    "",
    "Hi " + details.workerName + ",",
    "",
    venueName + " has selected you for the following shift on ShiftChef:",
    "",
    "SHIFT DETAILS",
    "Role:       " + roleLabel,
    "Date:       " + shiftDate,
    "Arrive by:  " + arrivalTime + " (10 min early)",
    "Shift ends: " + endTimeStr,
    "Duration:   " + hours + " hours",
    "Pay rate:   $" + String(details.payRate) + "/hr",
    "Total pay:  ~$" + totalPay,
    "",
    "LOCATION",
    venueName,
    details.location ?? "",
    details.city ?? "",
    mapsLink ? "Directions: " + mapsLink : "",
    "",
    "EMPLOYER CONTACT",
    details.employerName,
    employerContact,
    "",
    "ARRIVAL INSTRUCTIONS",
    "- Arrive 10 minutes early (by " + arrivalTime + ")",
    "- Dress professionally — kitchen-ready attire",
    "- Bring a valid photo ID",
    "- Ask for " + details.employerName + " when you arrive",
    "- Payment released after shift completion",
    "",
    details.description ? "NOTES FROM EMPLOYER\n" + details.description + "\n" : "",
    "Good luck! You've got this.",
    "— The ShiftChef Team | https://www.shiftchef.co",
  ];

  const employerLines: string[] = [
    "HIRE CONFIRMED — Worker Notified",
    "",
    "You've hired " + details.workerName + " for the " + roleLabel + " shift at " + venueName + ".",
    "",
    "SHIFT SUMMARY",
    "Worker:    " + details.workerName,
    "Contact:   " + workerContact,
    "Role:      " + roleLabel,
    "Date:      " + shiftDate,
    "Duration:  " + hours + " hours",
    "Pay rate:  $" + String(details.payRate) + "/hr",
    "Total pay: ~$" + totalPay + " (held in escrow)",
    "",
    "The worker has been notified with full shift details, your contact info, and directions.",
    "Payment releases automatically 24h after worker clocks out.",
    "",
    "Manage this shift: https://www.shiftchef.co/applications",
  ];

  notifyOwner({
    title: "ShiftChef: " + details.workerName + " HIRED for " + roleLabel + " at " + venueName,
    content: workerLines.join("\n"),
  }).catch(() => {});

  notifyOwner({
    title: "ShiftChef: Hire Confirmed — " + details.workerName + " notified for " + roleLabel,
    content: employerLines.join("\n"),
  }).catch(() => {});
}
