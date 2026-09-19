"use client";

import * as React from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Moon,
  Sun,
  Laptop,
  Bell,
  Shield,
  Eye,
  Key,
  Camera,
  User,
  UploadCloud,
  Loader2,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { getUserSettings, saveUserSettings } from "@/lib/settings-service";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user, updateProfile, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [desktopNotifications, setDesktopNotifications] = React.useState(true);
  const [showReadReceipts, setShowReadReceipts] = React.useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = React.useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

  // Load saved preferences on mount or when user changes
  React.useEffect(() => {
    const s = getUserSettings(user?.id);
    setSoundEnabled(s.soundEnabled);
    setDesktopNotifications(s.desktopNotifications);
    setShowOnlineStatus(s.showOnlineStatus);
    setShowReadReceipts(s.showReadReceipts);
  }, [user?.id]);

  const handleToggleSound = (checked: boolean) => {
    setSoundEnabled(checked);
    saveUserSettings(user?.id, { soundEnabled: checked });
    toast.success(checked ? "Incoming call ringtone enabled" : "Incoming call ringtone muted");
  };

  const handleToggleDesktopNotifications = async (checked: boolean) => {
    setDesktopNotifications(checked);
    saveUserSettings(user?.id, { desktopNotifications: checked });
    if (checked && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
    toast.success(checked ? "Desktop notifications enabled" : "Desktop notifications disabled");
  };

  const handleToggleOnlineStatus = (checked: boolean) => {
    setShowOnlineStatus(checked);
    saveUserSettings(user?.id, { showOnlineStatus: checked });
    toast.success(checked ? "Online presence status visible" : "Online presence status hidden");
  };

  const handleToggleReadReceipts = (checked: boolean) => {
    setShowReadReceipts(checked);
    saveUserSettings(user?.id, { showReadReceipts: checked });
    toast.success(checked ? "Read receipts (ticks) enabled" : "Read receipts disabled");
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploadingPhoto(true);
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
        throw new Error(data.error || "Upload failed");
      }

      await updateProfile({ avatar_url: data.url });
      toast.success(
        data.storage === "cloudflare-r2"
          ? "Profile photo updated on Cloudflare R2!"
          : "Profile photo updated successfully!"
      );
    } catch (err: unknown) {
      console.error("Settings avatar upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // AV Test State
  const [testVideoActive, setTestVideoActive] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const toggleTestCamera = async () => {
    if (testVideoActive) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setTestVideoActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setTestVideoActive(true);
        toast.success("Webcam & Microphone connected!");
      } catch {
        toast.error("Could not access camera/microphone");
      }
    }
  };

  return (
    <DashboardShell>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Preferences & Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Customize appearance, audio/video devices, privacy, and API integrations
          </p>
        </div>

        {/* Section 0: My Profile & Avatar */}
        <Card variant="raised" className="p-6">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div
              className="relative cursor-pointer group"
              onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
              title="Click to change photo from PC / Mobile"
            >
              <Avatar
                src={user?.avatar_url || ""}
                name={user?.full_name || "User"}
                size="xl"
                className="ring-4 ring-[var(--bg-card)] shadow-lg"
              />
              {isUploadingPhoto ? (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full neo-btn-primary flex items-center justify-center text-white shadow hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {user?.full_name || "Your Profile"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {user?.phone_number || `@${user?.username || "user"}`}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Upload your original photo from local PC or mobile. Other users will see this photo across the app.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <Link href="/profile">
                  <Button size="sm" variant="ghost" className="text-xs">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    Edit Full Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 1: Appearance & Neomorphism Theme */}
        <Card variant="raised" className="p-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Sun className="w-4 h-4 text-[var(--primary)]" />
            Appearance & Theme
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Select your preferred Neomorphism color mode
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl transition-all cursor-pointer",
                theme === "light"
                  ? "neo-inset text-[var(--primary)] font-bold ring-1 ring-[var(--primary)]"
                  : "neo-btn text-[var(--text-secondary)]"
              )}
            >
              <Sun className="w-5 h-5 mb-2 text-amber-500" />
              <span className="text-xs">Light</span>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl transition-all cursor-pointer",
                theme === "dark"
                  ? "neo-inset text-[var(--primary)] font-bold ring-1 ring-[var(--primary)]"
                  : "neo-btn text-[var(--text-secondary)]"
              )}
            >
              <Moon className="w-5 h-5 mb-2 text-indigo-400" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl transition-all cursor-pointer",
                theme === "system"
                  ? "neo-inset text-[var(--primary)] font-bold ring-1 ring-[var(--primary)]"
                  : "neo-btn text-[var(--text-secondary)]"
              )}
            >
              <Laptop className="w-5 h-5 mb-2" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </Card>

        {/* Section 2: Audio & Video Device Test */}
        {/* <Card variant="raised" className="p-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--primary)]" />
            Camera & Microphone Diagnostic
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Test your WebRTC peripherals before jumping on LiveKit calls
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-64 h-40 rounded-2xl neo-inset bg-[var(--bg-card)] overflow-hidden flex items-center justify-center relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn("w-full h-full object-cover -scale-x-100", !testVideoActive && "hidden")}
              />
              {!testVideoActive && (
                <div className="text-center p-4 text-xs text-[var(--text-muted)]">
                  <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  Camera preview offline
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                variant={testVideoActive ? "danger" : "primary"}
                size="sm"
                onClick={toggleTestCamera}
              >
                {testVideoActive ? "Stop Camera Test" : "Test Camera & Mic"}
              </Button>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed max-w-xs">
                Checks whether your browser grants permissions for 1080p WebRTC calling.
              </p>
            </div>
          </div>
        </Card> */}

        {/* Section 3: Privacy & Notifications */}
        <Card variant="raised" className="p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--primary)]" />
            Privacy & Notifications
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl neo-inset-sm">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Incoming Call Ringtone
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Play audio chime on incoming voice and video calls
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => handleToggleSound(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl neo-inset-sm">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Desktop Notifications
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Show native OS push alerts when new messages arrive
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={desktopNotifications}
                onChange={(e) => handleToggleDesktopNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl neo-inset-sm">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Show Online Status
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Display green active presence indicator to contacts
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showOnlineStatus}
                onChange={(e) => handleToggleOnlineStatus(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl neo-inset-sm">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-[var(--text-secondary)]" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    Read Receipts (Blue Ticks)
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Allow contacts to see when you have viewed their messages
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={showReadReceipts}
                onChange={(e) => handleToggleReadReceipts(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Account & Session / Sign Out Section (Specially for Mobile & Desktop) */}
        <Card className="p-6 neo-card border border-rose-500/25 bg-gradient-to-br from-[var(--bg-card)] to-rose-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Account & Session
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage your active session or sign out on mobile and desktop
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl neo-inset-sm border border-rose-500/15 bg-[var(--bg-card)]">
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Sign Out of ChatConnect
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Logged in as <strong className="text-[var(--text-primary)]">{user?.full_name || user?.username || user?.phone_number || "User"}</strong>. Sign out to end your session.
              </p>
            </div>

            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                try {
                  setIsSigningOut(true);
                  await logout();
                  toast.success("Successfully logged out");
                  router.replace("/auth/login");
                } catch (err) {
                  console.error("Logout error:", err);
                  toast.error("Logged out");
                  router.replace("/auth/login");
                } finally {
                  setIsSigningOut(false);
                }
              }}
              disabled={isSigningOut}
              className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
