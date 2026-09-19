import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP code are required" },
        { status: 400 }
      );
    }

    const demoOtp = process.env.NEXT_PUBLIC_DEMO_OTP || process.env.DEMO_OTP || "";
    const isDemoMode =
      process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    const isMatch = isDemoMode && demoOtp && otp === demoOtp;

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const cleanDigits = phone.replace(/\D/g, "");
    const cleanPhone = phone.trim();
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const part1 = last10.length > 5 ? last10.slice(0, 5) : last10;
    const part2 = last10.length > 5 ? last10.slice(5) : "";
    const virtualEmail = `${cleanDigits}@chatconnect.app`;

    const filters = [
      `phone_number.eq.${cleanPhone}`,
      `phone_number.eq.+91 ${part1} ${part2}`,
      `phone_number.eq.+91${last10}`,
      `phone_number.eq.${last10}`,
      `phone_number.ilike.%${part1}%${part2}%`,
    ];

    // 1. Check if user profile already exists in Supabase
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .or(filters.join(","))
      .maybeSingle();

    // If number is NOT registered, reject login with clear message
    if (!existingProfile) {
      return NextResponse.json(
        { error: "This mobile number is not registered. Please create an account first." },
        { status: 404 }
      );
    }

    // 2. Update online status in database
    await supabase
      .from("profiles")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", existingProfile.id);

    return NextResponse.json({ success: true, profile: existingProfile, virtualEmail });
  } catch (err: unknown) {
    console.error("Login OTP error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal authentication error" },
      { status: 500 }
    );
  }
}
