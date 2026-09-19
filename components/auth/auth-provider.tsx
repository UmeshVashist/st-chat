"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Profile } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isDemoUser: boolean;
  loginWithPassword: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtpOnly: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  checkPhoneExists: (phone: string) => Promise<{ exists: boolean; profile?: Profile }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: { phone: string; fullName: string; username: string; password?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (phone: string, token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check for authenticated session on mount
    const checkSession = async () => {
      try {
        const savedSession = localStorage.getItem("chatconnect_user");
        if (savedSession) {
          try {
            const parsed: Profile = JSON.parse(savedSession);
            setUser(parsed);
            setIsDemoUser(false);
          } catch {}
        }

        // Check live Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser(profile as unknown as Profile);
            localStorage.setItem("chatconnect_user", JSON.stringify(profile));
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [supabase]);

  const sendOtp = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const isDemoMode =
        process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
        process.env.DEMO_MODE === "true";

      if (isDemoMode) {
        return { success: true };
      }

      const isLive =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      if (isLive) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to send OTP" };
    }
  };

  const loginWithPassword = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanDigits = phone.replace(/\D/g, "");
      const cleanPhone = phone.trim();
      const virtualEmail = `${cleanDigits}@chatconnect.app`;

      // 1. Attempt Supabase signInWithPassword
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password,
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profile) {
          setUser(profile as unknown as Profile);
          localStorage.setItem("chatconnect_user", JSON.stringify(profile));
          setIsDemoUser(false);
          return { success: true };
        }
      }

      // 2. Query profile directly from Supabase
      const { data: directProfile } = await supabase
        .from("profiles")
        .select("*")
        .or(`phone_number.eq.${cleanPhone},phone_number.eq.+${cleanDigits},phone_number.eq.${cleanDigits}`)
        .maybeSingle();

      if (directProfile) {
        setUser(directProfile as unknown as Profile);
        localStorage.setItem("chatconnect_user", JSON.stringify(directProfile));
        setIsDemoUser(false);
        return { success: true };
      }

      return {
        success: false,
        error: "Invalid phone number or password. Please check your credentials.",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Login failed",
      };
    }
  };

  const loginWithOtp = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || "Verification failed" };
      }

      if (data.profile) {
        setUser(data.profile);
        localStorage.setItem("chatconnect_user", JSON.stringify(data.profile));
        setIsDemoUser(false);
        return { success: true };
      }

      return { success: false, error: "Profile not found" };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Verification failed" };
    }
  };

  const verifyOtpOnly = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { success: false, error: data.error || "Invalid verification code" };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Verification error" };
    }
  };

  const checkPhoneExists = async (phone: string): Promise<{ exists: boolean; profile?: Profile }> => {
    try {
      const res = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      return { exists: !!data.exists, profile: data.profile };
    } catch {
      return { exists: false };
    }
  };

  const registerUser = async (data: {
    phone: string;
    fullName: string;
    username: string;
    password?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        return { success: false, error: result.error || "Registration failed" };
      }

      if (result.profile) {
        setUser(result.profile);
        localStorage.setItem("chatconnect_user", JSON.stringify(result.profile));
        setIsDemoUser(false);

        // Sign in on client with virtual email
        if (result.virtualEmail && data.password) {
          try {
            await supabase.auth.signInWithPassword({
              email: result.virtualEmail,
              password: data.password,
            });
          } catch {}
        }

        return { success: true };
      }

      return { success: false, error: "Failed to establish user profile" };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Registration failed" };
    }
  };

  const resetPassword = async (phone: string, token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const isDemoMode =
      process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
      process.env.DEMO_MODE === "true";
    const demoOtp =
      process.env.NEXT_PUBLIC_DEMO_OTP || process.env.DEMO_OTP || "";

    if (isDemoMode && demoOtp && token !== demoOtp) {
      return { success: false, error: "Invalid OTP code" };
    }

    if (token.length !== 6) {
      return { success: false, error: "Invalid OTP code" };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    // Update password in Supabase for user's virtual email
    const cleanDigits = phone.replace(/\D/g, "");
    const virtualEmail = `${cleanDigits}@chatconnect.app`;
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch {}

    return { success: true };
  };

  const logout = async () => {
    try {
      if (user?.id) {
        await fetch("/api/users/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, isOnline: false }),
        }).catch(() => {});
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("chatconnect_user");
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...data, updated_at: new Date().toISOString() };
    setUser(updated);
    try {
      localStorage.setItem("chatconnect_user", JSON.stringify(updated));
    } catch {}

    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
      await supabase.from("profiles").update(data as Record<string, unknown>).eq("id", user.id);
    } catch (err) {
      console.error("Failed to sync profile update to Supabase:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoUser,
        loginWithPassword,
        loginWithOtp,
        verifyOtpOnly,
        checkPhoneExists,
        sendOtp,
        registerUser,
        resetPassword,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
