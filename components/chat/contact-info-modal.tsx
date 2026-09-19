"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Conversation, Profile } from "@/types/database";
import { formatIndiaDisplay } from "@/lib/utils";
import {
  Phone,
  Video,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  User,
  AtSign,
  Smartphone,
  Info,
} from "lucide-react";

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  otherProfile: Profile | null;
  isOnline?: boolean;
  onDeleteChat: () => void;
  onStartCall: (type: "audio" | "video") => void;
}

export function ContactInfoModal({
  isOpen,
  onClose,
  conversation,
  otherProfile,
  isOnline,
  onDeleteChat,
  onStartCall,
}: ContactInfoModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  const isOnlineActive =
    typeof isOnline === "boolean" ? isOnline : Boolean(otherProfile?.is_online);

  const fullName =
    otherProfile?.full_name ||
    conversation.name ||
    "User";

  const username =
    otherProfile?.username
      ? `@${otherProfile.username.replace(/^@/, "")}`
      : "@" + (fullName.toLowerCase().replace(/\s+/g, "_") || "user");

  const rawPhone = otherProfile?.phone_number || "";
  const displayPhone = rawPhone ? formatIndiaDisplay(rawPhone) : "Not shared";

  const about = otherProfile?.about || "Hey there! I am using ChatConnect.";

  const handleCopy = (text: string, field: string) => {
    if (!text || text === "Not shared") return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Contact Info"
        maxWidth="md"
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Profile Header Card */}
          <div className="flex flex-col items-center text-center p-5 rounded-3xl neo-inset bg-[var(--bg-main)]/60">
            <div className="relative mb-3.5">
              <Avatar
                src={otherProfile?.avatar_url || conversation.avatar_url}
                name={fullName}
                size="xl"
                status={isOnlineActive ? "online" : "offline"}
                className="w-24 h-24 text-2xl shadow-md ring-4 ring-[var(--bg-card)]"
              />
            </div>

            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {fullName}
            </h3>

            <p className="text-xs font-semibold text-[var(--primary)] mt-0.5 select-all">
              {username}
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neo-raised-sm bg-[var(--bg-card)] text-[11px] font-medium mt-3 text-emerald-600 dark:text-emerald-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnlineActive
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-gray-400"
                }`}
              />
              {isOnlineActive ? "Online & Active" : "Offline"}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 mt-5 w-full max-w-xs">
              <Button
                variant="raised"
                onClick={() => {
                  onClose();
                  onStartCall("audio");
                }}
                className="flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-[var(--primary)]"
              >
                <Phone className="w-4 h-4" />
                Audio Call
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onStartCall("video");
                }}
                className="flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold shadow-md"
              >
                <Video className="w-4 h-4" />
                Video Call
              </Button>
            </div>
          </div>

          {/* User Details Details Section */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
              User Details
            </h4>

            {/* Full Name */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl neo-raised-sm bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-[var(--primary)] shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Full Name
                  </p>
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {fullName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(fullName, "name")}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                title="Copy name"
              >
                {copiedField === "name" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Username */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl neo-raised-sm bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-[var(--primary)] shrink-0">
                  <AtSign className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Username
                  </p>
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {username}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(username, "username")}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                title="Copy username"
              >
                {copiedField === "username" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Mobile Number */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl neo-raised-sm bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-[var(--primary)] shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-[var(--text-muted)]">
                    Mobile Number
                  </p>
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate tracking-wide">
                    {displayPhone}
                  </p>
                </div>
              </div>
              {rawPhone && (
                <button
                  type="button"
                  onClick={() => handleCopy(rawPhone, "phone")}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  title="Copy phone number"
                >
                  {copiedField === "phone" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* About / Bio */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl neo-raised-sm bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="w-9 h-9 rounded-xl neo-inset flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-[var(--text-muted)]">
                  About
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {about}
                </p>
              </div>
            </div>
          </div>

          {/* Encryption Security Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">End-to-End Encrypted:</span> Messages and calls between you and this contact are private and secured.
            </div>
          </div>

          {/* Danger Zone: Delete Chat Button */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full py-3 px-4 rounded-2xl neo-raised-sm bg-rose-500/10 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Chat with {fullName}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => {
          setShowConfirmDelete(false);
          onClose();
          onDeleteChat();
        }}
        title="Delete Conversation"
        message={`Are you sure you want to permanently delete your chat with ${fullName}? All message history in this chat will be removed.`}
        confirmLabel="Delete Chat"
        danger
      />
    </>
  );
}
