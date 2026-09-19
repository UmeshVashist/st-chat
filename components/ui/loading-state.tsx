import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center text-[var(--primary)] mb-3 animate-bounce">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
      <p className="text-xs font-medium text-[var(--text-secondary)]">
        {message}
      </p>
    </div>
  );
}
