"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, Users, PhoneCall, User, Settings } from "lucide-react";
import { useChat } from "@/components/chat/chat-context";

export function BottomNav() {
  const pathname = usePathname();
  const { totalUnreadCount } = useChat();

  // Hide bottom nav if inside a live full-screen video call
  if (pathname.startsWith("/call/")) {
    return null;
  }

  const items = [
    {
      label: "Chats",
      href: "/dashboard",
      icon: MessageSquare,
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
    },
    { label: "Contacts", href: "/contacts", icon: Users },
    { label: "Calls", href: "/calls", icon: PhoneCall },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 py-2 safe-area-pb shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname.startsWith("/chat"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[56px] transition-all duration-200",
                isActive
                  ? "neo-inset text-[var(--primary)] font-bold scale-105"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold flex items-center justify-center shadow">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
