"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useChat } from "@/components/chat/chat-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewChatModal } from "@/components/chat/new-chat-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, MessageSquare, Phone, Video, UserPlus, Trash2 } from "lucide-react";
import { Profile } from "@/types/database";

import { useAuth } from "@/components/auth/auth-provider";
import { saveCallLog } from "@/lib/call-service";

function ContactsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { contacts, createDirectChat, deleteContact, startCall } = useChat();
  const [search, setSearch] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [contactToDelete, setContactToDelete] = React.useState<Profile | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const filtered = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone_number && c.phone_number.includes(search))
  );

  const handleStartChat = async (userId: string) => {
    const convId = await createDirectChat(userId);
    router.push(`/chat/${convId}`);
  };

  const handleCall = (contactUserId: string, type: "video" | "audio") => {
    const contact = contacts.find((c) => c.id === contactUserId);
    const targetName = contact?.full_name || "Call";
    const targetAvatar = contact?.avatar_url || "";
    const callId = `call-${Date.now()}`;
    const currentUserId = user?.id || "guest";

    saveCallLog(currentUserId, {
      id: callId,
      name: targetName,
      avatar: targetAvatar,
      type,
      direction: "outgoing",
      duration: "00m 00s",
    });

    if (contact && startCall) {
      startCall(
        {
          id: contact.id,
          name: targetName,
          avatar: targetAvatar,
        },
        type
      );
    } else {
      const roomId = `room-direct-${contactUserId}-${Date.now()}`;
      router.push(
        `/call/${roomId}?type=${type}&name=${encodeURIComponent(targetName)}&callId=${callId}&avatar=${encodeURIComponent(targetAvatar)}`
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Contacts & Directory
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Search members by mobile number, start real-time messaging, or launch HD WebRTC calls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Find by Mobile Number
          </Button>
          {isMounted && (
            <Badge variant="primary" size="md" suppressHydrationWarning>
              {contacts.length} Contacts
            </Badge>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <Input
          placeholder="Search by name, username, or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="h-11"
        />
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl neo-inset flex items-center justify-center text-[var(--primary)] mb-3">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              No contacts added yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-5 leading-relaxed">
              Users are private by default. Other registered users will only appear here once you search their mobile number and start a conversation.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Find by Mobile Number
            </Button>
          </div>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} variant="raised" className="p-4 sm:p-5 flex items-center justify-between gap-4 group">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={c.avatar_url}
                name={c.full_name}
                size="lg"
                status={c.is_online ? "online" : "offline"}
              />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {c.full_name}
                </h3>
                <p className="text-xs text-[var(--primary)] font-medium truncate">
                  @{c.username}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {c.phone_number || c.about}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="raised"
                size="icon"
                onClick={() => handleStartChat(c.id)}
                title="Message"
                aria-label={`Message ${c.full_name}`}
                className="w-9 h-9 text-[var(--primary)] rounded-xl"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button
                variant="raised"
                size="icon"
                onClick={() => handleCall(c.id, "audio")}
                title="Audio Call"
                aria-label={`Audio call with ${c.full_name}`}
                className="w-9 h-9 text-[var(--text-secondary)] rounded-xl"
              >
                <Phone className="w-4 h-4" />
              </Button>
              <Button
                variant="primary"
                size="icon"
                onClick={() => handleCall(c.id, "video")}
                title="HD Video Call"
                aria-label={`Video call with ${c.full_name}`}
                className="w-9 h-9 rounded-xl shadow"
              >
                <Video className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setContactToDelete(c)}
                title="Delete Contact"
                aria-label={`Delete contact ${c.full_name}`}
                className="w-9 h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )))}
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Contact Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        onConfirm={async () => {
          if (contactToDelete) {
            await deleteContact(contactToDelete.id);
            setContactToDelete(null);
          }
        }}
        title="Delete Contact"
        message={`Are you sure you want to remove "${contactToDelete?.full_name || "this user"}" from your contacts list?`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <DashboardShell>
      <ContactsContent />
    </DashboardShell>
  );
}
