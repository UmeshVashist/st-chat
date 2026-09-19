"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDuration, cn } from "@/lib/utils";
import { saveCallLog, updateCallDuration } from "@/lib/call-service";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface CallRoomProps {
  roomId: string;
}

export function CallRoom({ roomId }: CallRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const callType = (searchParams.get("type") as "video" | "audio") || "video";
  const roomName = searchParams.get("name") || "Call Room";
  const avatarParam = searchParams.get("avatar") || "";
  const paramCallId = searchParams.get("callId");

  const userId = user?.id || "guest";
  const [callId] = React.useState<string>(() => paramCallId || `call-${Date.now()}`);

  const [micMuted, setMicMuted] = React.useState(false);
  const [videoOff, setVideoOff] = React.useState(callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [activeSpeaker, setActiveSpeaker] = React.useState<string>("remote-1");
  const [duration, setDuration] = React.useState(0);
  const [mediaPermissionDenied, setMediaPermissionDenied] = React.useState(false);
  const [tokenInfo, setTokenInfo] = React.useState<{ token: string; isMock: boolean } | null>(null);

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const durationRef = React.useRef(0);
  durationRef.current = duration;

  // Record outgoing call in call logs on mount
  React.useEffect(() => {
    saveCallLog(userId, {
      id: callId,
      name: roomName,
      avatar: avatarParam,
      type: callType,
      direction: "outgoing",
      duration: "00m 00s",
    });

    return () => {
      updateCallDuration(userId, callId, durationRef.current);
    };
  }, [userId, callId, roomName, avatarParam, callType]);

  // Call duration counter
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch token from server API route
  React.useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(roomId)}&username=${encodeURIComponent(
            user?.username || "user"
          )}`
        );
        const data = await res.json();
        setTokenInfo(data);
      } catch (err) {
        console.error("Token fetch error:", err);
      }
    };
    fetchToken();
  }, [roomId, user]);

  // Request actual local webcam & audio stream if available
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    const startMedia = async () => {
      if (videoOff && micMuted) return;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: !videoOff,
            audio: !micMuted,
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Media device access unavailable or denied:", err);
        setMediaPermissionDenied(true);
      }
    };

    startMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoOff, micMuted]);

  // Cycle active speaker periodically for realistic conference simulation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpeaker((prev) => (prev === "remote-1" ? "local" : "remote-1"));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLeaveCall = () => {
    updateCallDuration(userId, callId, duration);
    router.push("/calls");
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          await navigator.mediaDevices.getDisplayMedia({ video: true });
          setIsScreenSharing(true);
        } else {
          setIsScreenSharing(true);
        }
      } catch {
        setIsScreenSharing(false);
      }
    } else {
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0d1117] text-white flex flex-col overflow-hidden select-none">
      {/* Top Floating Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-[#161c2b]/80 backdrop-blur-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold truncate">{roomName}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{formatDuration(duration)}</span>
              <span>•</span>
              <span className="capitalize">{callType} Call</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tokenInfo?.isMock && (
            <Badge variant="warning" size="sm" className="hidden sm:inline-flex">
              LiveKit Dev Mode
            </Badge>
          )}
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted</span>
          </Badge>
        </div>
      </header>

      {/* Permission Denied Warning Banner */}
      {mediaPermissionDenied && (
        <div className="absolute top-20 left-4 right-4 z-20 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Camera or Microphone access was not granted by your browser. The call will continue with avatar representation.
          </span>
        </div>
      )}

      {/* Video Stream Stage / Participant Grid */}
      <div className="flex-1 p-4 pt-20 sm:pt-24 pb-28 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
          {/* Remote Participant 1 */}
          <div
            className={cn(
              "relative w-full h-full min-h-[240px] rounded-3xl overflow-hidden bg-[#161c2b] border transition-all duration-300 flex items-center justify-center",
              activeSpeaker === "remote-1"
                ? "border-[var(--primary)] ring-4 ring-[var(--primary)]/30"
                : "border-white/10"
            )}
          >
            {/* Remote Video Feed or Avatar */}
            {callType === "video" && avatarParam ? (
              <img
                src={avatarParam}
                alt={`${roomName} Video`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Avatar
                  src={avatarParam || undefined}
                  name={roomName}
                  size="xl"
                  className={cn(activeSpeaker === "remote-1" && "ring-4 ring-emerald-400 animate-pulse")}
                />
                <h3 className="font-bold text-sm">{roomName}</h3>
              </div>
            )}

            {/* Remote Label Overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
              <span>{roomName}</span>
              {activeSpeaker === "remote-1" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
          </div>

          {/* Local Participant (Self) */}
          <div
            className={cn(
              "relative w-full h-full min-h-[240px] rounded-3xl overflow-hidden bg-[#161c2b] border transition-all duration-300 flex items-center justify-center",
              activeSpeaker === "local"
                ? "border-[var(--primary)] ring-4 ring-[var(--primary)]/30"
                : "border-white/10"
            )}
          >
            {/* Real local video element if active */}
            {!videoOff && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Fallback avatar if camera is off or denied */}
            {videoOff && (
              <div className="flex flex-col items-center gap-3">
                <Avatar
                  src={user?.avatar_url}
                  name={user?.full_name || "You"}
                  size="xl"
                  className={cn(activeSpeaker === "local" && "ring-4 ring-[var(--primary)] animate-pulse")}
                />
                <h3 className="font-bold text-sm">{user?.full_name || "You"} (You)</h3>
                <span className="text-xs text-zinc-400">Camera is off</span>
              </div>
            )}

            {/* Local Label Overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
              <span>{user?.full_name || "You"} (You)</span>
              {micMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Neomorphic Call Controls Dock */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4 p-3 rounded-full bg-[#1a2235]/90 backdrop-blur-lg border border-white/10 shadow-2xl">
        {/* Mic Button */}
        <button
          onClick={() => setMicMuted(!micMuted)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
            micMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-label={micMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Button */}
        <button
          onClick={() => setVideoOff(!videoOff)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
            videoOff
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-label={videoOff ? "Turn on Camera" : "Turn off Camera"}
        >
          {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share Button */}
        <button
          onClick={handleToggleScreenShare}
          className={cn(
            "w-12 h-12 rounded-full hidden sm:flex items-center justify-center transition-all cursor-pointer",
            isScreenSharing
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-label="Share Screen"
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={handleLeaveCall}
          className="w-14 h-12 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          aria-label="Leave Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
