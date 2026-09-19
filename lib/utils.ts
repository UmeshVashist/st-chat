import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Extracts 10-digit Indian mobile number from any input
 */
export function extractIndiaTenDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Validates whether 10-digit number is a valid Indian mobile number (starts with 6, 7, 8, 9)
 */
export function isValidIndiaMobile(phone: string): boolean {
  const tenDigits = extractIndiaTenDigits(phone);
  return /^[6-9]\d{9}$/.test(tenDigits);
}

/**
 * Formats phone number into standard Indian E.164 format (+919876543210)
 */
export function toIndiaE164(phone: string): string {
  const tenDigits = extractIndiaTenDigits(phone);
  return `+91${tenDigits}`;
}

/**
 * Formats Indian phone for display: +91 98765 43210
 */
export function formatIndiaDisplay(phone: string): string {
  const tenDigits = extractIndiaTenDigits(phone);
  if (tenDigits.length === 10) {
    return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
  }
  return `+91 ${tenDigits}`;
}
