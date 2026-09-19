import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, fullName, username, password, avatarUrl } = body;

    if (!phone || !fullName || !username || !password) {
      return NextResponse.json(
        { error: "Phone, full name, username, and password are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const cleanDigits = phone.replace(/\D/g, "");
    const cleanPhone = phone.trim();
    const cleanUsername = username.toLowerCase().trim();
    const virtualEmail = `${cleanDigits}@chatconnect.app`;

    // 1. Check if username is taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken. Please choose another." },
        { status: 400 }
      );
    }

    // 2. Check if phone is already registered in public.profiles
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const part1 = last10.length > 5 ? last10.slice(0, 5) : last10;
    const part2 = last10.length > 5 ? last10.slice(5) : "";

    const filters = [
      `phone_number.eq.${cleanPhone}`,
      `phone_number.eq.+91 ${part1} ${part2}`,
      `phone_number.eq.+91${last10}`,
      `phone_number.eq.${last10}`,
      `phone_number.ilike.%${part1}%${part2}%`,
    ];

    const { data: existingPhone } = await supabase
      .from("profiles")
      .select("id")
      .or(filters.join(","))
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { error: "Mobile number is already registered. Please sign in." },
        { status: 400 }
      );
    }

    // 3. Create or find user in Supabase Auth
    let userId: string;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: virtualEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: cleanUsername,
        phone_number: cleanPhone,
      },
    });

    if (authError) {
      const isDuplicate =
        authError.code === "email_exists" ||
        authError.message?.toLowerCase().includes("already");

      // If user exists in Auth but not in profiles, update password and proceed
      if (isDuplicate) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData.users.find((u) => u.email === virtualEmail);
        if (found) {
          userId = found.id;
          await supabase.auth.admin.updateUserById(userId, {
            password,
            user_metadata: {
              full_name: fullName,
              username: cleanUsername,
              phone_number: cleanPhone,
            },
          });
        } else {
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      userId = authData.user.id;
    }

    // 4. Insert into public.profiles in Supabase PostgreSQL
    const profileData = {
      id: userId,
      phone_number: cleanPhone,
      full_name: fullName.trim(),
      username: cleanUsername,
      avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanDigits)}`,
      about: "Hey there! I am using ChatConnect.",
      is_online: true,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error("Profile insert error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile, virtualEmail });
  } catch (err: unknown) {
    console.error("Registration route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal registration error" },
      { status: 500 }
    );
  }
}
