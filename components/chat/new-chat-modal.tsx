"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IndiaPhoneInput } from "@/components/ui/india-phone-input";
import { useChat } from "./chat-context";
import { Search, Users, Check, AlertCircle, MessageSquare, ArrowRight, ArrowLeft, X, Camera } from "lucide-react";
import { cn, isValidIndiaMobile, toIndiaE164, formatIndiaDisplay } from "@/lib/utils";
import { Profile } from "@/types/database";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const { contacts, createDirectChat, createDirectChatWithUser, searchUserByPhone, createGroupChat } = useChat();

  const [mode, setMode] = React.useState<"phone" | "direct" | "group">("phone");
  const [phoneDigits, setPhoneDigits] = React.useState("");
  const [phoneError, setPhoneError] = React.useState<string | undefined>(undefined);
  const [search, setSearch] = React.useState("");
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Group creation 2-step WhatsApp flow
  const [groupStep, setGroupStep] = React.useState<1 | 2>(1);
  const [groupName, setGroupName] = React.useState("");
  const [groupDescription, setGroupDescription] = React.useState("");
  const [groupAvatar, setGroupAvatar] = React.useState(
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80"
  );

  // Phone lookup result state
  const [foundUser, setFoundUser] = React.useState<Profile | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const filteredContacts = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone_number && c.phone_number.includes(search))
  );

  const handleSearchPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(undefined);
    setSearchError(null);
    setFoundUser(null);

    if (!phoneDigits || phoneDigits.length !== 10) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    if (!isValidIndiaMobile(phoneDigits)) {
      setPhoneError("Indian numbers must start with 6, 7, 8, or 9");
      return;
    }

    const formattedE164 = toIndiaE164(phoneDigits);

    setIsLoading(true);
    const res = await searchUserByPhone(formattedE164);
    setIsLoading(false);

    if (res.profile) {
      setFoundUser(res.profile);
    } else {
      setSearchError(res.error || "User not found with this Indian mobile number.");
    }
  };

  const handleStartChatWithFoundUser = async () => {
    if (!foundUser) return;
    setIsLoading(true);
    await createDirectChatWithUser(foundUser);
    setIsLoading(false);
    onClose();
  };

  const handleSelectContact = async (contactId: string) => {
    if (mode === "direct") {
      setIsLoading(true);
      await createDirectChat(contactId);
      setIsLoading(false);
      onClose();
    } else {
      setSelectedContacts((prev) =>
        prev.includes(contactId)
          ? prev.filter((id) => id !== contactId)
          : [...prev, contactId]
      );
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    if (selectedContacts.length === 0) return;

    setIsLoading(true);
    await createGroupChat(groupName, selectedContacts, groupAvatar, groupDescription);
    setIsLoading(false);
    setGroupStep(1);
    setGroupName("");
    setGroupDescription("");
    setSelectedContacts([]);
    onClose();
  };

  const groupPresets = [
    { label: "Team", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80" },
    { label: "Friends", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80" },
    { label: "Project", url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&auto=format&fit=crop&q=80" },
    { label: "Family", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&auto=format&fit=crop&q=80" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setGroupStep(1);
        onClose();
      }}
      title={
        mode === "phone"
          ? "Start Chat by Indian Mobile Number"
          : mode === "direct"
          ? "New Conversation"
          : groupStep === 1
          ? "New Group: Add Participants"
          : "New Group: Subject & Details"
      }
      description={
        mode === "phone"
          ? "Search a registered Indian mobile number (+91) to connect"
          : mode === "direct"
          ? "Select a contact from your directory"
          : groupStep === 1
          ? "Select contacts to add to your new group"
          : "Provide group subject, icon, and optional description"
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Switch Mode Pills */}
        <div className="flex rounded-xl neo-inset-sm p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode("phone");
              setSearchError(null);
              setFoundUser(null);
              setGroupStep(1);
            }}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              mode === "phone"
                ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            By Mobile (+91)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("direct");
              setGroupStep(1);
            }}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              mode === "direct"
                ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Contacts
          </button>
          <button
            type="button"
            onClick={() => setMode("group")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              mode === "group"
                ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            New Group
          </button>
        </div>

        {/* Tab 1: By Mobile Number (India automated +91) */}
        {mode === "phone" && (
          <div className="space-y-4 pt-1">
            <form onSubmit={handleSearchPhone} autoComplete="off" className="space-y-3">
              <IndiaPhoneInput
                label="Registered Mobile Number"
                value={phoneDigits}
                onChange={(val) => {
                  setPhoneDigits(val);
                  setPhoneError(undefined);
                  setSearchError(null);
                  setFoundUser(null);
                }}
                error={phoneError}
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<Search className="w-4 h-4" />}
              >
                Search Registered User
              </Button>
            </form>

            {/* Error: User Not Found */}
            {searchError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">User Not Found</h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed">
                    {searchError}
                  </p>
                </div>
              </div>
            )}

            {/* Success: User Found Card with Start Chat Button */}
            {foundUser && (
              <div className="p-4 rounded-2xl neo-raised bg-[var(--bg-card)] border border-emerald-500/30 flex flex-col gap-3 animate-scaleUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={foundUser.avatar_url}
                      name={foundUser.full_name}
                      size="md"
                      status={foundUser.is_online ? "online" : "offline"}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          {foundUser.full_name}
                        </h4>
                        <Badge variant="success" size="sm">
                          Verified
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--primary)] font-medium">
                        @{foundUser.username || "user"}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                        {foundUser.phone_number ? formatIndiaDisplay(foundUser.phone_number) : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {foundUser.about && (
                  <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-card-alt)] p-2.5 rounded-xl neo-inset-sm">
                    &quot;{foundUser.about}&quot;
                  </p>
                )}

                <Button
                  variant="primary"
                  className="w-full mt-1"
                  onClick={handleStartChatWithFoundUser}
                  isLoading={isLoading}
                  rightIcon={<MessageSquare className="w-4 h-4" />}
                >
                  Start Chat with {foundUser.full_name.split(" ")[0]}
                </Button>
              </div>
            )}

            {/* Quick Demo Test Numbers
            <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] space-y-1">
              <span className="font-semibold block text-[var(--text-secondary)]">
                Sample registered Indian numbers to test:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {["9876501001", "9876501002", "9876501003"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setPhoneDigits(num);
                      setPhoneError(undefined);
                      setSearchError(null);
                      setFoundUser(null);
                    }}
                    className="px-2.5 py-1 rounded-lg neo-btn text-[11px] text-[var(--primary)] font-mono cursor-pointer"
                  >
                    +91 {num.slice(0, 5)} {num.slice(5)}
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        )}

        {/* Tab 2: Contacts Directory */}
        {mode === "direct" && (
          <div className="space-y-3">
            <Input
              placeholder="Filter saved contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-10 text-xs"
            />

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredContacts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No saved contacts yet. Search by mobile number to connect.
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectContact(c.id)}
                    className="flex items-center justify-between p-3 rounded-2xl cursor-pointer neo-raised-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={c.avatar_url}
                        name={c.full_name}
                        size="sm"
                        status={c.is_online ? "online" : undefined}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">
                          {c.full_name}
                        </h4>
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                          {c.phone_number ? formatIndiaDisplay(c.phone_number) : `@${c.username}`}
                        </p>
                      </div>
                    </div>
                    <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Group Chat (WhatsApp 2-step process) */}
        {mode === "group" && (
          <div>
            {groupStep === 1 ? (
              /* STEP 1: Add Participants */
              <div className="space-y-3 animate-fadeIn">
                {/* Selected Participant Chips (WhatsApp style) */}
                {selectedContacts.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                      <span>{selectedContacts.length} participants selected</span>
                      <button
                        type="button"
                        onClick={() => setSelectedContacts([])}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 no-scrollbar">
                      {selectedContacts.map((id) => {
                        const contact = contacts.find((c) => c.id === id);
                        if (!contact) return null;

                        return (
                          <div
                            key={id}
                            className="relative flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl neo-inset-sm bg-[var(--bg-card)]"
                          >
                            <div className="relative">
                              <Avatar src={contact.avatar_url} name={contact.full_name} size="sm" />
                              <button
                                type="button"
                                onClick={() => handleSelectContact(id)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] hover:scale-110 transition-transform cursor-pointer"
                                aria-label={`Remove ${contact.full_name}`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <span className="text-[10px] font-medium text-[var(--text-primary)] max-w-[56px] truncate text-center">
                              {contact.full_name.split(" ")[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter / Search contacts */}
                <Input
                  placeholder="Search name or mobile number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="h-10 text-xs"
                />

                {/* Contacts Checklist */}
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {filteredContacts.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                      No contacts available. Connect with users by mobile number first.
                    </div>
                  ) : (
                    filteredContacts.map((c) => {
                      const isSelected = selectedContacts.includes(c.id);

                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectContact(c.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all select-none",
                            isSelected
                              ? "neo-inset bg-[var(--bg-card)] ring-1 ring-[var(--primary)]"
                              : "neo-raised-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)]"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={c.avatar_url}
                              name={c.full_name}
                              size="sm"
                              status={c.is_online ? "online" : undefined}
                            />
                            <div>
                              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                                {c.full_name}
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                                {c.phone_number ? formatIndiaDisplay(c.phone_number) : `@${c.username}`}
                              </p>
                            </div>
                          </div>

                          <div
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border transition-colors",
                              isSelected
                                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                : "border-[var(--border-subtle)]"
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Step 1 Next Button */}
                <Button
                  variant="primary"
                  className="w-full mt-3"
                  disabled={selectedContacts.length === 0}
                  onClick={() => setGroupStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next ({selectedContacts.length} selected)
                </Button>
              </div>
            ) : (
              /* STEP 2: Subject, Icon, Description (WhatsApp style) */
              <div className="space-y-4 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setGroupStep(1)}
                  className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline font-semibold cursor-pointer mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to participants
                </button>

                {/* Group Icon & Name */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl neo-raised bg-[var(--bg-card)]">
                  <div className="relative shrink-0">
                    <Avatar
                      src={groupAvatar}
                      name={groupName || "Group"}
                      size="lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      maxLength={25}
                      placeholder="Type group subject here..."
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full text-sm font-bold bg-transparent border-b border-[var(--border-subtle)] focus:border-[var(--primary)] outline-none py-1 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      autoFocus
                    />
                    <div className="flex justify-end text-[10px] text-[var(--text-muted)] font-mono">
                      {groupName.length}/25
                    </div>
                  </div>
                </div>

                {/* Group Icon Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Choose Group Icon:
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {groupPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setGroupAvatar(preset.url)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                          groupAvatar === preset.url
                            ? "neo-inset text-[var(--primary)] font-bold ring-1 ring-[var(--primary)]"
                            : "neo-raised text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <Avatar src={preset.url} name={preset.label} size="xs" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Group Description */}
                <Input
                  label="Group Description (Optional)"
                  placeholder="e.g. Daily team updates, planning, and design sync"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />

                {/* Participants Summary */}
                <div className="p-3 rounded-xl neo-inset-sm bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Group participants</span>
                  <Badge variant="primary" size="sm">
                    {selectedContacts.length + 1} members (incl. You)
                  </Badge>
                </div>

                {/* Create Group Button */}
                <Button
                  variant="primary"
                  className="w-full mt-2"
                  disabled={!groupName.trim() || selectedContacts.length === 0}
                  onClick={handleCreateGroup}
                  isLoading={isLoading}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Create Group
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
