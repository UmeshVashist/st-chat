"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { BrandIcon } from "@/components/ui/brand-icon";
import { User, AtSign, Lock, ArrowRight, Camera } from "lucide-react";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser } = useAuth();
  const { toast } = useToast();

  const phone = searchParams.get("phone") || "+1 555 019 2834";

  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!username.trim()) {
      toast.error("Please choose a username");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const result = await registerUser({
      phone,
      fullName,
      username: username.toLowerCase().replace(/\s+/g, "_"),
      password,
      avatarUrl,
    });
    setIsLoading(false);

    if (result.success) {
      toast.success("Profile created! Welcome to ChatConnect.");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Failed to set profile");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-main)]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <BrandIcon className="w-12 h-12" size={48} />
            <span className="font-extrabold text-2xl tracking-tight text-[var(--text-primary)]">
              Chat<span className="text-[var(--primary)]">Connect</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Complete your profile
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Setup your identity and secure password
          </p>
        </div>

        {/* Profile Card */}
        <Card variant="raised" className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            {/* Avatar Selector */}
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="relative group">
                <Avatar
                  src={avatarUrl}
                  name={fullName || "User"}
                  size="xl"
                  className="ring-4 ring-[var(--bg-card)] shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    // Quick avatar toggle sample
                    const avatars = [
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                    ];
                    const next = avatars[(avatars.indexOf(avatarUrl) + 1) % avatars.length];
                    setAvatarUrl(next);
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full neo-btn-primary flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2">
                Click camera to cycle avatar preview
              </p>
            </div>

            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Username"
              type="text"
              placeholder="e.g. rahul_sharma"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<AtSign className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Finish Setup & Launch App
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SetPasswordContent />
    </React.Suspense>
  );
}
