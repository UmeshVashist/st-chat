"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDuration, cn } from "@/lib/utils";
import { saveCallLog, updateCallDuration } from "@/lib/call-service";
import { createClient } from "@/lib/supabase/client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Maximize2,
} from "lucide-react";

interface CallRoomProps {
  roomId: string;
}

export function CallRoom({ roomId }: CallRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const callType = (searchParams.get("type") as "video" | "audio") || "video";
  const roomName = searchParams.get("name") || "Call";
  const avatarParam = searchParams.get("avatar") || "";
  const paramCallId = searchParams.get("callId");
  const role = searchParams.get("role") || "caller";

  const userId = user?.id || "guest";
  const [callId] = React.useState<string>(() => paramCallId || `call-${Date.now()}`);

  const [micMuted, setMicMuted] = React.useState(false);
  const [videoOff, setVideoOff] = React.useState(callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [mediaPermissionDenied, setMediaPermissionDenied] = React.useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false);
  const [swappedViews, setSwappedViews] = React.useState(false);

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null);

  const durationRef = React.useRef(0);
  durationRef.current = duration;

  // Record call log on mount
  React.useEffect(() => {
    saveCallLog(userId, {
      id: callId,
      name: roomName,
      avatar: avatarParam,
      type: callType,
      direction: role === "caller" ? "outgoing" : "incoming",
      duration: "00m 00s",
    });

    return () => {
      updateCallDuration(userId, callId, durationRef.current);
    };
  }, [userId, callId, roomName, avatarParam, callType, role]);

  // Call duration timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Get Local Camera & Audio Stream
  React.useEffect(() => {
    let active = true;

    const startLocalMedia = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: callType === "video" ? { facingMode: "user" } : false,
            audio: true,
          });

          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // If peer connection exists, add tracks
          if (peerConnectionRef.current) {
            stream.getTracks().forEach((track) => {
              peerConnectionRef.current?.addTrack(track, stream);
            });
          }
        }
      } catch (err) {
        console.warn("Media device access unavailable or denied:", err);
        setMediaPermissionDenied(true);
      }
    };

    startLocalMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [callType]);

  // Toggle Mic Audio Track
  React.useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micMuted;
      });
    }
  }, [micMuted]);

  // Toggle Video Camera Track
  React.useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoOff;
      });
    }
  }, [videoOff]);

  // 2. WebRTC P2P Connection via Supabase Realtime Signaling
  React.useEffect(() => {
    const channel = supabase.channel(`call-stream:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Attach local stream tracks to WebRTC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // On Remote Stream Received
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setHasRemoteVideo(true);
        }
      }
    };

    // On ICE Candidate Found
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate, from: userId },
        });
      }
    };

    // Signaling Listeners
    channel
      .on("broadcast", { event: "offer" }, async (payload) => {
        if (payload.payload?.from !== userId && payload.payload?.offer) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: "broadcast",
              event: "answer",
              payload: { answer, from: userId },
            });
          } catch (e) {
            console.warn("Error handling offer:", e);
          }
        }
      })
      .on("broadcast", { event: "answer" }, async (payload) => {
        if (payload.payload?.from !== userId && payload.payload?.answer) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.answer));
          } catch (e) {
            console.warn("Error handling answer:", e);
          }
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async (payload) => {
        if (payload.payload?.from !== userId && payload.payload?.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
          } catch {}
        }
      })
      .on("broadcast", { event: "end_call" }, () => {
        handleLeaveCall();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && role === "caller") {
          // Give local media a tiny moment to bind tracks, then create offer
          setTimeout(async () => {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: "broadcast",
                event: "offer",
                payload: { offer, from: userId },
              });
            } catch (e) {
              console.warn("Error creating offer:", e);
            }
          }, 800);
        }
      });

    return () => {
      try {
        channel.send({
          type: "broadcast",
          event: "end_call",
          payload: { from: userId },
        });
      } catch {}
      supabase.removeChannel(channel);
      pc.close();
      peerConnectionRef.current = null;
    };
  }, [roomId, userId, role, supabase]);

  const handleLeaveCall = () => {
    updateCallDuration(userId, callId, duration);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    router.push("/calls");
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const screenTrack = screenStream.getVideoTracks()[0];
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          if (peerConnectionRef.current) {
            const sender = peerConnectionRef.current
              .getSenders()
              .find((s) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(screenTrack);
          }
          screenTrack.onended = () => {
            setIsScreenSharing(false);
            if (localStreamRef.current && localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          };
          setIsScreenSharing(true);
        }
      } catch {
        setIsScreenSharing(false);
      }
    } else {
      setIsScreenSharing(false);
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0a0e17] text-white flex flex-col overflow-hidden select-none">
      {/* Top Floating Glass Header */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-[#161c2b]/80 backdrop-blur-md border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold">
            {callType === "video" ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold truncate max-w-[160px] sm:max-w-xs">{roomName}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{formatDuration(duration)}</span>
              <span>•</span>
              <span className="capitalize">{callType} Call</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End-to-End Encrypted</span>
            <span className="sm:hidden">Encrypted</span>
          </Badge>
        </div>
      </header>

      {/* Permission Warning */}
      {mediaPermissionDenied && (
        <div className="absolute top-20 left-4 right-4 z-40 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Camera or Microphone access was not granted by your browser. The call is running with avatar representation.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WHATSAPP VIDEO CALL FULLSCREEN VIEW (Remote Participant)               */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0e1422] to-[#070a12] flex items-center justify-center">
        {/* Remote Live Video Element */}
        <video
          ref={swappedViews ? localVideoRef : remoteVideoRef}
          autoPlay
          playsInline
          muted={swappedViews}
          className={cn(
            "w-full h-full object-cover",
            swappedViews && "-scale-x-100",
            (!hasRemoteVideo && !swappedViews) && "hidden"
          )}
        />

        {/* Remote Avatar Display (if camera off, video off, or voice call) */}
        {(!hasRemoteVideo || callType === "audio" || (videoOff && swappedViews)) && (
          <div className="flex flex-col items-center justify-center gap-4 text-center p-6 animate-fadeIn select-none">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-36 h-36 rounded-full bg-emerald-500/20 animate-ping" />
              <span className="absolute w-32 h-32 rounded-full bg-emerald-500/30 animate-pulse" />
              <Avatar
                src={swappedViews ? user?.avatar_url : (avatarParam || undefined)}
                name={swappedViews ? (user?.full_name || "You") : roomName}
                size="xl"
                className="w-24 h-24 ring-4 ring-emerald-500 shadow-2xl relative z-10"
              />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {swappedViews ? `${user?.full_name || "You"} (You)` : roomName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{formatDuration(duration)}</span>
              <span>•</span>
              <span className="capitalize">{callType === "video" ? "Video Calling..." : "Voice Call"}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. WHATSAPP PICTURE-IN-PICTURE (PiP) CORNER VIEW (Self / Local Camera)     */}
      {/* ========================================================================= */}
      {callType === "video" && (
        <div
          onClick={() => setSwappedViews(!swappedViews)}
          title="Click to swap fullscreen & corner view (WhatsApp PiP)"
          className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl shadow-2xl border-2 border-white/25 overflow-hidden z-30 bg-[#161c2b] cursor-pointer hover:scale-105 transition-all group select-none"
        >
          <video
            ref={swappedViews ? remoteVideoRef : localVideoRef}
            autoPlay
            playsInline
            muted={!swappedViews}
            className={cn(
              "w-full h-full object-cover",
              !swappedViews && "-scale-x-100",
              (videoOff && !swappedViews) && "hidden",
              (!hasRemoteVideo && swappedViews) && "hidden"
            )}
          />

          {/* If self camera is off */}
          {videoOff && !swappedViews && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#161c2b] p-2 text-center">
              <Avatar src={user?.avatar_url} name={user?.full_name || "You"} size="md" className="mb-1" />
              <span className="text-[10px] text-zinc-400">Camera Off</span>
            </div>
          )}

          {/* Corner badge overlay */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white flex items-center gap-1">
            <span>{swappedViews ? roomName : "You"}</span>
            {micMuted && !swappedViews && <MicOff className="w-3 h-3 text-rose-400" />}
          </div>

          {/* Hover Swap Hint */}
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <RefreshCw className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FLOATING NEOMORPHIC CALL CONTROLS DOCK                                  */}
      {/* ========================================================================= */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 sm:gap-4 p-3 rounded-full bg-[#1a2235]/90 backdrop-blur-lg border border-white/15 shadow-2xl">
        {/* Mic Toggle Button */}
        <button
          onClick={() => setMicMuted(!micMuted)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
            micMuted
              ? "bg-rose-500/25 text-rose-400 border border-rose-500/40"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-label={micMuted ? "Unmute Microphone" : "Mute Microphone"}
          title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle Button */}
        {callType === "video" && (
          <button
            onClick={() => setVideoOff(!videoOff)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
              videoOff
                ? "bg-rose-500/25 text-rose-400 border border-rose-500/40"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
            aria-label={videoOff ? "Turn on Camera" : "Turn off Camera"}
            title={videoOff ? "Turn on Camera" : "Turn off Camera"}
          >
            {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Swap View Button (for mobile/tablets) */}
        {callType === "video" && (
          <button
            onClick={() => setSwappedViews(!swappedViews)}
            className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Swap View"
            title="Swap Fullscreen & Corner Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        {/* Screen Share Button */}
        {callType === "video" && (
          <button
            onClick={handleToggleScreenShare}
            className={cn(
              "w-12 h-12 rounded-full hidden sm:flex items-center justify-center transition-all cursor-pointer",
              isScreenSharing
                ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/40"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
            aria-label="Share Screen"
            title="Share Screen"
          >
            <ScreenShare className="w-5 h-5" />
          </button>
        )}

        {/* End Call Button (Red) */}
        <button
          onClick={handleLeaveCall}
          className="w-14 h-12 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          aria-label="Leave Call"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
