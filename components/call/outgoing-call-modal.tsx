"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { PhoneOff, Video, Phone } from "lucide-react";

interface OutgoingCallModalProps {
  isOpen: boolean;
  callee: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  callType: "video" | "audio";
  statusText: string;
  onCancel: () => void;
}

export function OutgoingCallModal({
  isOpen,
  callee,
  callType,
  statusText,
  onCancel,
}: OutgoingCallModalProps) {
  // Soft Dialing Ringback Tone
  React.useEffect(() => {
    if (!isOpen) return;

    let isPlaying = true;
    let audioCtx: AudioContext | null = null;
    let osc1: OscillatorNode | null = null;
    let osc2: OscillatorNode | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();

        const playDialTone = () => {
          if (!isPlaying || !audioCtx) return;

          try {
            osc1 = audioCtx.createOscillator();
            osc2 = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc1.type = "sine";
            osc2.type = "sine";
            osc1.frequency.value = 400;
            osc2.frequency.value = 450;

            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(audioCtx.destination);

            osc1.start();
            osc2.start();

            // Dial beep for 1.2s, rest for 2s
            setTimeout(() => {
              try {
                osc1?.stop();
                osc2?.stop();
              } catch {}
              if (isPlaying) {
                setTimeout(playDialTone, 2000);
              }
            }, 1200);
          } catch {}
        };

        playDialTone();
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

  if (!isOpen || !callee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#161c2b] border border-white/15 p-6 sm:p-8 text-center text-white shadow-2xl neo-raised flex flex-col items-center">
        {/* Pulsating Avatar */}
        <div className="relative mb-5 flex items-center justify-center">
          <span className="absolute w-28 h-28 rounded-full bg-[var(--primary)]/20 animate-ping" />
          <span className="absolute w-24 h-24 rounded-full bg-[var(--primary)]/30 animate-pulse" />
          <Avatar
            src={callee.avatar}
            name={callee.name}
            size="xl"
            className="w-20 h-20 ring-4 ring-[var(--primary)] shadow-xl relative z-10"
          />
        </div>

        {/* Callee Name & Status */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">
          {callee.name}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 font-medium flex items-center justify-center gap-1.5 mb-8">
          {callType === "video" ? (
            <Video className="w-4 h-4 text-[var(--primary)] animate-pulse" />
          ) : (
            <Phone className="w-4 h-4 text-[var(--primary)] animate-pulse" />
          )}
          <span>{statusText}</span>
        </p>

        {/* End Call / Cancel Button */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={onCancel}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Cancel Call"
            aria-label="Cancel Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <span className="text-xs text-rose-300 font-medium">End Call</span>
        </div>
      </div>
    </div>
  );
}
