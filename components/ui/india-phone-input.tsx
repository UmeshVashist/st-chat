"use client";

import * as React from "react";
import { cn, extractIndiaTenDigits } from "@/lib/utils";

export interface IndiaPhoneInputProps {
  value: string;
  onChange: (tenDigits: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

export function IndiaPhoneInput({
  value,
  onChange,
  label = "Mobile Number",
  error,
  disabled = false,
  autoFocus = false,
  required = true,
  id,
  className,
}: IndiaPhoneInputProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  // Extract just the 10 digits for the input value
  const digits = extractIndiaTenDigits(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/\D/g, "").slice(0, 10);
    onChange(cleaned);
  };

  return (
    <div className={cn("w-full space-y-1.5 text-left", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide uppercase px-1"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center rounded-2xl neo-inset bg-[var(--bg-card)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
        {/* Fixed India Prefix Badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[var(--bg-card-alt)]/70 border-r border-[var(--border-subtle)] select-none shrink-0">
          <span className="text-base" role="img" aria-label="India flag">
            🇮🇳
          </span>
          <span className="text-xs font-bold text-[var(--text-primary)]">
            +91
          </span>
        </div>

        {/* 10 Digit Number Input */}
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={digits}
          onChange={handleChange}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          autoComplete="off"
          placeholder="98765 43210"
          className="w-full h-11 px-3 text-sm font-medium bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* 10 Digit Count Indicator */}
        <div className="pr-3.5 text-[10px] text-[var(--text-muted)] select-none shrink-0 font-mono">
          {digits.length}/10
        </div>
      </div>

      {error && (
        <p className="text-xs text-[var(--danger)] px-1 font-medium animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}
