"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { IndiaPhoneInput } from "@/components/ui/india-phone-input";
import { BrandIcon } from "@/components/ui/brand-icon";
import { isValidIndiaMobile, toIndiaE164, formatIndiaDisplay } from "@/lib/utils";
import { Lock, KeyRound, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPassword, sendOtp, loginWithOtp, checkPhoneExists } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"password" | "otp">("password");
  const [digits, setDigits] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [phoneError, setPhoneError] = React.useState<string | undefined>(undefined);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(undefined);

    if (!digits || digits.length !== 10) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!isValidIndiaMobile(digits)) {
      setPhoneError("Indian numbers must start with 6, 7, 8, or 9");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    const formattedE164 = toIndiaE164(digits);
    setIsLoading(true);
    const result = await loginWithPassword(formattedE164, password);
    setIsLoading(false);

    if (result.success) {
      toast.success("Welcome back to ChatConnect!");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Failed to sign in. Check your credentials.");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(undefined);

    if (!digits || digits.length !== 10) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!isValidIndiaMobile(digits)) {
      setPhoneError("Indian numbers must start with 6, 7, 8, or 9");
      return;
    }

    const formattedE164 = toIndiaE164(digits);
    setIsLoading(true);

    // Verify if the mobile number is registered
    const check = await checkPhoneExists(formattedE164);
    if (!check.exists) {
      setIsLoading(false);
      setPhoneError("This mobile number is not registered. Please create an account.");
      toast.error("This mobile number is not registered. Please create an account first.");
      return;
    }

    const result = await sendOtp(formattedE164);
    setIsLoading(false);

    if (result.success) {
      setOtpSent(true);
      toast.success(`Verification OTP sent to ${formatIndiaDisplay(digits)}`);
    } else {
      toast.error(result.error || "Failed to send OTP.");
    }
  };

  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    const formattedE164 = toIndiaE164(digits);
    setIsLoading(true);
    const result = await loginWithOtp(formattedE164, otpCode);
    setIsLoading(false);

    if (result.success) {
      toast.success("OTP verified! Redirecting to dashboard...");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Invalid verification code.");
      if (result.error?.includes("not registered")) {
        setPhoneError(result.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-main)]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <BrandIcon className="w-12 h-12" size={48} />
            <span className="font-extrabold text-2xl tracking-tight text-[var(--text-primary)]">
              Chat<span className="text-[var(--primary)]">Connect</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Sign in to your account
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Connect in real-time with your Indian mobile number
          </p>
        </div>

        {/* Form Card */}
        <Card variant="raised" className="p-6 sm:p-8">
          {/* Tab Selector */}
          <div className="flex rounded-2xl neo-inset p-1.5 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("password");
                setOtpSent(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "password"
                  ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Mobile + Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("otp")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "otp"
                  ? "neo-raised bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Mobile + OTP
            </button>
          </div>

          {/* Tab 1: Password Login */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordLogin} autoComplete="off" className="space-y-4">
              <IndiaPhoneInput
                label="Indian Mobile Number"
                value={digits}
                onChange={(val) => {
                  setDigits(val);
                  setPhoneError(undefined);
                }}
                error={phoneError}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1 px-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-[var(--primary)] hover:underline font-medium"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In with Password
              </Button>
            </form>
          )}

          {/* Tab 2: OTP Login */}
          {activeTab === "otp" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} autoComplete="off" className="space-y-4">
                  <IndiaPhoneInput
                    label="Indian Mobile Number"
                    value={digits}
                    onChange={(val) => {
                      setDigits(val);
                      setPhoneError(undefined);
                    }}
                    error={phoneError}
                    required
                  />
                  <p className="text-[11px] text-[var(--text-muted)] px-1">
                    We will send a 6-digit OTP passcode to your Indian mobile phone.
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Send One-Time Code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpLogin} autoComplete="off" className="space-y-4">
                  <div className="p-3 rounded-2xl neo-inset-sm text-xs text-[var(--text-secondary)] flex items-center justify-between">
                    <span>Code sent to {formatIndiaDisplay(digits)}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[var(--primary)] font-bold hover:underline ml-2"
                    >
                      Change
                    </button>
                  </div>

                  <Input
                    label="6-Digit Passcode"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    autoFocus
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={isLoading}
                  >
                    Verify & Enter Dashboard
                  </Button>
                </form>
              )}
            </div>
          )}

        </Card>

        {/* Footer Link to Register */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
