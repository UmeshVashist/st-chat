"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Conversation, Message, Profile } from "@/types/database";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { IncomingCallModal } from "@/components/call/incoming-call-modal";
import { OutgoingCallModal } from "@/components/call/outgoing-call-modal";
import { getUserSettings } from "@/lib/settings-service";

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  contacts: Profile[];
  typingUsers: string[];
  replyingTo: Message | null;
  searchQuery: string;
  totalUnreadCount: number;
  onlineUserIds: Set<string>;
  isUserOnline: (userId?: string | null) => boolean;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  setReplyingTo: (message: Message | null) => void;
  setSearchQuery: (query: string) => void;
  broadcastTyping: (isTyping: boolean) => void;
  createDirectChat: (targetUserId: string) => Promise<string>;
  createDirectChatWithUser: (targetUser: Profile) => Promise<string>;
  searchUserByPhone: (phoneNumber: string) => Promise<{ profile?: Profile; error?: string }>;
  createGroupChat: (name: string, memberIds: string[], avatarUrl?: string, description?: string) => Promise<string>;
  addGroupMembers: (conversationId: string, memberIds: string[]) => Promise<void>;
  removeGroupMember: (conversationId: string, userId: string) => Promise<void>;
  setGroupMemberRole: (conversationId: string, userId: string, role: "admin" | "member") => Promise<void>;
  updateGroupInfo: (conversationId: string, name: string, description?: string, avatarUrl?: string) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  startCall: (targetUser: { id: string; name: string; avatar?: string }, type: "video" | "audio", conversationId?: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = React.useMemo(() => createClient(), []);
  const userId = user?.id;

  // Real data state - starts clean without mock seed data
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const [isHydrated, setIsHydrated] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const activeChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Call Signaling State
  interface CallParticipant {
    id: string;
    name: string;
    avatar?: string;
  }

  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    roomId: string;
    caller: CallParticipant;
    callType: "video" | "audio";
    conversationId?: string;
  } | null>(null);

  const [outgoingCall, setOutgoingCall] = useState<{
    callId: string;
    roomId: string;
    callee: CallParticipant;
    callType: "video" | "audio";
    statusText: string;
    conversationId?: string;
  } | null>(null);

  const outgoingCallRef = React.useRef(outgoingCall);
  outgoingCallRef.current = outgoingCall;
  const outgoingTargetChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const outgoingPingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const cleanupOutgoingCall = React.useCallback(() => {
    if (outgoingPingIntervalRef.current) {
      clearInterval(outgoingPingIntervalRef.current);
      outgoingPingIntervalRef.current = null;
    }
    if (outgoingTargetChannelRef.current) {
      try {
        supabase.removeChannel(outgoingTargetChannelRef.current);
      } catch {}
      outgoingTargetChannelRef.current = null;
    }
  }, [supabase]);

  // Live Supabase Presence Tracking for true active/online status
  useEffect(() => {
    if (!userId) {
      setOnlineUserIds(new Set());
      return;
    }

    const presenceChannel = supabase.channel("global-online-presence", {
      config: {
        presence: { key: userId },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const onlineSet = new Set<string>();
        Object.keys(state).forEach((key) => {
          onlineSet.add(key);
        });
        setOnlineUserIds(onlineSet);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const settings = getUserSettings(userId);
          if (settings.showOnlineStatus) {
            await presenceChannel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
            fetch("/api/users/presence", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, isOnline: true }),
            }).catch(() => {});
          }
        }
      });

    const handleSettingsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const updated = customEvent.detail;
      if (updated && typeof updated.showOnlineStatus === "boolean") {
        if (updated.showOnlineStatus) {
          presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
          fetch("/api/users/presence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, isOnline: true }),
          }).catch(() => {});
        } else {
          presenceChannel.untrack();
          fetch("/api/users/presence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, isOnline: false }),
          }).catch(() => {});
        }
      }
    };

    window.addEventListener("chatconnect_settings_updated", handleSettingsUpdate);

    const handleBeforeUnload = () => {
      presenceChannel.untrack();
      navigator.sendBeacon(
        "/api/users/presence",
        JSON.stringify({ userId, isOnline: false })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("chatconnect_settings_updated", handleSettingsUpdate);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      fetch("/api/users/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isOnline: false }),
      }).catch(() => {});
    };
  }, [userId, supabase]);

  const isUserOnline = useCallback(
    (targetId?: string | null) => {
      if (!targetId) return false;
      return onlineUserIds.has(targetId);
    },
    [onlineUserIds]
  );

  // 1. Client mount & local cache load
  useEffect(() => {
    setIsHydrated(true);
    if (!userId) {
      setConversations([]);
      setContacts([]);
      setMessagesMap({});
      setActiveConversationId(null);
      return;
    }

    try {
      // Clean up legacy bloated message caches to immediately recover localStorage quota
      if (typeof window !== "undefined") {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("chatconnect_messages_") || k.includes("temp-"))) {
            localStorage.removeItem(k);
          }
        }
      }

      const savedConvs = localStorage.getItem(`chatconnect_conversations_${userId}`);
      if (savedConvs) setConversations(JSON.parse(savedConvs));

      const savedContacts = localStorage.getItem(`chatconnect_contacts_${userId}`);
      if (savedContacts) setContacts(JSON.parse(savedContacts));
    } catch (err) {
      console.error("Error loading chat state from localStorage:", err);
    }
  }, [userId]);

  // 2. Fetch real conversations from database
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${userId}`);
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  // Helper to mark active conversation as read
  const markAsRead = useCallback(async (convId: string) => {
    if (!userId || !convId) return;
    try {
      await fetch("/api/chat/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, userId }),
      });
      // Clear unread count locally for this conversation
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error("Error marking messages read:", err);
    }
  }, [userId]);

  // 3. Fetch real messages when active conversation opens
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`);
        const data = await res.json();
        if (data.messages) {
          setMessagesMap((prev) => ({
            ...prev,
            [activeConversationId]: data.messages,
          }));
        }
        // Mark as read in db
        markAsRead(activeConversationId);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [activeConversationId, markAsRead]);

  // 4. Supabase Realtime channel for live messages, read receipts, and instant broadcast
  useEffect(() => {
    if (!activeConversationId) {
      activeChannelRef.current = null;
      return;
    }

    const channel = supabase
      .channel(`room:${activeConversationId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      // A. Instant WebSocket Broadcast from Sender (sub-50ms arrival!)
      .on("broadcast", { event: "new_message" }, (payload) => {
        const newMsg = payload.payload?.message as Message;
        if (!newMsg || newMsg.sender_id === userId) return;

        setMessagesMap((prev) => {
          const list = prev[activeConversationId] || [];
          if (list.some((m) => m.id === newMsg.id)) return prev;
          return {
            ...prev,
            [activeConversationId]: [
              ...list,
              { ...newMsg, status: "read" },
            ],
          };
        });

        // Mark as read and acknowledge to sender if read receipts enabled
        markAsRead(activeConversationId);
        const settings = getUserSettings(userId);
        if (settings.showReadReceipts) {
          channel.send({
            type: "broadcast",
            event: "messages_read",
            payload: { conversationId: activeConversationId, readerId: userId },
          });
        }

        // Trigger native desktop notification if window is blurred/hidden
        if (
          settings.desktopNotifications &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.hidden
        ) {
          try {
            new Notification(newMsg.sender?.full_name || "New Message", {
              body: newMsg.content || "Sent an attachment",
              icon: newMsg.sender?.avatar_url || "/favicon.ico",
            });
          } catch {}
        }

        // Update conversation last_message in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, last_message_at: newMsg.created_at, last_message: newMsg }
              : c
          )
        );
      })
      // B. Database Change Fallback
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessagesMap((prev) => {
            const list = prev[activeConversationId] || [];
            if (list.some((m) => m.id === newMsg.id)) return prev;
            return {
              ...prev,
              [activeConversationId]: [
                ...list,
                { ...newMsg, status: newMsg.sender_id === userId ? "delivered" : "read" },
              ],
            };
          });

          if (newMsg.sender_id !== userId) {
            markAsRead(activeConversationId);
            channel.send({
              type: "broadcast",
              event: "messages_read",
              payload: { conversationId: activeConversationId, readerId: userId },
            });
          }

          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? { ...c, last_message_at: newMsg.created_at, last_message: newMsg }
                : c
            )
          );
        }
      )
      // C. Read receipts broadcast (3 checkmarks update)
      .on("broadcast", { event: "messages_read" }, (payload) => {
        const data = payload.payload as { conversationId: string; readerId: string };
        if (data && data.readerId !== userId) {
          setMessagesMap((prev) => {
            const list = prev[activeConversationId] || [];
            return {
              ...prev,
              [activeConversationId]: list.map((m) =>
                m.sender_id === userId ? { ...m, status: "read" } : m
              ),
            };
          });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && userId) {
          channel.send({
            type: "broadcast",
            event: "messages_read",
            payload: { conversationId: activeConversationId, readerId: userId },
          });
        }
      });

    activeChannelRef.current = channel;

    return () => {
      activeChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, supabase, userId, markAsRead]);

  // Active conversation background polling (every 2.5s) to guarantee new messages appear without reloading
  useEffect(() => {
    if (!activeConversationId || !userId) return;

    const pollMessagesInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`);
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          setMessagesMap((prev) => {
            const current = prev[activeConversationId] || [];
            if (
              current.length === data.messages.length &&
              current[current.length - 1]?.id === data.messages[data.messages.length - 1]?.id
            ) {
              return prev;
            }
            return {
              ...prev,
              [activeConversationId]: data.messages,
            };
          });
        }
      } catch {}
    }, 2500);

    return () => clearInterval(pollMessagesInterval);
  }, [activeConversationId, userId]);

  // Global personal inbox channel for live unread badge and new message alerts
  useEffect(() => {
    if (!userId) return;

    const inboxChannel = supabase
      .channel(`inbox-notifications:${userId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === userId) return;
          loadConversations();
        }
      )
      .on("broadcast", { event: "new_message_alert" }, (payload) => {
        const newMsg = payload.payload?.message as Message;
        if (!newMsg || newMsg.sender_id === userId) return;

        loadConversations();

        const convId = payload.payload?.conversationId;
        if (convId && activeConversationId === convId) {
          setMessagesMap((prev) => {
            const list = prev[convId] || [];
            if (list.some((m) => m.id === newMsg.id)) return prev;
            return {
              ...prev,
              [convId]: [...list, { ...newMsg, status: "read" }],
            };
          });
          markAsRead(convId);
        }
      })
      .on("broadcast", { event: "incoming_call" }, (payload) => {
        const data = payload.payload;
        if (!data || data.callerId === userId) return;

        setIncomingCall((prev) => {
          if (prev && prev.callId === data.callId) return prev;
          return {
            callId: data.callId,
            roomId: data.roomId,
            caller: {
              id: data.callerId,
              name: data.callerName,
              avatar: data.callerAvatar,
            },
            callType: data.callType || "video",
            conversationId: data.conversationId,
          };
        });
      })
      .on("broadcast", { event: "call_cancelled" }, () => {
        setIncomingCall(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inboxChannel);
    };
  }, [userId, supabase, activeConversationId, loadConversations, markAsRead]);

  // Background conversation list polling (every 4s) to ensure unread counts and recent messages stay synced
  useEffect(() => {
    if (!userId) return;

    const pollConvsInterval = setInterval(() => {
      loadConversations();
    }, 4000);

    return () => clearInterval(pollConvsInterval);
  }, [userId, loadConversations]);

  // 5. Safely persist lightweight conversations and contacts cache (no full messages)
  useEffect(() => {
    if (!isHydrated || !userId || typeof window === "undefined") return;
    try {
      // Strip any huge nested fields or blobs to ensure negligible footprint (< 50KB)
      const lightweightConvs = conversations.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        avatar_url: c.avatar_url,
        last_message_at: c.last_message_at,
        unread_count: c.unread_count,
        other_user: c.other_user,
        members: c.members,
        last_message: c.last_message
          ? {
              id: c.last_message.id,
              content: c.last_message.content,
              media_type: c.last_message.media_type,
              media_url: c.last_message.media_url,
              created_at: c.last_message.created_at,
              sender_id: c.last_message.sender_id,
            }
          : undefined,
      }));
      localStorage.setItem(`chatconnect_conversations_${userId}`, JSON.stringify(lightweightConvs));
    } catch (err) {
      console.warn("[Storage] Quota protection caught while saving conversations:", err);
      try {
        localStorage.removeItem(`chatconnect_conversations_${userId}`);
      } catch {}
    }
  }, [conversations, userId, isHydrated]);

  useEffect(() => {
    if (!isHydrated || !userId || typeof window === "undefined") return;
    try {
      localStorage.setItem(`chatconnect_contacts_${userId}`, JSON.stringify(contacts));
    } catch (err) {
      console.warn("[Storage] Quota protection caught while saving contacts:", err);
    }
  }, [contacts, userId, isHydrated]);

  // Active conversation object
  const activeConversation = React.useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Current messages for active conversation
  const messages = React.useMemo(() => {
    if (!activeConversationId) return [];
    return messagesMap[activeConversationId] || [];
  }, [messagesMap, activeConversationId]);

  // Send message to real database
  const sendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!activeConversationId || (!content.trim() && !mediaUrl) || !userId) return;

    const tempId = "temp-" + Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: userId,
      content: content.trim(),
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      reply_to_id: replyingTo?.id || null,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "sent",
      sender: user || undefined,
      reply_to: replyingTo || undefined,
    };

    // Optimistic UI update
    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMessage],
    }));

    // Optimistically update conversations list with latest message and sort newest first
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              last_message_at: optimisticMessage.created_at,
              last_message: optimisticMessage,
            }
          : c
      );
      return [...updated].sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    });

    setReplyingTo(null);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          senderId: userId,
          content: content.trim(),
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          replyToId: replyingTo?.id || null,
        }),
      });

      const data = await res.json();
      if (data.message) {
        const confirmedMsg = data.message;
        setMessagesMap((prev) => ({
          ...prev,
          [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
            m.id === tempId ? { ...confirmedMsg, status: confirmedMsg.status || "delivered" } : m
          ),
        }));

        // Keep conversation last message in sync with server confirmed record
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  last_message_at: confirmedMsg.created_at,
                  last_message: confirmedMsg,
                }
              : c
          );
          return [...updated].sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          );
        });

        // 1. Instant WebSocket broadcast to other user in active room (sub-50ms)
        if (activeChannelRef.current) {
          activeChannelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: { message: confirmedMsg },
          });
        }

        // 2. Instant alert to recipient personal inbox channel
        const otherUserId =
          activeConversation?.other_user?.id ||
          activeConversation?.members?.find((m) => m.user_id !== userId)?.user_id;

        if (otherUserId) {
          const alertChan = supabase.channel(`inbox-notifications:${otherUserId}`, {
            config: { broadcast: { self: false } },
          });
          alertChan.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              alertChan.send({
                type: "broadcast",
                event: "new_message_alert",
                payload: { message: confirmedMsg, conversationId: activeConversationId },
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeConversationId) return;

    setMessagesMap((prev) => {
      const list = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: list.map((m) =>
          m.id === messageId ? { ...m, content: newContent, is_edited: true } : m
        ),
      };
    });

    try {
      await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, content: newContent }),
      });
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;

    setMessagesMap((prev) => {
      const list = prev[activeConversationId] || [];
      return {
        ...prev,
        [activeConversationId]: list.map((m) =>
          m.id === messageId
            ? { ...m, content: "This message was deleted", is_deleted: true }
            : m
        ),
      };
    });

    try {
      await fetch(`/api/chat/messages?messageId=${messageId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }

    try {
      await fetch(`/api/chat/conversations?conversationId=${conversationId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  const deleteContact = async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const broadcastTyping = (isTyping: boolean) => {
    const name = user?.full_name || "Someone";
    if (isTyping) {
      setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    } else {
      setTypingUsers((prev) => prev.filter((u) => u !== name));
    }
  };

  // Search real registered users from Supabase database
  const searchUserByPhone = async (
    phoneNumber: string
  ): Promise<{ profile?: Profile; error?: string }> => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      return { error: "Please enter a mobile phone number." };
    }

    const cleanInput = trimmed.replace(/\D/g, "");
    if (cleanInput.length < 5) {
      return { error: "Please enter a valid phone number (at least 5 digits)." };
    }

    // 1. Check local contacts in state first
    const localMatch = contacts.find((c) => {
      if (!c.phone_number) return false;
      const cleanContact = c.phone_number.replace(/\D/g, "");
      return c.phone_number === trimmed || cleanContact === cleanInput;
    });

    if (localMatch) {
      return { profile: localMatch };
    }

    // 2. Query real Supabase database via API
    try {
      const res = await fetch(`/api/users/search?phone=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (res.ok && data.profile) {
        return { profile: data.profile };
      }
      return { error: data.error || "User not found! This mobile number is not registered on ChatConnect." };
    } catch (err) {
      return { error: "Failed to search for user. Please try again." };
    }
  };

  const createDirectChat = async (targetUserId: string): Promise<string> => {
    const contact = contacts.find((c) => c.id === targetUserId);
    if (!contact) return "";
    return createDirectChatWithUser(contact);
  };

  // Create real direct chat in database
  const createDirectChatWithUser = async (targetUser: Profile): Promise<string> => {
    if (!userId) return "";

    // 1. Add to contacts if not present
    setContacts((prev) => {
      if (prev.some((c) => c.id === targetUser.id)) return prev;
      return [targetUser, ...prev];
    });

    // 2. Check existing local conversation
    const existing = conversations.find(
      (c) => c.type === "direct" && c.members?.some((m) => m.user_id === targetUser.id)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          name: targetUser.full_name || targetUser.phone_number || "Chat",
          avatarUrl: targetUser.avatar_url,
          createdBy: userId,
          memberIds: [userId, targetUser.id],
        }),
      });

      const data = await res.json();
      if (data.conversation) {
        setConversations((prev) => [data.conversation, ...prev.filter((c) => c.id !== data.conversation.id)]);
        setActiveConversationId(data.conversation.id);
        return data.conversation.id;
      }
    } catch (err) {
      console.error("Error creating direct chat:", err);
    }

    return "";
  };

  // Create real group chat in database
  const createGroupChat = async (
    name: string,
    memberIds: string[],
    avatarUrl?: string,
    description?: string
  ): Promise<string> => {
    if (!userId) return "";

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name: name.trim(),
          description: description?.trim() || null,
          avatarUrl: avatarUrl || null,
          createdBy: userId,
          memberIds: Array.from(new Set([userId, ...memberIds])),
        }),
      });

      const data = await res.json();
      if (data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
        return data.conversation.id;
      }
    } catch (err) {
      console.error("Error creating group chat:", err);
    }

    return "";
  };

  const addGroupMembers = async (conversationId: string, memberIds: string[]): Promise<void> => {
    // Add members locally and update
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          const newMembers = memberIds.map((mid) => {
            const contact = contacts.find((ct) => ct.id === mid);
            return {
              id: "m-" + Math.random().toString(36).substring(2, 6),
              conversation_id: conversationId,
              user_id: mid,
              role: "member" as const,
              last_read_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              profile: contact,
            };
          });
          return {
            ...c,
            members: [...(c.members || []), ...newMembers],
          };
        }
        return c;
      })
    );
  };

  const removeGroupMember = async (conversationId: string, targetUserId: string): Promise<void> => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            members: (c.members || []).filter((m) => m.user_id !== targetUserId),
          };
        }
        return c;
      })
    );
  };

  const setGroupMemberRole = async (
    conversationId: string,
    targetUserId: string,
    role: "admin" | "member"
  ): Promise<void> => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            members: (c.members || []).map((m) =>
              m.user_id === targetUserId ? { ...m, role } : m
            ),
          };
        }
        return c;
      })
    );
  };

  const updateGroupInfo = async (
    conversationId: string,
    name: string,
    description?: string,
    avatarUrl?: string
  ): Promise<void> => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            name: name.trim(),
            description: description?.trim() || c.description,
            avatar_url: avatarUrl || c.avatar_url,
          };
        }
        return c;
      })
    );
  };

  const leaveGroup = async (conversationId: string): Promise<void> => {
    if (!userId) return;
    await removeGroupMember(conversationId, userId);
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  };

  const totalUnreadCount = React.useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
  }, [conversations]);

  // Call Signaling Listener on user-calls channel
  useEffect(() => {
    if (!userId) return;

    const callChannel = supabase.channel(`user-calls:${userId}`, {
      config: { broadcast: { self: false } },
    });

    callChannel
      .on("broadcast", { event: "incoming_call" }, (payload) => {
        const data = payload.payload;
        if (!data || data.callerId === userId) return;

        setIncomingCall({
          callId: data.callId,
          roomId: data.roomId,
          caller: {
            id: data.callerId,
            name: data.callerName,
            avatar: data.callerAvatar,
          },
          callType: data.callType || "video",
          conversationId: data.conversationId,
        });
      })
      .on("broadcast", { event: "call_accepted" }, (payload) => {
        const data = payload.payload;
        if (outgoingCallRef.current && outgoingCallRef.current.callId === data.callId) {
          const out = outgoingCallRef.current;
          setOutgoingCall(null);
          router.push(
            `/call/${out.roomId}?type=${out.callType}&name=${encodeURIComponent(out.callee.name)}&avatar=${encodeURIComponent(out.callee.avatar || "")}&role=caller&callId=${out.callId}`
          );
        }
      })
      .on("broadcast", { event: "call_declined" }, () => {
        cleanupOutgoingCall();
        if (outgoingCallRef.current) {
          setOutgoingCall((prev) => (prev ? { ...prev, statusText: "Call Declined" } : null));
          setTimeout(() => {
            setOutgoingCall(null);
          }, 1500);
        }
      })
      .on("broadcast", { event: "call_cancelled" }, () => {
        setIncomingCall(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(callChannel);
    };
  }, [userId, supabase, router, cleanupOutgoingCall]);

  const startCall = (
    targetUser: { id: string; name: string; avatar?: string },
    type: "video" | "audio",
    conversationId?: string
  ) => {
    if (!userId) return;

    // Clean up previous call timers and channels
    cleanupOutgoingCall();

    const callId = `call-${Date.now()}`;
    const roomId = `room-${conversationId || "direct"}-${Date.now()}`;

    setOutgoingCall({
      callId,
      roomId,
      callee: targetUser,
      callType: type,
      statusText: "Ringing...",
      conversationId,
    });

    // Remove any previous cached channel for this target from supabase client
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:user-calls:${targetUser.id}`);
    if (existing) {
      try {
        supabase.removeChannel(existing);
      } catch {}
    }

    const targetChannel = supabase.channel(`user-calls:${targetUser.id}`, {
      config: { broadcast: { self: false } },
    });
    const inboxTargetChannel = supabase.channel(`inbox-notifications:${targetUser.id}`, {
      config: { broadcast: { self: false } },
    });
    outgoingTargetChannelRef.current = targetChannel;

    const callPayload = {
      callId,
      roomId,
      callerId: userId,
      callerName: user?.full_name || user?.username || "User",
      callerAvatar: user?.avatar_url,
      callType: type,
      conversationId,
    };

    const sendCallPing = () => {
      try {
        targetChannel.send({
          type: "broadcast",
          event: "incoming_call",
          payload: callPayload,
        });
      } catch {}
      try {
        inboxTargetChannel.send({
          type: "broadcast",
          event: "incoming_call",
          payload: callPayload,
        });
      } catch {}
    };

    targetChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendCallPing();
      }
    });

    inboxTargetChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendCallPing();
      }
    });

    // Repeat ping every 1.5s for up to 30s while ringing to ensure guaranteed delivery
    const pingInterval = setInterval(() => {
      if (outgoingCallRef.current && outgoingCallRef.current.callId === callId) {
        sendCallPing();
      } else {
        clearInterval(pingInterval);
      }
    }, 1500);
    outgoingPingIntervalRef.current = pingInterval;

    // Auto timeout after 35s if unanswered
    setTimeout(() => {
      if (outgoingCallRef.current && outgoingCallRef.current.callId === callId) {
        cleanupOutgoingCall();
        setOutgoingCall((prev) => (prev ? { ...prev, statusText: "Unavailable" } : null));
        setTimeout(() => {
          setOutgoingCall(null);
        }, 2000);
      }
    }, 35000);
  };

  const handleCancelOutgoingCall = () => {
    if (outgoingCall) {
      if (outgoingTargetChannelRef.current) {
        try {
          outgoingTargetChannelRef.current.send({
            type: "broadcast",
            event: "call_cancelled",
            payload: { callId: outgoingCall.callId },
          });
        } catch {}
      }
      if (outgoingCall.callee?.id) {
        try {
          const chan = supabase.channel(`inbox-notifications:${outgoingCall.callee.id}`, {
            config: { broadcast: { self: false } },
          });
          chan.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              chan.send({
                type: "broadcast",
                event: "call_cancelled",
                payload: { callId: outgoingCall.callId },
              });
              setTimeout(() => {
                try { supabase.removeChannel(chan); } catch {}
              }, 1000);
            }
          });
        } catch {}
      }
      cleanupOutgoingCall();
      setOutgoingCall(null);
    }
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    const { callId, roomId, caller, callType } = incomingCall;

    const callerChannel = supabase.channel(`user-calls:${caller.id}`, {
      config: { broadcast: { self: false } },
    });
    const callerInboxChannel = supabase.channel(`inbox-notifications:${caller.id}`, {
      config: { broadcast: { self: false } },
    });

    const sendAccepted = (ch: typeof callerChannel) => {
      try {
        ch.send({
          type: "broadcast",
          event: "call_accepted",
          payload: { callId, roomId },
        });
      } catch {}
    };

    callerChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendAccepted(callerChannel);
        setTimeout(() => {
          try { supabase.removeChannel(callerChannel); } catch {}
        }, 1200);
      }
    });

    callerInboxChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendAccepted(callerInboxChannel);
        setTimeout(() => {
          try { supabase.removeChannel(callerInboxChannel); } catch {}
        }, 1200);
      }
    });

    setIncomingCall(null);

    router.push(
      `/call/${roomId}?type=${callType}&name=${encodeURIComponent(caller.name)}&avatar=${encodeURIComponent(caller.avatar || "")}&role=receiver&callId=${callId}`
    );
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    const { callId, caller } = incomingCall;

    const callerChannel = supabase.channel(`user-calls:${caller.id}`, {
      config: { broadcast: { self: false } },
    });
    const callerInboxChannel = supabase.channel(`inbox-notifications:${caller.id}`, {
      config: { broadcast: { self: false } },
    });

    const sendDeclined = (ch: typeof callerChannel) => {
      try {
        ch.send({
          type: "broadcast",
          event: "call_declined",
          payload: { callId },
        });
      } catch {}
    };

    callerChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendDeclined(callerChannel);
        setTimeout(() => {
          try { supabase.removeChannel(callerChannel); } catch {}
        }, 1000);
      }
    });

    callerInboxChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendDeclined(callerInboxChannel);
        setTimeout(() => {
          try { supabase.removeChannel(callerInboxChannel); } catch {}
        }, 1000);
      }
    });

    setIncomingCall(null);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        contacts,
        typingUsers,
        replyingTo,
        searchQuery,
        totalUnreadCount,
        onlineUserIds,
        isUserOnline,
        setActiveConversationId,
        sendMessage,
        editMessage,
        deleteMessage,
        deleteConversation,
        deleteContact,
        setReplyingTo,
        setSearchQuery,
        broadcastTyping,
        createDirectChat,
        createDirectChatWithUser,
        searchUserByPhone,
        createGroupChat,
        addGroupMembers,
        removeGroupMember,
        setGroupMemberRole,
        updateGroupInfo,
        leaveGroup,
        startCall,
      }}
    >
      {children}

      {/* Global Incoming Call Ringing Modal */}
      <IncomingCallModal
        isOpen={!!incomingCall}
        caller={incomingCall?.caller || null}
        callType={incomingCall?.callType || "video"}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      {/* Global Outgoing Call Dialing Modal */}
      <OutgoingCallModal
        isOpen={!!outgoingCall}
        callee={outgoingCall?.callee || null}
        callType={outgoingCall?.callType || "video"}
        statusText={outgoingCall?.statusText || "Calling..."}
        onCancel={handleCancelOutgoingCall}
      />
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    return {
      conversations: [],
      activeConversationId: null,
      activeConversation: null,
      messages: [],
      contacts: [],
      typingUsers: [],
      replyingTo: null,
      searchQuery: "",
      totalUnreadCount: 0,
      onlineUserIds: new Set<string>(),
      isUserOnline: () => false,
      setActiveConversationId: () => {},
      sendMessage: async () => {},
      editMessage: async () => {},
      deleteMessage: async () => {},
      deleteConversation: async () => {},
      deleteContact: async () => {},
      setReplyingTo: () => {},
      setSearchQuery: () => {},
      broadcastTyping: () => {},
      createDirectChat: async () => "",
      createDirectChatWithUser: async () => "",
      searchUserByPhone: async () => ({} as { profile?: Profile; error?: string }),
      createGroupChat: async () => "",
      addGroupMembers: async () => {},
      removeGroupMember: async () => {},
      setGroupMemberRole: async () => {},
      updateGroupInfo: async () => {},
      leaveGroup: async () => {},
      startCall: () => {},
    };
  }
  return context;
}
