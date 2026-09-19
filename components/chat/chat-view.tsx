"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "./chat-context";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatTime, cn } from "@/lib/utils";
import {
  Phone,
  Video,
  Search,
  Paperclip,
  Smile,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  Reply,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Info,
  FileText,
  Music,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { GroupInfoModal } from "./group-info-modal";
import { ContactInfoModal } from "./contact-info-modal";

import { saveCallLog } from "@/lib/call-service";

interface ChatViewProps {
  onBack?: () => void;
}

function MessageStatusTicks({ status }: { status?: "sent" | "delivered" | "read" }) {
  if (status === "read") {
    // 3 ticks for Read (in bright cyan)
    return (
      <span
        className="inline-flex items-center -space-x-2 text-cyan-300 ml-0.5 font-bold drop-shadow-sm"
        title="Read (3 check marks)"
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </span>
    );
  }

  if (status === "delivered") {
    // 2 ticks for Received / Delivered
    return (
      <span
        className="inline-flex items-center -space-x-2 text-blue-200/95 ml-0.5"
        title="Delivered (2 check marks)"
      >
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
      </span>
    );
  }

  // 1 tick for Sent
  return (
    <span
      className="inline-flex items-center text-blue-200/80 ml-0.5"
      title="Sent (1 check mark)"
    >
      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
    </span>
  );
}

export function ChatView({ onBack }: ChatViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteConversation,
    replyingTo,
    setReplyingTo,
    isUserOnline,
    startCall,
  } = useChat();

  const [inputText, setInputText] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchInChat, setSearchInChat] = React.useState("");
  const [editingMsgId, setEditingMsgId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [confirmDeleteChat, setConfirmDeleteChat] = React.useState(false);
  const [showGroupInfo, setShowGroupInfo] = React.useState(false);
  const [showContactInfo, setShowContactInfo] = React.useState(false);

  // Multi-type media attachment state
  interface AttachedMedia {
    url: string;
    filename: string;
    mediaType: "image" | "video" | "audio" | "document";
    size?: number;
  }
  const [attachedMedia, setAttachedMedia] = React.useState<AttachedMedia | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = React.useState(false);
  const [previewModalUrl, setPreviewModalUrl] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, replyingTo]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chat-attachments");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload file");
      }

      setAttachedMedia({
        url: data.url,
        filename: data.filename || file.name,
        mediaType: data.mediaType || "document",
        size: data.size || file.size,
      });
    } catch (err: unknown) {
      console.error("Attachment upload error:", err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-main)] select-none">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl neo-raised flex items-center justify-center p-3 shadow-lg">
            <img
              src="https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1768990817789-ChatApp.png"
              alt="ChatConnect"
              className="w-14 h-14 object-contain"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--bg-main)] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
          Select a chat to start messaging
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed mb-6">
          Choose any conversation from the list on the left, or click the <span className="font-semibold text-[var(--primary)]">+</span> button to begin a new chat.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neo-inset-sm text-xs text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Real-time delivery & 3-stage read receipts active
        </div>
      </div>
    );
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;

    const textToSend = inputText;
    const media = attachedMedia;

    setInputText("");
    setAttachedMedia(null);
    setShowEmojiPicker(false);

    await sendMessage(
      textToSend,
      media?.url || undefined,
      media?.mediaType || undefined
    );
  };

  const otherMember =
    activeConversation.type === "direct"
      ? activeConversation.members?.find((m) => m.user_id !== user?.id)
      : null;
  const otherProfile =
    activeConversation.other_user || otherMember?.profile || null;

  const displayName =
    activeConversation.type === "direct" && otherProfile
      ? otherProfile.full_name || otherProfile.username || otherProfile.phone_number || activeConversation.name || "Chat"
      : activeConversation.name || (activeConversation.type === "group" ? "Group Chat" : "Direct Message");

  const displayAvatar =
    activeConversation.type === "direct" && otherProfile
      ? otherProfile.avatar_url || activeConversation.avatar_url
      : activeConversation.avatar_url;

  const isOnline =
    activeConversation.type === "direct" &&
    Boolean(otherProfile && isUserOnline(otherProfile.id));

  const handleStartCall = (type: "video" | "audio") => {
    const callId = `call-${Date.now()}`;
    const targetName = displayName || "Call";
    const targetAvatar = displayAvatar || "";
    const currentUserId = user?.id || "guest";

    saveCallLog(currentUserId, {
      id: callId,
      name: targetName,
      avatar: targetAvatar,
      type,
      direction: "outgoing",
      duration: "00m 00s",
    });

    const targetUserId = otherProfile?.id || otherMember?.user_id;
    if (targetUserId && startCall) {
      startCall(
        {
          id: targetUserId,
          name: targetName,
          avatar: targetAvatar,
        },
        type,
        activeConversation.id
      );
    } else {
      const roomId = `room-${activeConversation.id}-${Date.now()}`;
      router.push(
        `/call/${roomId}?type=${type}&name=${encodeURIComponent(targetName)}&callId=${callId}&avatar=${encodeURIComponent(targetAvatar)}`
      );
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchInChat.trim()) return true;
    return m.content.toLowerCase().includes(searchInChat.toLowerCase());
  });

  const emojis = ["👍", "❤️", "😂", "🎉", "🔥", "🚀", "🙌", "💡", "✨", "👋", "👏", "💯"];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden">
      {/* Top Conversation Header - Click name to view contact/group info */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div
          onClick={() => {
            if (activeConversation.type === "group") {
              setShowGroupInfo(true);
            } else {
              setShowContactInfo(true);
            }
          }}
          className="flex items-center gap-3 min-w-0 select-none cursor-pointer group/hdr hover:opacity-90 transition-opacity"
          title={activeConversation.type === "group" ? "Click to view group info" : "Click to view contact details"}
        >
          {/* Mobile Back Arrow */}
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="md:hidden w-9 h-9 rounded-xl neo-btn flex items-center justify-center text-[var(--text-secondary)] mr-1 shrink-0 cursor-pointer"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <Avatar
            src={displayAvatar}
            name={displayName || "Chat"}
            size="md"
            status={activeConversation.type === "direct" ? (isOnline ? "online" : undefined) : undefined}
          />

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate flex items-center gap-1.5 group-hover/hdr:text-[var(--primary)] transition-colors">
              <span>{displayName}</span>
              {activeConversation.type === "group" ? (
                <span className="text-[10px] text-[var(--primary)] font-medium hidden sm:inline-block">
                  (Group Info)
                </span>
              ) : (
                <span className="text-[10px] text-[var(--text-muted)] font-normal hidden sm:inline-block">
                  • View Info
                </span>
              )}
            </h2>
            <p
              className={cn(
                "text-[11px] font-medium truncate",
                isOnline
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--text-muted)]"
              )}
            >
              {activeConversation.type === "group"
                ? `${activeConversation.members?.length || 3} participants • Tap for info`
                : isOnline
                ? "Active now • End-to-End Encrypted"
                : "Offline • End-to-End Encrypted"}
            </p>
          </div>
        </div>

        {/* Action Buttons: Audio Call, Video Call, Group Info, Search (Delete chat moved inside Contact Info) */}
        <div className="flex items-center gap-2">
          {activeConversation.type === "group" && (
            <Tooltip content="Group Info & Members" position="bottom">
              <Button
                variant="raised"
                size="icon"
                onClick={() => setShowGroupInfo(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-[var(--primary)] cursor-pointer"
                aria-label="Group Info"
              >
                <Info className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}

          <Tooltip content="Audio Call" position="bottom">
            <Button
              variant="raised"
              size="icon"
              onClick={() => handleStartCall("audio")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-[var(--primary)] cursor-pointer"
              aria-label="Start Voice Call"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content="HD Video Call (LiveKit)" position="bottom">
            <Button
              variant="primary"
              size="icon"
              onClick={() => handleStartCall("video")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl shadow-md text-white cursor-pointer"
              aria-label="Start HD Video Call"
            >
              <Video className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Search messages" position="bottom">
            <Button
              variant="raised"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-[var(--text-secondary)] cursor-pointer"
              aria-label="Search Messages"
            >
              <Search className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="p-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center gap-2 animate-fadeIn shrink-0">
          <Input
            placeholder="Search within this chat..."
            value={searchInChat}
            onChange={(e) => setSearchInChat(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9 text-xs"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSearch(false);
              setSearchInChat("");
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredMessages.map((msg) => {
          const isMe = msg.sender_id === (user?.id || "demo-user-1234-uuid");

          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col group transition-all",
                isMe ? "items-end" : "items-start"
              )}
            >
              {/* Sender Name if in group and not me */}
              {!isMe && activeConversation.type === "group" && (
                <span className="text-[10px] font-bold text-[var(--text-muted)] ml-2 mb-1">
                  {msg.sender?.full_name || "Member"}
                </span>
              )}

              <div
                className={cn(
                  "relative max-w-[85%] sm:max-w-md rounded-2xl p-3.5 transition-all text-xs sm:text-sm leading-relaxed",
                  isMe
                    ? "neo-btn-primary text-white rounded-br-sm shadow-md"
                    : "neo-raised bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-sm"
                )}
              >
                {/* Reply-to quote preview */}
                {msg.reply_to && (
                  <div
                    className={cn(
                      "mb-2 p-2 rounded-xl text-xs border-l-4",
                      isMe
                        ? "bg-white/15 border-white text-white/90"
                        : "bg-[var(--bg-card-alt)] border-[var(--primary)] text-[var(--text-secondary)]"
                    )}
                  >
                    <span className="font-bold block text-[10px]">
                      {msg.reply_to.sender?.full_name || "Replying to:"}
                    </span>
                    <p className="truncate">{msg.reply_to.content}</p>
                  </div>
                )}

                {/* Attached Media Rendering for Image, Video, Audio, Document */}
                {msg.media_url && (
                  <div className="mb-2">
                    {/* 1. Image */}
                    {(msg.media_type === "image" ||
                      (!msg.media_type &&
                        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(msg.media_url))) && (
                      <div
                        onClick={() => setPreviewModalUrl(msg.media_url)}
                        className="rounded-xl overflow-hidden neo-inset-sm cursor-pointer hover:opacity-95 transition-opacity"
                        title="Click to view full image"
                      >
                        <img
                          src={msg.media_url}
                          alt="Image Attachment"
                          className="max-h-64 w-full object-cover rounded-xl"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* 2. Video */}
                    {(msg.media_type === "video" ||
                      /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(msg.media_url)) && (
                      <div className="rounded-xl overflow-hidden bg-black/60 neo-inset-sm">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          className="max-h-72 w-full rounded-xl"
                        >
                          <source src={msg.media_url} />
                          Your browser does not support HTML5 video.
                        </video>
                      </div>
                    )}

                    {/* 3. Audio */}
                    {(msg.media_type === "audio" ||
                      /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(msg.media_url)) && (
                      <div className={cn(
                        "p-2 rounded-xl neo-inset-sm",
                        isMe ? "bg-white/10" : "bg-[var(--bg-card)]"
                      )}>
                        <audio controls className="w-full max-w-xs h-9">
                          <source src={msg.media_url} />
                          Your browser does not support audio playback.
                        </audio>
                      </div>
                    )}

                    {/* 4. Document / PDF / Archive */}
                    {(msg.media_type === "document" ||
                      (!["image", "video", "audio"].includes(msg.media_type || "") &&
                        !/\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|mkv|mp3|wav|ogg|m4a)(\?.*)?$/i.test(
                          msg.media_url
                        ))) && (
                      <a
                        href={msg.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all select-none",
                          isMe
                            ? "bg-white/15 hover:bg-white/25 text-white"
                            : "bg-[var(--bg-card-alt)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] neo-raised-sm"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">
                            {decodeURIComponent(msg.media_url.split("/").pop() || "Document").replace(/^\d+-/, "")}
                          </p>
                          <p className="text-[10px] opacity-75">Click to view / download</p>
                        </div>
                        <Download className="w-4 h-4 shrink-0 opacity-80" />
                      </a>
                    )}
                  </div>
                )}

                {/* Editing Inline Mode */}
                {editingMsgId === msg.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoComplete="off"
                      className="w-full px-2 py-1 text-xs rounded-lg text-black bg-white outline-none"
                      autoFocus
                    />
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setEditingMsgId(null)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await editMessage(msg.id, editingText);
                          setEditingMsgId(null);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-white text-[var(--primary)] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={cn(msg.is_deleted && "italic opacity-60")}>
                    {msg.content}
                  </p>
                )}

                {/* Metadata timestamp & read receipt */}
                <div
                  className={cn(
                    "flex items-center gap-1 justify-end text-[10px] mt-1 select-none",
                    isMe ? "text-blue-100" : "text-[var(--text-muted)]"
                  )}
                >
                  {msg.is_edited && <span>(edited)</span>}
                  <span>{formatTime(msg.created_at)}</span>
                  {isMe && <MessageStatusTicks status={msg.status} />}
                </div>

                {/* Hover Actions Menu */}
                {!msg.is_deleted && editingMsgId !== msg.id && (
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl neo-floating border border-[var(--border-subtle)] z-10",
                      isMe ? "-left-20" : "-right-20"
                    )}
                  >
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-card-alt)]"
                      title="Reply"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    {isMe && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditingText(msg.content);
                          }}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-card-alt)]"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(msg.id)}
                          className="p-1.5 rounded-lg text-[var(--danger)] hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Uploading Media Indicator Bar */}
      {isUploadingMedia && (
        <div className="px-4 py-2.5 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center gap-3 shrink-0 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Uploading attachment to Cloudflare R2...
          </span>
        </div>
      )}

      {/* Attached Media Preview Bar */}
      {attachedMedia && (
        <div className="px-4 py-2.5 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {attachedMedia.mediaType === "image" && (
              <img
                src={attachedMedia.url}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-xl neo-raised-sm"
              />
            )}
            {attachedMedia.mediaType === "video" && (
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center neo-raised-sm shrink-0">
                <Video className="w-6 h-6" />
              </div>
            )}
            {attachedMedia.mediaType === "audio" && (
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center neo-raised-sm shrink-0">
                <Music className="w-6 h-6" />
              </div>
            )}
            {attachedMedia.mediaType === "document" && (
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center neo-raised-sm shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs">
                {attachedMedia.filename}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {attachedMedia.mediaType.toUpperCase()}
                {attachedMedia.size ? ` • ${(attachedMedia.size / (1024 * 1024)).toFixed(1)} MB` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedMedia(null)}
            className="w-7 h-7 rounded-full neo-btn flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reply-To Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[var(--bg-card-alt)] border-t border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs truncate">
            <Reply className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            <span className="font-bold text-[var(--text-primary)]">
              Replying to {replyingTo.sender?.full_name || "Message"}:
            </span>
            <span className="text-[var(--text-secondary)] truncate">
              {replyingTo.content}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="p-2.5 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex items-center gap-2 overflow-x-auto shrink-0 animate-fadeIn">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setInputText((prev) => prev + emoji)}
              className="text-lg p-1.5 rounded-xl hover:bg-[var(--bg-card-alt)] transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Input Form */}
      <form
        onSubmit={handleSend}
        autoComplete="off"
        className="p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-md flex items-center gap-2 sm:gap-3 shrink-0"
      >
        {/* Attachment Input Hidden */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attachment Button */}
        <button
          type="button"
          disabled={isUploadingMedia}
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-2xl neo-btn flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 disabled:opacity-40"
          aria-label="Attach photo, video, PDF or document"
          title="Attach photo, video, PDF or document"
        >
          {isUploadingMedia ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        {/* Emoji Toggle */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
            showEmojiPicker
              ? "neo-inset text-[var(--primary)]"
              : "neo-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
          aria-label="Toggle emojis"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Inset Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            autoComplete="off"
            className="w-full h-11 px-4 text-xs sm:text-sm rounded-2xl neo-inset bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputText.trim() && !attachedMedia) || isUploadingMedia}
          className="w-11 h-11 rounded-2xl neo-btn-primary flex items-center justify-center text-white shrink-0 disabled:opacity-40 disabled:pointer-events-none transition-transform hover:scale-105"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>

      {/* Delete Message Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteMessage(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action will mark it as deleted."
        confirmLabel="Delete"
        danger
      />

      {/* Delete Chat Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDeleteChat}
        onClose={() => setConfirmDeleteChat(false)}
        onConfirm={async () => {
          if (activeConversation) {
            const convId = activeConversation.id;
            setConfirmDeleteChat(false);
            await deleteConversation(convId);
            if (onBack) {
              onBack();
            } else {
              router.push("/dashboard");
            }
          }
        }}
        title="Delete Conversation"
        message={`Are you sure you want to delete this chat with "${activeConversation.name}"? All messages and attachments in this conversation will be permanently removed.`}
        confirmLabel="Delete Chat"
        danger
      />

      {/* WhatsApp-Style Group Info & Member Management Modal */}
      {activeConversation.type === "group" && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          conversation={activeConversation}
        />
      )}

      {/* Contact Info Modal (for 1-on-1 direct chats) */}
      {activeConversation.type === "direct" && (
        <ContactInfoModal
          isOpen={showContactInfo}
          onClose={() => setShowContactInfo(false)}
          conversation={activeConversation}
          otherProfile={otherProfile}
          isOnline={isOnline}
          onDeleteChat={async () => {
            const convId = activeConversation.id;
            setShowContactInfo(false);
            await deleteConversation(convId);
            if (onBack) {
              onBack();
            } else {
              router.push("/dashboard");
            }
          }}
          onStartCall={handleStartCall}
        />
      )}

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn"
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={previewModalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={() => setPreviewModalUrl(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[85vh] p-2 flex items-center justify-center"
          >
            <img
              src={previewModalUrl}
              alt="Full Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl neo-raised"
            />
          </div>
        </div>
      )}
    </div>
  );
}
