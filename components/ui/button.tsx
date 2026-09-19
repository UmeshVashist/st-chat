import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "raised" | "inset" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "raised",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-9 px-3 text-xs rounded-xl gap-1.5",
      md: "h-11 px-5 text-sm rounded-2xl gap-2",
      lg: "h-13 px-7 text-base rounded-[20px] gap-2.5",
      icon: "h-10 w-10 p-0 rounded-2xl justify-center items-center",
    };

    const variantClasses = {
      primary: "neo-btn-primary font-medium text-white shadow-lg",
      secondary: "bg-[var(--primary-light)] text-[var(--primary)] font-medium neo-btn hover:brightness-105",
      raised: "neo-btn text-[var(--text-primary)] font-medium active:scale-95",
      inset: "neo-inset text-[var(--text-primary)] font-medium cursor-pointer",
      ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] rounded-2xl transition-colors",
      danger: "bg-[var(--danger)] text-white shadow-md hover:brightness-110 active:scale-95",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center select-none font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
