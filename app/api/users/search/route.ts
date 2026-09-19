import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Phone number parameter is required" },
        { status: 400 }
      );
    }

    const trimmed = phone.trim();
    const cleanDigits = trimmed.replace(/\D/g, "");
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const part1 = last10.length > 5 ? last10.slice(0, 5) : last10;
    const part2 = last10.length > 5 ? last10.slice(5) : "";
    const cleanUsername = trimmed.replace(/^@/, "").toLowerCase();

    const filters = [
      `phone_number.eq.${trimmed}`,
      `phone_number.eq.+91 ${part1} ${part2}`,
      `phone_number.eq.+91${last10}`,
      `phone_number.ilike.%${part1}%${part2}%`,
      `username.eq.${cleanUsername}`
    ];

    const supabase = createAdminClient();

    // Query real Supabase profiles table
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, phone_number, full_name, username, avatar_url, about, is_online, last_seen, created_at, updated_at")
      .or(filters.join(","))
      .maybeSingle();

    if (error) {
      console.error("Search profiles error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "User not found! This mobile number is not registered on ChatConnect." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    console.error("Search user error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal search error" },
      { status: 500 }
    );
  }
}
