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
import { KeyRound, Lock, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendOtp, resetPassword } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = React.useState<"phone" | "reset">("phone");
  const [digits, setDigits] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [phoneError, setPhoneError] = React.useState<string | undefined>(undefined);

  const handleSendResetCode = async (e: React.FormEvent) => {
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
    const res = await sendOtp(formattedE164);
    setIsLoading(false);

    if (res.success) {
      setStep("reset");
      toast.success(`Password reset code sent to ${formatIndiaDisplay(digits)}`);
    } else {
      toast.error(res.error || "Failed to send reset code");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const formattedE164 = toIndiaE164(digits);
    setIsLoading(true);
    const res = await resetPassword(formattedE164, otp, newPassword);
    setIsLoading(false);

    if (res.success) {
      toast.success("Password updated successfully! Please sign in.");
      router.push("/auth/login");
    } else {
      toast.error(res.error || "Failed to reset password");
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
            Reset your password
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Recover account access via your Indian mobile number
          </p>
        </div>

        {/* Form Card */}
        <Card variant="raised" className="p-6 sm:p-8">
          {step === "phone" ? (
            <form onSubmit={handleSendResetCode} autoComplete="off" className="space-y-4">
              <IndiaPhoneInput
                label="Registered Indian Mobile Number"
                value={digits}
                onChange={(val) => {
                  setDigits(val);
                  setPhoneError(undefined);
                }}
                error={phoneError}
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} autoComplete="off" className="space-y-4">
              <div className="p-3 rounded-2xl neo-inset-sm text-xs text-[var(--text-secondary)] flex items-center justify-between">
                <span>Code sent to {formatIndiaDisplay(digits)}</span>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-[var(--primary)] font-bold hover:underline ml-2"
                >
                  Change
                </button>
              </div>

              <Input
                label="6-Digit Reset Passcode"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                required
                autoFocus
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Update Password & Login
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center">
            <Link
              href="/auth/login"
              className="text-xs text-[var(--primary)] hover:underline font-semibold"
            >
              ← Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
