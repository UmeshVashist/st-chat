"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { useChat } from "./chat-context";
import { Conversation, ConversationMember } from "@/types/database";
import { formatIndiaDisplay, cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  UserMinus,
  MoreVertical,
  Edit2,
  Check,
  X,
  LogOut,
  Search,
  Calendar,
} from "lucide-react";

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function GroupInfoModal({
  isOpen,
  onClose,
  conversation,
}: GroupInfoModalProps) {
  const { user } = useAuth();
  const {
    contacts,
    addGroupMembers,
    removeGroupMember,
    setGroupMemberRole,
    updateGroupInfo,
    leaveGroup,
  } = useChat();

  const currentUserId = user?.id || "demo-user-1234-uuid";

  // Check if current user is admin
  const isCurrentUserAdmin =
    conversation.members?.some(
      (m) => m.user_id === currentUserId && m.role === "admin"
    ) || conversation.created_by === currentUserId;

  // Add members state
  const [showAddMembers, setShowAddMembers] = React.useState(false);
  const [addSearch, setAddSearch] = React.useState("");

  // Edit group details state
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(conversation.name || "");
  const [isEditingDesc, setIsEditingDesc] = React.useState(false);
  const [descInput, setDescInput] = React.useState(conversation.description || "");

  // Confirmation dialogs
  const [memberToRemove, setMemberToRemove] = React.useState<ConversationMember | null>(null);
  const [confirmExitGroup, setConfirmExitGroup] = React.useState(false);

  // Sync inputs with conversation changes
  React.useEffect(() => {
    setNameInput(conversation.name || "");
    setDescInput(conversation.description || "");
  }, [conversation.name, conversation.description]);

  const existingMemberIds = new Set(conversation.members?.map((m) => m.user_id) || []);

  // Filter contacts not yet in group
  const availableContactsToAdd = contacts.filter(
    (c) =>
      !existingMemberIds.has(c.id) &&
      (c.full_name.toLowerCase().includes(addSearch.toLowerCase()) ||
        (c.phone_number && c.phone_number.includes(addSearch)))
  );

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    await updateGroupInfo(conversation.id, nameInput.trim());
    setIsEditingName(false);
  };

  const handleSaveDesc = async () => {
    await updateGroupInfo(conversation.id, conversation.name || "Group", descInput.trim());
    setIsEditingDesc(false);
  };

  const handleAddMember = async (contactId: string) => {
    await addGroupMembers(conversation.id, [contactId]);
  };

  const handleConfirmRemove = async () => {
    if (memberToRemove) {
      await removeGroupMember(conversation.id, memberToRemove.user_id);
      setMemberToRemove(null);
    }
  };

  const handleConfirmExit = async () => {
    setConfirmExitGroup(false);
    onClose();
    await leaveGroup(conversation.id);
  };

  const members = conversation.members || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowAddMembers(false);
        onClose();
      }}
      title="Group Info"
      description="View and manage participants and group settings"
      maxWidth="md"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Hero Group Card (WhatsApp style) */}
        <div className="flex flex-col items-center text-center p-5 rounded-3xl neo-inset bg-[var(--bg-card)]">
          <div className="relative mb-3">
            <Avatar
              src={conversation.avatar_url}
              name={conversation.name || "Group"}
              size="xl"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--bg-card)] neo-inset-sm flex items-center justify-center text-[var(--primary)] text-xs">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Group Subject / Name */}
          <div className="w-full flex items-center justify-center gap-2 mb-1">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 w-full max-w-xs">
                <input
                  type="text"
                  maxLength={30}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 text-base font-bold bg-transparent border-b-2 border-[var(--primary)] outline-none text-center text-[var(--text-primary)]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
                  aria-label="Save group name"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(conversation.name || "");
                    setIsEditingName(false);
                  }}
                  className="w-7 h-7 rounded-lg neo-btn text-[var(--text-secondary)] flex items-center justify-center cursor-pointer"
                  aria-label="Cancel editing group name"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  {conversation.name}
                </h3>
                {isCurrentUserAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                    title="Edit group name"
                    aria-label="Edit group name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Participants Count & Creation Info */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>Group • {members.length} participants</span>
            {conversation.created_at && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(conversation.created_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>

          {/* Group Description */}
          <div className="w-full mt-3 pt-3 border-t border-[var(--border-subtle)] text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Description
              </span>
              {isCurrentUserAdmin && !isEditingDesc && (
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(true)}
                  className="text-xs text-[var(--primary)] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl neo-inset bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder="Add a group description..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDescInput(conversation.description || "");
                      setIsEditingDesc(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleSaveDesc}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {conversation.description || "No description provided for this group."}
              </p>
            )}
          </div>
        </div>

        {/* Participants Management Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Participants
              </h4>
              <Badge variant="primary" size="sm" suppressHydrationWarning>
                {members.length}
              </Badge>
            </div>

            {/* Add Participant Button */}
            <Button
              variant="raised"
              size="sm"
              onClick={() => setShowAddMembers(!showAddMembers)}
              leftIcon={<UserPlus className="w-4 h-4 text-[var(--primary)]" />}
              className="text-xs"
            >
              {showAddMembers ? "Close Contacts" : "Add Participants"}
            </Button>
          </div>

          {/* Add Members Drawer / Drawer list */}
          {showAddMembers && (
            <div className="p-3.5 rounded-2xl neo-raised bg-[var(--bg-card)] border border-[var(--primary)]/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-[var(--text-primary)]">
                  Select Contacts to Add
                </h5>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {availableContactsToAdd.length} available
                </span>
              </div>

              <Input
                placeholder="Search contact to add..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="h-9 text-xs"
              />

              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {availableContactsToAdd.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                    No contacts available to add.
                  </div>
                ) : (
                  availableContactsToAdd.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleAddMember(contact.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl neo-raised-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)] cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={contact.avatar_url}
                          name={contact.full_name}
                          size="sm"
                          status={contact.is_online ? "online" : undefined}
                        />
                        <div>
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            {contact.full_name}
                          </div>
                          <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                            {contact.phone_number ? formatIndiaDisplay(contact.phone_number) : `@${contact.username}`}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-[var(--primary)] font-semibold flex items-center gap-1 hover:underline">
                        <UserPlus className="w-3.5 h-3.5" /> Add
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {members.map((member) => {
              const isSelf = member.user_id === currentUserId;
              const isAdmin = member.role === "admin";
              const displayName = isSelf
                ? `${member.profile?.full_name || user?.full_name || "You"} (You)`
                : member.profile?.full_name || "Member";

              return (
                <div
                  key={member.id || member.user_id}
                  className="flex items-center justify-between p-3 rounded-2xl neo-raised-sm bg-[var(--bg-card)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={member.profile?.avatar_url}
                      name={displayName}
                      size="md"
                      status={member.profile?.is_online ? "online" : undefined}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                          {displayName}
                        </h5>
                        {isAdmin && (
                          <Badge variant="primary" size="sm">
                            Group Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate">
                        {member.profile?.phone_number
                          ? formatIndiaDisplay(member.profile.phone_number)
                          : member.profile?.about || "Member"}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Admin on other members */}
                  {isCurrentUserAdmin && !isSelf && (
                    <Dropdown
                      trigger={
                        <button
                          type="button"
                          className="w-8 h-8 rounded-xl neo-btn flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                          aria-label={`Options for ${displayName}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      }
                      items={[
                        {
                          label: isAdmin ? "Dismiss as Admin" : "Make Group Admin",
                          icon: isAdmin ? (
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Shield className="w-4 h-4 text-emerald-500" />
                          ),
                          onClick: () =>
                            setGroupMemberRole(
                              conversation.id,
                              member.user_id,
                              isAdmin ? "member" : "admin"
                            ),
                        },
                        {
                          label: `Remove ${displayName.split(" ")[0]}`,
                          icon: <UserMinus className="w-4 h-4 text-rose-500" />,
                          danger: true,
                          onClick: () => setMemberToRemove(member),
                        },
                      ]}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Exit Group Button (WhatsApp style) */}
        <div className="pt-2">
          <Button
            variant="ghost"
            className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 justify-center gap-2 py-3 rounded-2xl"
            onClick={() => setConfirmExitGroup(true)}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Exit Group
          </Button>
        </div>
      </div>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Participant"
        message={`Are you sure you want to remove "${memberToRemove?.profile?.full_name || "this member"}" from the group?`}
        confirmLabel="Remove"
        danger
      />

      {/* Exit Group Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmExitGroup}
        onClose={() => setConfirmExitGroup(false)}
        onConfirm={handleConfirmExit}
        title="Exit Group"
        message={`Are you sure you want to exit "${conversation.name}"? You will no longer be able to send or receive messages in this group.`}
        confirmLabel="Exit Group"
        danger
      />
    </Modal>
  );
}
