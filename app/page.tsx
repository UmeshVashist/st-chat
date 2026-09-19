"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import {
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Phone,
  Video,
  Play,
  Sun,
  Moon,
  CheckCircle2,
  Share2,
  Smartphone,
  Laptop,
  Monitor,
} from "lucide-react";

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--primary-light)] selection:text-[var(--primary)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-main)]/85 border-b border-[var(--border-subtle)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative transition-transform group-hover:scale-105">
              <BrandIcon className="w-12 h-12" size={48} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[var(--text-primary)]">
                ST<span className="text-[var(--primary)]">-Chat</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] -mt-1 hidden sm:block">
                Connect. Chat. Call.
              </p>
            </div>
          </Link>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl neo-btn flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            <Link href="/auth/login">
              <Button variant="raised" size="sm" className="hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>

            <Link href="/auth/register">
              <Button variant="raised" size="sm" className="hidden sm:inline-flex">
                Sign Up
              </Button>
            </Link>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neo-inset-sm text-xs font-semibold text-[var(--primary)] mb-6">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Next-Generation Realtime Communication</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-[var(--text-primary)] mb-6">
                Connect. Chat. Call. <br />
                <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
                  Anytime, Anywhere.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mb-8">
                Experience ultra-fast real-time messaging and crystal-clear WebRTC video and audio calls wrapped in a modern, tactile Neomorphic design. Seamlessly responsive across Mobile, Laptop, and PC.
              </p>

              {/* Trust badges */}
              <div className="mt-10 pt-8 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-6 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Mobile OTP & Password</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>LiveKit WebRTC Calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Supabase Realtime Sync</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Neomorphic Card Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md w-full">
                {/* Neomorphic Frame */}
                <div className="rounded-[32px] neo-floating p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-all transform hover:scale-[1.01]">
                  {/* Top Bar Preview */}
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
                        name="Sarah Jenkins"
                        size="md"
                        status="online"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">
                          Sarah Jenkins
                        </h4>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Active now • Video Ready
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl neo-btn flex items-center justify-center text-[var(--primary)]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="w-9 h-9 rounded-2xl neo-btn-primary flex items-center justify-center text-white">
                        <Video className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Simulated Chat Messages */}
                  <div className="space-y-4 mb-5">
                    <div className="flex items-start gap-2.5 max-w-[85%]">
                      <div className="p-3.5 rounded-2xl rounded-tl-sm neo-raised-sm bg-[var(--bg-card)] text-xs text-[var(--text-primary)] leading-relaxed">
                        Hey! Are we still jumping on the live video call to review the new designs? 🚀
                        <span className="block text-[10px] text-[var(--text-muted)] mt-1.5 text-right">
                          10:24 AM
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-end ml-auto max-w-[85%]">
                      <div className="p-3.5 rounded-2xl rounded-tr-sm bg-[var(--primary)] text-white text-xs leading-relaxed shadow-md">
                        Yes! Starting the room now. The audio latency is unreal!
                        <span className="block text-[10px] text-blue-200 mt-1.5 text-right">
                          10:25 AM • Read
                        </span>
                      </div>
                    </div>

                    {/* Calling Invite Pill */}
                    <div className="p-3 rounded-2xl neo-inset flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Video className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">
                            HD Video Room Started
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            LiveKit WebRTC • 1080p 60fps
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Live
                      </Badge>
                    </div>
                  </div>

                  {/* Simulated Inset Message Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-11 px-4 rounded-2xl neo-inset flex items-center text-xs text-[var(--text-muted)]">
                      Type your message...
                    </div>
                    <div className="w-11 h-11 rounded-2xl neo-btn-primary flex items-center justify-center text-white shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Floating Call Widget */}
                <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 p-3.5 rounded-2xl neo-floating bg-[var(--bg-card)] border border-[var(--border-subtle)] animate-bounce-subtle">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      One-Tap Calling
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      LiveKit WebRTC active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Platform Device Support Banner */}
      <section id="responsive" className="py-12 border-y border-[var(--border-subtle)] bg-[var(--bg-card)]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-4">
            Adaptive Viewports
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-8">
            Optimized for Mobile, Laptop & Desktop
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <Card variant="raised" className="p-5">
              <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-[var(--primary)] mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                Mobile Experience (320px - 640px)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Bottom navigation bar, touch gestures, full-width chat screens, and mobile floating call actions.
              </p>
            </Card>

            <Card variant="raised" className="p-5">
              <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-[var(--primary)] mb-3">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                Laptop View (768px - 1024px)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Clean split view with conversation list, message timeline, and responsive call floating grids.
              </p>
            </Card>

            <Card variant="raised" className="p-5">
              <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-[var(--primary)] mb-3">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                Desktop & PC (1280px+)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Full 3-column powerhouse with left navigation rail, central chat stream, and media details panel.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-main)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandIcon className="w-9 h-9" size={36} />
            <span className="font-bold text-base text-[var(--text-primary)]">
              ST-Chat
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} ST-Chat. All rights reserved. Built with Next.js, Supabase, LiveKit & Cloudflare R2.
          </p>

          <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
            <Link href="/auth/login" className="hover:text-[var(--primary)]">
              Login
            </Link>
            <Link href="/auth/register" className="hover:text-[var(--primary)]">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
