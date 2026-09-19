"use client";

export interface CallLog {
  id: string;
  name: string;
  avatar: string;
  type: "video" | "audio";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
  duration: string;
}

export function getCallLogs(userId: string, _isDemoUser?: boolean): CallLog[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const saved = localStorage.getItem(`chatconnect_calls_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading call logs:", err);
  }
  return [];
}

export const removeCallLog = (userId: string, callId: string) => deleteCallLog(userId, callId);

export function saveCallLog(
  userId: string,
  call: {
    id?: string;
    name: string;
    avatar?: string;
    type: "video" | "audio";
    direction?: "incoming" | "outgoing" | "missed";
    timestamp?: string;
    duration?: string;
  }
): CallLog {
  const currentLogs = getCallLogs(userId);
  const callId = call.id || `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const avatar =
    call.avatar ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80";

  const newRecord: CallLog = {
    id: callId,
    name: call.name,
    avatar,
    type: call.type,
    direction: call.direction || "outgoing",
    timestamp: call.timestamp || new Date().toISOString(),
    duration: call.duration || "00m 00s",
  };

  const existingIdx = currentLogs.findIndex((c) => c.id === callId);
  let updated: CallLog[];
  if (existingIdx >= 0) {
    updated = [...currentLogs];
    updated[existingIdx] = { ...updated[existingIdx], ...newRecord };
  } else {
    updated = [newRecord, ...currentLogs];
  }

  if (typeof window !== "undefined" && userId) {
    try {
      localStorage.setItem(`chatconnect_calls_${userId}`, JSON.stringify(updated.slice(0, 50)));
      window.dispatchEvent(new Event("chatconnect_calls_updated"));
    } catch (err) {
      console.warn("[Storage] Failed to save call logs to localStorage:", err);
    }

    // Async sync to Supabase calls table
    try {
      fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: callId,
          callerId: userId,
          callType: call.type,
          status: "ended",
          durationSeconds: 0,
        }),
      }).catch(() => {});
    } catch {}
  }

  return newRecord;
}

export function updateCallDuration(userId: string, callId: string, durationSeconds: number) {
  if (typeof window === "undefined" || !userId) return;
  const currentLogs = getCallLogs(userId);
  const existingIdx = currentLogs.findIndex((c) => c.id === callId);
  if (existingIdx < 0) return;

  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const formatted =
    durationSeconds === 0
      ? "Missed"
      : `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;

  const updated = [...currentLogs];
  updated[existingIdx] = {
    ...updated[existingIdx],
    duration: formatted,
  };

  localStorage.setItem(`chatconnect_calls_${userId}`, JSON.stringify(updated));
  window.dispatchEvent(new Event("chatconnect_calls_updated"));
}

export function deleteCallLog(userId: string, callId: string) {
  if (typeof window === "undefined" || !userId) return;
  const currentLogs = getCallLogs(userId);
  const updated = currentLogs.filter((c) => c.id !== callId);
  localStorage.setItem(`chatconnect_calls_${userId}`, JSON.stringify(updated));
  window.dispatchEvent(new Event("chatconnect_calls_updated"));
}

export function clearAllCallLogs(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(`chatconnect_calls_${userId}`, JSON.stringify([]));
  window.dispatchEvent(new Event("chatconnect_calls_updated"));
}
