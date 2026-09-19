import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    let body;
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { userId, isOnline } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    await supabase
      .from("profiles")
      .update({
        is_online: Boolean(isOnline),
        last_seen: now,
      })
      .eq("id", userId);

    return NextResponse.json({ success: true, is_online: Boolean(isOnline), last_seen: now });
  } catch (err: unknown) {
    console.error("Presence update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
