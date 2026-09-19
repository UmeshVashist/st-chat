"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { BrandIcon } from "@/components/ui/brand-icon";
import {
  MessageSquare,
  Users,
  PhoneCall,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { useChat } from "@/components/chat/chat-context";

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const { resolvedTheme, toggleTheme } = useTheme();

  const navItems = [
    {
      label: "Chats",
      href: "/dashboard",
      icon: MessageSquare,
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
    },
    { label: "Contacts", href: "/contacts", icon: Users },
    { label: "Calls", href: "/calls", icon: PhoneCall },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-20 lg:w-24 py-6 px-3 neo-raised border-r border-[var(--border-subtle)] bg-[var(--bg-main)] z-20 shrink-0">
      {/* Brand Logo */}
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/dashboard"
          className="transition-transform hover:scale-105 relative"
          aria-label="ChatConnect Home"
        >
          <BrandIcon className="w-12 h-12" size={48} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
        </Link>
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
          Connect
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col items-center gap-3 w-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname.startsWith("/chat"));
          const Icon = item.icon;

          return (
            <Tooltip key={item.href} content={item.label} position="right">
              <Link
                href={item.href}
                className={cn(
                  "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer",
                  isActive
                    ? "neo-inset text-[var(--primary)] font-bold"
                    : "neo-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:translate-y-[-2px]"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* Footer Controls: Theme Switch, Avatar, Logout */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Theme Toggle Button */}
        <Tooltip
          content={resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
          position="right"
        >
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-2xl neo-btn flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>
        </Tooltip>

        {/* User Avatar with Profile Link */}
        <Tooltip content={user?.full_name || "Account"} position="right">
          <Link href="/profile" className="cursor-pointer">
            <Avatar
              src={user?.avatar_url}
              name={user?.full_name || "User"}
              size="sm"
              status="online"
              className="ring-2 ring-[var(--primary)]/20 hover:scale-105 transition-transform"
            />
          </Link>
        </Tooltip>

        {/* Logout Button */}
        <Tooltip content="Sign Out" position="right">
          <button
            onClick={async () => {
              await logout();
              router.push("/auth/login");
            }}
            className="w-10 h-10 rounded-2xl text-[var(--danger)] hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
