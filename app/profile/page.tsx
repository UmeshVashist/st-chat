"use client";

import * as React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, User, AtSign, Phone, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { formatIndiaDisplay } from "@/lib/utils";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = React.useState(user?.full_name || "");
  const [username, setUsername] = React.useState(user?.username || "");
  const [about, setAbout] = React.useState(user?.about || "Hey there! I am using ChatConnect.");
  const [avatarUrl, setAvatarUrl] = React.useState(
    user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.username) setUsername(user.username);
      if (user.about) setAbout(user.about);
      if (user.avatar_url) setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setAvatarUrl(data.url);
      await updateProfile({ avatar_url: data.url });
      toast.success(
        data.storage === "cloudflare-r2"
          ? "Profile photo uploaded to Cloudflare R2 and saved!"
          : "Profile photo updated successfully!"
      );
    } catch (err: unknown) {
      console.error("Profile photo upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    setIsLoading(true);
    await updateProfile({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, "_"),
      about: about.trim(),
      avatar_url: avatarUrl,
    });
    setIsLoading(false);
    toast.success("Profile updated successfully!");
  };

  return (
    <DashboardShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage your personal details, avatar, and communication bio
          </p>
        </div>

        {/* Profile Card */}
        <Card variant="raised" className="p-6 sm:p-8">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[var(--border-subtle)] mb-6">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <div
              className="relative group cursor-pointer"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              title="Click to change photo from PC / Mobile"
            >
              <Avatar
                src={avatarUrl}
                name={fullName || "User"}
                size="xl"
                className="ring-4 ring-[var(--bg-card)] shadow-lg"
              />
              {isUploading ? (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full neo-btn-primary flex items-center justify-center text-white shadow hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {fullName || "Your Name"}
              </h3>
              <p className="text-xs text-[var(--primary)] font-medium">
                @{username || "username"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
                Upload your real photo from local PC or phone. Saved to Cloudflare R2 storage.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                    Upload from Device
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} autoComplete="off" className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<AtSign className="w-4 h-4" />}
              required
            />

            <Input
              label="Indian Mobile Number (Verified)"
              value={user?.phone_number ? formatIndiaDisplay(user.phone_number) : ""}
              disabled
              leftIcon={<Phone className="w-4 h-4" />}
              rightIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase px-1">
                Bio / Status
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={3}
                className="w-full p-3.5 text-xs sm:text-sm rounded-2xl bg-[var(--bg-card)] neo-inset text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="Share a status with your contacts..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto mt-4 px-8"
              isLoading={isLoading}
            >
              Save Profile Changes
            </Button>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}
