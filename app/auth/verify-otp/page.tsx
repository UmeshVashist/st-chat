"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ArrowRight, RotateCw } from "lucide-react";
import { formatIndiaDisplay } from "@/lib/utils";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithOtp, verifyOtpOnly, sendOtp } = useAuth();
  const { toast } = useToast();

  const phone = searchParams.get("phone") || "";
  const flow = searchParams.get("flow") || "login";

  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = React.useState(60);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle pasting a 6 digit code
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < cleaned.length; i++) {
          newDigits[i] = cleaned[i];
        }
        setDigits(newDigits);
        const nextIdx = Math.min(cleaned.length, 5);
        inputRefs.current[nextIdx]?.focus();
        return;
      }
    }

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Focus next input if entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    const res = await sendOtp(phone);
    setIsLoading(false);
    if (res.success) {
      setCountdown(60);
      toast.success("New verification code sent!");
    } else {
      toast.error(res.error || "Could not resend code.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    if (flow === "register") {
      const result = await verifyOtpOnly(phone, code);
      setIsLoading(false);
      if (result.success) {
        toast.success("Phone verified successfully!");
        router.push(`/auth/set-password?phone=${encodeURIComponent(phone)}`);
      } else {
        toast.error(result.error || "Verification failed. Check your code.");
      }
      return;
    }

    const result = await loginWithOtp(phone, code);
    setIsLoading(false);

    if (result.success) {
      toast.success("Phone verified! Redirecting to dashboard...");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Verification failed. Check your code.");
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
            Verify your phone number
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-[var(--text-primary)] font-mono">
              {formatIndiaDisplay(phone)}
            </span>
          </p>
        </div>

        {/* Verification Card */}
        <Card variant="raised" className="p-6 sm:p-8">
          <form onSubmit={handleVerify} autoComplete="off" className="space-y-6">
            {/* 6 Digit Input Boxes */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoComplete="off"
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl bg-[var(--bg-card)] neo-inset text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <p className="text-center text-xs text-[var(--text-muted)]">
              Please enter the 6-digit SMS verification code.
            </p>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Confirm & Continue
            </Button>
          </form>

          {/* Resend Timer */}
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">
              Didn&apos;t receive a code?
            </span>
            {countdown > 0 ? (
              <span className="text-[var(--text-muted)] font-mono">
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-[var(--primary)] font-bold hover:underline flex items-center gap-1"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Resend SMS
              </button>
            )}
          </div>
        </Card>

        {/* Back Link */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Wrong number?{" "}
          <Link
            href="/auth/register"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            Change phone number
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyOtpContent />
    </React.Suspense>
  );
}
