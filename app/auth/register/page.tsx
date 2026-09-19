"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IndiaPhoneInput } from "@/components/ui/india-phone-input";
import { BrandIcon } from "@/components/ui/brand-icon";
import { isValidIndiaMobile, toIndiaE164, formatIndiaDisplay } from "@/lib/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { sendOtp, checkPhoneExists } = useAuth();
  const { toast } = useToast();

  const [digits, setDigits] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [phoneError, setPhoneError] = React.useState<string | undefined>(undefined);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(undefined);

    if (!digits || digits.length !== 10) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    if (!isValidIndiaMobile(digits)) {
      setPhoneError("Indian mobile numbers must start with 6, 7, 8, or 9");
      return;
    }

    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service & Privacy Policy");
      return;
    }

    const formattedE164 = toIndiaE164(digits);
    setIsLoading(true);

    // Verify if phone is already registered
    const check = await checkPhoneExists(formattedE164);
    if (check.exists) {
      setIsLoading(false);
      setPhoneError("This mobile number is already registered. Please sign in.");
      toast.error("This mobile number is already registered. Please sign in.");
      return;
    }

    const result = await sendOtp(formattedE164);
    setIsLoading(false);

    if (result.success) {
      toast.success(`Verification OTP sent to ${formatIndiaDisplay(digits)}`);
      router.push(`/auth/verify-otp?phone=${encodeURIComponent(formattedE164)}&flow=register`);
    } else {
      toast.error(result.error || "Failed to send verification SMS.");
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
            Create your account
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Register using your Indian mobile number
          </p>
        </div>

        {/* Register Card */}
        <Card variant="raised" className="p-6 sm:p-8">
          <form onSubmit={handleRegister} autoComplete="off" className="space-y-4">
            <IndiaPhoneInput
              label="Indian Mobile Number"
              value={digits}
              onChange={(val) => {
                setDigits(val);
                setPhoneError(undefined);
              }}
              error={phoneError}
              autoFocus
              required
            />

            <div className="p-3.5 rounded-2xl neo-inset-sm text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                We will send an instant SMS containing a 6-digit OTP to verify your Indian mobile number.
              </p>
            </div>

            <div className="flex items-center gap-2 px-1 text-xs text-[var(--text-secondary)]">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
              />
              <label htmlFor="terms" className="cursor-pointer">
                I agree to the{" "}
                <span className="text-[var(--primary)] font-medium">Terms of Service</span> and{" "}
                <span className="text-[var(--primary)] font-medium">Privacy Policy</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Mobile Number
            </Button>
          </form>

          {/* Shortcut to skip to profile setting in demo */}
          <div className="mt-6 pt-6 border-t border-[var(--border-subtle)] text-center">
            <Link
              href={`/auth/set-password?phone=${encodeURIComponent("+91 98765 00000")}`}
              className="text-xs text-[var(--primary)] hover:underline font-semibold"
            >
              Already verified? Set profile & password →
            </Link>
          </div>
        </Card>

        {/* Footer Link to Login */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
