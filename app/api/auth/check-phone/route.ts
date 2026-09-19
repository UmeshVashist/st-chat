import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const trimmed = phone.trim();
    const cleanDigits = trimmed.replace(/\D/g, "");
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const part1 = last10.length > 5 ? last10.slice(0, 5) : last10;
    const part2 = last10.length > 5 ? last10.slice(5) : "";

    const filters = [
      `phone_number.eq.${trimmed}`,
      `phone_number.eq.+91 ${part1} ${part2}`,
      `phone_number.eq.+91${last10}`,
      `phone_number.eq.${last10}`,
      `phone_number.ilike.%${part1}%${part2}%`,
    ];

    const supabase = createAdminClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, phone_number, full_name, username, avatar_url, is_online")
      .or(filters.join(","))
      .maybeSingle();

    if (error) {
      console.error("Check phone error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      exists: !!profile,
      profile: profile || null,
    });
  } catch (err: unknown) {
    console.error("Check phone exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
