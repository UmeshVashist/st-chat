import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room");
    const username = searchParams.get("username") || "user-" + Math.random().toString(36).substring(2, 7);

    if (!room) {
      return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl || apiKey === "devkey" || wsUrl.includes("placeholder")) {
      // In development fallback mode when LiveKit cloud credentials have not been configured yet,
      // return a signed dev token or informational mock token
      return NextResponse.json({
        token: "mock-livekit-token-" + Math.random().toString(36).substring(2),
        wsUrl: wsUrl || "wss://placeholder.livekit.cloud",
        isMock: true,
        message: "Running in WebRTC Simulation Mode. Configure LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local for live LiveKit Cloud connection.",
      });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      wsUrl,
      isMock: false,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Failed to generate LiveKit token";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
