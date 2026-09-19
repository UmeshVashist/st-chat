import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
}

export function Avatar({
  src,
  alt = "",
  name = "User",
  size = "md",
  status,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    xs: "w-7 h-7 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base font-semibold",
    xl: "w-20 h-20 text-xl font-bold",
  };

  const statusSizeClasses = {
    xs: "w-2 h-2 border-[1.5px]",
    sm: "w-2.5 h-2.5 border-[2px]",
    md: "w-3 h-3 border-[2px]",
    lg: "w-3.5 h-3.5 border-[2px]",
    xl: "w-4 h-4 border-[2.5px]",
  };

  const statusColors = {
    online: "bg-[var(--success)]",
    offline: "bg-[var(--text-muted)]",
    busy: "bg-[var(--danger)]",
    away: "bg-[var(--warning)]",
  };

  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative inline-block select-none" {...props}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden neo-raised-sm bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-card-alt)] text-[var(--primary)] font-medium transition-transform",
          sizeClasses[size],
          className
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-[var(--bg-card)] shadow-sm",
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
