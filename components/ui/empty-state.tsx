import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto",
        className
      )}
    >
      <div className="w-16 h-16 rounded-3xl neo-inset flex items-center justify-center text-[var(--primary)] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
