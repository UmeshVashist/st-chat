"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useChat } from "@/components/chat/chat-context";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatView } from "@/components/chat/chat-view";
import { NewChatModal } from "@/components/chat/new-chat-modal";

function ChatIdContent() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const { setActiveConversationId } = useChat();
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);

  React.useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [conversationId, setActiveConversationId]);

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden">
      {/* Conversation List (Hidden on mobile when inside specific chat, visible on desktop/laptop) */}
      <div className="hidden md:flex w-80 lg:w-96 shrink-0 h-full flex-col">
        <ConversationList
          onSelectConversation={(id) => {
            router.push(`/chat/${id}`);
          }}
          onOpenNewChatModal={() => setIsNewChatOpen(true)}
        />
      </div>

      {/* Main Chat View (Full width on mobile, right side on desktop) */}
      <div className="flex flex-1 h-full overflow-hidden">
        <ChatView onBack={() => router.push("/dashboard")} />
      </div>

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
}

export default function ChatConversationPage() {
  return (
    <DashboardShell>
      <ChatIdContent />
    </DashboardShell>
  );
}
