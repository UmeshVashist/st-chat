"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { MessageSquare, Sun, Moon, Sparkles, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Avatar } from "../ui/avatar";
import { ChatProvider } from "@/components/chat/chat-context";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, isLoading, isDemoUser, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-3">
          <BrandIcon className="w-12 h-12 animate-pulse" size={48} />
          <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ChatProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      {/* Desktop / Laptop Left Sidebar */}
      <SidebarNav />

      {/* Main Layout Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/70 backdrop-blur-md z-30 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrandIcon className="w-9 h-9" size={36} />
            <div>
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                Chat<span className="text-[var(--primary)]">Connect</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl neo-btn flex items-center justify-center text-[var(--text-secondary)]"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            <Link href="/profile">
              <Avatar
                src={user?.avatar_url}
                name={user?.full_name || "User"}
                size="sm"
                status="online"
              />
            </Link>

            <button
              onClick={async () => {
                await logout();
                router.replace("/auth/login");
              }}
              className="w-9 h-9 rounded-xl neo-btn flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Demo banner if running with demo session */}
        {isDemoUser && (
          <div className="hidden sm:flex items-center justify-between px-4 py-1.5 bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-indigo-500/10 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>
                <strong>Interactive Mode:</strong> Testing as{" "}
                <span className="text-[var(--primary)] font-semibold">{user?.full_name}</span>. Add your Supabase & LiveKit keys to .env.local for production data.
              </span>
            </div>
            <Link
              href="/settings"
              className="text-[var(--primary)] hover:underline font-medium text-[11px]"
            >
              Configure API Keys →
            </Link>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 flex overflow-hidden pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  </ChatProvider>
);
}
