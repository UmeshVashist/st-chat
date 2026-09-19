"use client";

import * as React from "react";
import { useChat } from "./chat-context";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Users,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ConversationListProps {
  onSelectConversation?: (id: string) => void;
  onOpenNewChatModal: () => void;
}

export function ConversationList({
  onSelectConversation,
  onOpenNewChatModal,
}: ConversationListProps) {
  const { user } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    deleteConversation,
    isUserOnline,
  } = useChat();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "direct" | "group">("all");
  const [convToDelete, setConvToDelete] = React.useState<typeof conversations[0] | null>(null);

  const filteredConversations = React.useMemo(() => {
    return conversations
      .map((conv) => {
        const otherMember =
          conv.type === "direct"
            ? conv.members?.find((m) => m.user_id !== user?.id)
            : null;
        const otherProfile = conv.other_user || otherMember?.profile || null;
        const displayName =
          conv.type === "direct" && otherProfile
            ? otherProfile.full_name ||
              otherProfile.username ||
              otherProfile.phone_number ||
              conv.name ||
              "Chat"
            : conv.name || (conv.type === "group" ? "Group Chat" : "Direct Message");
        const displayAvatar =
          conv.type === "direct" && otherProfile
            ? otherProfile.avatar_url || conv.avatar_url
            : conv.avatar_url;
        const isOnline =
          conv.type === "direct" &&
          Boolean(otherProfile && isUserOnline(otherProfile.id));

        return {
          ...conv,
          _displayName: displayName,
          _displayAvatar: displayAvatar,
          _isOnline: isOnline,
          _otherProfile: otherProfile,
        };
      })
      .filter((conv) => {
        const matchesFilter =
          filter === "all" ||
          (filter === "direct" && conv.type === "direct") ||
          (filter === "group" && conv.type === "group");

        const matchesSearch =
          !search.trim() ||
          (conv._displayName &&
            conv._displayName.toLowerCase().includes(search.toLowerCase()));

        return matchesFilter && matchesSearch;
      });
  }, [conversations, filter, search, user?.id]);

  const handleSelect = (id: string) => {
    setActiveConversationId(id);
    if (onSelectConversation) {
      onSelectConversation(id);
    }
  };

  const getLastMessageSnippet = (conv: (typeof filteredConversations)[0]) => {
    const msg = conv.last_message;
    if (!msg) {
      return conv.type === "group" ? "Group created" : "No messages yet";
    }

    const isMe = Boolean(user?.id && msg.sender_id === user.id);
    const prefix = isMe ? "You: " : "";

    if (msg.media_type === "image" || (msg.media_url && msg.media_url.match(/\.(jpg|jpeg|png|gif|webp)/i))) {
      return `${prefix}📷 ${msg.content ? msg.content.trim() : "Photo"}`;
    }
    if (msg.media_type === "video" || (msg.media_url && msg.media_url.match(/\.(mp4|mov|webm)/i))) {
      return `${prefix}🎥 ${msg.content ? msg.content.trim() : "Video"}`;
    }
    if (msg.media_type === "audio" || (msg.media_url && msg.media_url.match(/\.(mp3|wav|ogg|m4a)/i))) {
      return `${prefix}🎵 ${msg.content ? msg.content.trim() : "Audio"}`;
    }
    if (msg.media_type === "pdf" || msg.media_type === "file" || (msg.media_url && msg.media_url.match(/\.(pdf|doc|docx|zip)/i))) {
      return `${prefix}📄 ${msg.content ? msg.content.trim() : "Document"}`;
    }

    if (msg.content) {
      return `${prefix}${msg.content.trim()}`;
    }

    return `${prefix}Message`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-main)] border-r border-[var(--border-subtle)]">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Messages
            </h1>
            <Badge variant="primary" size="sm">
              {conversations.length}
            </Badge>
          </div>

          <Tooltip content="New Conversation" position="bottom">
            <Button
              variant="raised"
              size="icon"
              onClick={onOpenNewChatModal}
              className="w-9 h-9 rounded-xl text-[var(--primary)]"
              aria-label="Start New Chat"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </Tooltip>
        </div>

        {/* Search Input */}
        <Input
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="h-10 text-xs"
        />

        {/* Filter Pills */}
        <div className="flex rounded-xl neo-inset-sm p-1 gap-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
              filter === "all"
                ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("direct")}
            className={cn(
              "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
              filter === "direct"
                ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Direct
          </button>
          <button
            onClick={() => setFilter("group")}
            className={cn(
              "flex-1 py-1 text-xs font-semibold rounded-lg transition-all",
              filter === "group"
                ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List Stream */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--text-secondary)] my-auto h-64">
            <div className="w-14 h-14 rounded-3xl neo-inset flex items-center justify-center text-[var(--primary)] mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              No chats yet
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mb-4 leading-relaxed">
              Search a user by their registered mobile number to start a conversation, just like WhatsApp.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewChatModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Chat by Mobile
            </Button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversationId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  onSelectConversation?.(conv.id);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left cursor-pointer group select-none relative",
                  isSelected
                    ? "neo-inset scale-[0.99] border-l-4 border-[var(--primary)]"
                    : "neo-card hover:bg-[var(--bg-card)]/80"
                )}
              >
                {/* Avatar with live online ring */}
                <div className="relative shrink-0">
                  <Avatar
                    src={conv._displayAvatar}
                    name={conv._displayName || "Chat"}
                    size="md"
                    status={conv._isOnline ? "online" : undefined}
                  />
                  {conv.type === "group" && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--bg-card)] neo-inset-sm flex items-center justify-center text-[var(--text-secondary)] text-[9px]">
                      <Users className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h2
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate",
                        conv.unread_count && conv.unread_count > 0
                          ? "text-[var(--text-primary)] font-extrabold"
                          : "text-[var(--text-primary)]"
                      )}
                    >
                      {conv._displayName}
                    </h2>
                    <span
                      className={cn(
                        "text-[10px] shrink-0 ml-1 font-medium",
                        conv.unread_count && conv.unread_count > 0
                          ? "text-emerald-500 font-bold"
                          : "text-[var(--text-muted)]"
                      )}
                    >
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <p
                      title={getLastMessageSnippet(conv)}
                      className={cn(
                        "text-xs truncate flex-1 min-w-0 tracking-tight",
                        conv.unread_count && conv.unread_count > 0
                          ? "font-semibold text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]"
                      )}
                    >
                      {getLastMessageSnippet(conv)}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {conv.unread_count && conv.unread_count > 0 ? (
                        <span
                          className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-emerald-500/30"
                          title={`${conv.unread_count} unread messages`}
                        >
                          {conv.unread_count > 99 ? "99+" : conv.unread_count}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConvToDelete(conv);
                        }}
                        title="Delete chat"
                        className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        aria-label={`Delete chat with ${conv._displayName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Conversation Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!convToDelete}
        onClose={() => setConvToDelete(null)}
        onConfirm={() => {
          if (convToDelete) {
            deleteConversation(convToDelete.id);
            setConvToDelete(null);
          }
        }}
        title="Delete Conversation"
        message={`Are you sure you want to delete this conversation with "${convToDelete?.name || "this user"}"? All messages in this chat will be removed.`}
        confirmLabel="Delete Chat"
        danger
      />
    </div>
  );
}
