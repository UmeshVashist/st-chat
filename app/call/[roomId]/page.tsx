import * as React from "react";
import { CallRoom } from "@/components/call/call-room";

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function CallPage({ params }: PageProps) {
  const { roomId } = await params;

  return (
    <React.Suspense
      fallback={
        <div className="w-screen h-screen bg-[#0d1117] flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <CallRoom roomId={roomId} />
    </React.Suspense>
  );
}
