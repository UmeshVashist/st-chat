"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserSettings } from "@/lib/settings-service";

interface IncomingCallModalProps {
  isOpen: boolean;
  caller: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  callType: "video" | "audio";
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({
  isOpen,
  caller,
  callType,
  onAccept,
  onDecline,
}: IncomingCallModalProps) {
  // Web Audio Ringtone Generator (100% reliable, zero external mp3 dependency)
  React.useEffect(() => {
    if (!isOpen) return;

    // Check user setting
    const settings = getUserSettings();
    if (!settings.soundEnabled) return;

    let isPlaying = true;
    let audioCtx: AudioContext | null = null;
    let osc1: OscillatorNode | null = null;
    let osc2: OscillatorNode | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();

        const playTone = () => {
          if (!isPlaying || !audioCtx) return;

          try {
            osc1 = audioCtx.createOscillator();
            osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = "sine";
            osc2.type = "sine";
            osc1.frequency.value = 440; // 440Hz standard ring tone
            osc2.frequency.value = 480; // 480Hz

            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start();
            osc2.start();

            // Tone for 1.6 seconds, then rest for 2 seconds
            setTimeout(() => {
              try {
                osc1?.stop();
                osc2?.stop();
              } catch {}
              if (isPlaying) {
                setTimeout(playTone, 2000);
              }
            }, 1600);
          } catch {}
        };

        playTone();
      }
    } catch {}

    return () => {
      isPlaying = false;
      try {
        osc1?.stop();
        osc2?.stop();
        audioCtx?.close();
      } catch {}
    };
  }, [isOpen]);

  if (!isOpen || !caller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#161c2b] border border-white/15 p-6 sm:p-8 text-center text-white shadow-2xl neo-raised flex flex-col items-center">
        {/* Pulsating Ring Avatar */}
        <div className="relative mb-5 flex items-center justify-center">
          <span className="absolute w-28 h-28 rounded-full bg-emerald-500/25 animate-ping" />
          <span className="absolute w-24 h-24 rounded-full bg-emerald-500/35 animate-pulse" />
          <Avatar
            src={caller.avatar}
            name={caller.name}
            size="xl"
            className="w-20 h-20 ring-4 ring-emerald-500 shadow-xl relative z-10"
          />
        </div>

        {/* Caller Name & Info */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">
          {caller.name}
        </h3>
        <p className="text-xs sm:text-sm text-emerald-400 font-medium flex items-center justify-center gap-1.5 mb-6">
          {callType === "video" ? (
            <>
              <Video className="w-4 h-4 animate-bounce" />
              Incoming Video Call...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 animate-bounce" />
              Incoming Voice Call...
            </>
          )}
        </p>

        {/* Action Buttons: Accept & Decline */}
        <div className="flex items-center justify-center gap-8 w-full pt-2">
          {/* Decline Button (Red) */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onDecline}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Decline Call"
              aria-label="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs text-rose-300 font-medium">Decline</span>
          </div>

          {/* Accept Button (Green) */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce cursor-pointer"
              title="Accept Call"
              aria-label="Accept Call"
            >
              {callType === "video" ? (
                <Video className="w-6 h-6" />
              ) : (
                <Phone className="w-6 h-6" />
              )}
            </button>
            <span className="text-xs text-emerald-300 font-medium">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
