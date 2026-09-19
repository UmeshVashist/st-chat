import { NextRequest, NextResponse } from "next/server";

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

    // Validate against configured demo OTP or standard verification
    if (isDemoMode && demoOtp && otp === demoOtp) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification error" },
      { status: 500 }
    );
  }
}
