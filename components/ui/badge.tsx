import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "danger" | "warning" | "inset";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "bg-[var(--bg-card)] text-[var(--text-secondary)] neo-raised-sm border border-[var(--border-subtle)]",
    primary: "bg-[var(--primary)] text-white shadow-sm",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    inset: "neo-inset-sm text-[var(--text-secondary)] font-mono",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] rounded-full",
    md: "px-2.5 py-1 text-xs rounded-full font-medium",
  };

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center justify-center font-medium select-none transition-colors",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
