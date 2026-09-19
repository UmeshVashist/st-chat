"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatView } from "@/components/chat/chat-view";
import { NewChatModal } from "@/components/chat/new-chat-modal";

function DashboardContent() {
  const router = useRouter();
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);

  const handleSelectOnMobile = (id: string) => {
    // On small screens, navigate to the dedicated chat page
    if (window.innerWidth < 768) {
      router.push(`/chat/${id}`);
    }
  };

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden">
      {/* Middle Conversation List (Full width on mobile, 320px-380px on desktop/laptop) */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 h-full flex flex-col">
        <ConversationList
          onSelectConversation={handleSelectOnMobile}
          onOpenNewChatModal={() => setIsNewChatOpen(true)}
        />
      </div>

      {/* Main Chat View (Hidden on mobile dashboard, visible on tablet/laptop/desktop) */}
      <div className="hidden md:flex flex-1 h-full overflow-hidden">
        <ChatView />
      </div>

      {/* New Conversation Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}
