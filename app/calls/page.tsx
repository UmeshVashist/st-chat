"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatTime, formatDate } from "@/lib/utils";
import {
  Phone,
  Video,
  PhoneMissed,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  PhoneOff,
} from "lucide-react";

import {
  getCallLogs,
  saveCallLog,
  removeCallLog,
  clearAllCallLogs,
  CallLog,
} from "@/lib/call-service";

export default function CallsPage() {
  const router = useRouter();
  const { user, isDemoUser } = useAuth();
  const userId = user?.id || "guest";

  const [callLogs, setCallLogs] = React.useState<CallLog[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = React.useState(false);

  // Hydration-safe initial state loading + live call updates listener
  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setCallLogs(getCallLogs(userId, isDemoUser));

      const handleUpdate = () => {
        setCallLogs(getCallLogs(userId, isDemoUser));
      };

      window.addEventListener("chatconnect_calls_updated", handleUpdate);
      return () => {
        window.removeEventListener("chatconnect_calls_updated", handleUpdate);
      };
    }
  }, [userId, isDemoUser]);

  const handleStartCall = (name: string, type: "video" | "audio", avatar?: string) => {
    const callId = `call-${Date.now()}`;
    saveCallLog(userId, {
      id: callId,
      name,
      avatar,
      type,
      direction: "outgoing",
      duration: "00m 00s",
    });
    const roomId = `room-${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}-${Date.now()}`;
    router.push(
      `/call/${roomId}?type=${type}&name=${encodeURIComponent(name)}&callId=${callId}&avatar=${encodeURIComponent(avatar || "")}`
    );
  };

  const handleDeleteCall = (id: string) => {
    removeCallLog(userId, id);
    setCallLogs((prev) => prev.filter((call) => call.id !== id));
    setDeleteTargetId(null);
  };

  const handleClearAllCalls = () => {
    clearAllCallLogs(userId);
    setCallLogs([]);
    setConfirmClearAll(false);
  };

  return (
    <DashboardShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Call Logs & History
              </h1>
              {isMounted && (
                <Badge variant="primary" size="sm" suppressHydrationWarning>
                  {callLogs.length}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              WebRTC voice and video call logs with duration and status
            </p>
          </div>

          <div className="flex items-center gap-2">
            {callLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClearAll(true)}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Call Logs List */}
        {callLogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl neo-inset flex items-center justify-center text-[var(--primary)] mb-3">
              <PhoneOff className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              No call history
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-5 leading-relaxed">
              You haven&apos;t made or received any voice or video calls yet. Call history will automatically appear here when you call any contact.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/contacts")}
              leftIcon={<Phone className="w-4 h-4" />}
            >
              Call a Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {callLogs.map((call) => (
              <Card
                key={call.id}
                variant="raised"
                className="p-4 flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar
                    src={call.avatar}
                    name={call.name}
                    size="md"
                    status="online"
                  />

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                      {call.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                      {call.direction === "incoming" && (
                        <span className="flex items-center gap-1 text-emerald-500 font-medium">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Incoming
                        </span>
                      )}
                      {call.direction === "outgoing" && (
                        <span className="flex items-center gap-1 text-[var(--primary)] font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Outgoing
                        </span>
                      )}
                      {call.direction === "missed" && (
                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                          <PhoneMissed className="w-3.5 h-3.5" /> Missed Call
                        </span>
                      )}
                      <span>•</span>
                      <span suppressHydrationWarning>
                        {formatDate(call.timestamp)} at {formatTime(call.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge
                    variant={call.direction === "missed" ? "danger" : "default"}
                    size="sm"
                    className="hidden sm:inline-flex"
                    suppressHydrationWarning
                  >
                    {call.duration}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="raised"
                      size="icon"
                      onClick={() => handleStartCall(call.name, "audio", call.avatar)}
                      className="w-9 h-9 text-[var(--text-secondary)] rounded-xl cursor-pointer"
                      title="Audio Call"
                      aria-label={`Audio call with ${call.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="primary"
                      size="icon"
                      onClick={() => handleStartCall(call.name, "video", call.avatar)}
                      className="w-9 h-9 rounded-xl shadow cursor-pointer"
                      title="HD Video Call"
                      aria-label={`Video call with ${call.name}`}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTargetId(call.id)}
                      className="w-9 h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
                      title="Delete Call Log"
                      aria-label={`Delete call log with ${call.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Single Call Confirmation Modal */}
        <ConfirmDialog
          isOpen={!!deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={() => {
            if (deleteTargetId) handleDeleteCall(deleteTargetId);
          }}
          title="Delete Call Record"
          message="Are you sure you want to delete this call record from your history?"
          confirmLabel="Delete"
          danger
        />

        {/* Clear All Calls Confirmation Modal */}
        <ConfirmDialog
          isOpen={confirmClearAll}
          onClose={() => setConfirmClearAll(false)}
          onConfirm={handleClearAllCalls}
          title="Clear All Call Logs"
          message="Are you sure you want to clear your entire call history? This action cannot be undone."
          confirmLabel="Clear All"
          danger
        />
      </div>
    </DashboardShell>
  );
}
