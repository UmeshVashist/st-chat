import React from "react";

export const APP_ICON_URL =
  "https://jxechgirxrbrblyrrqmt.supabase.co/storage/v1/object/public/images/bb5b5ced-6b47-425c-aad2-065017342a96/1768990817789-ChatApp.png";

interface BrandIconProps {
  className?: string;
  size?: number;
  alt?: string;
}

export function BrandIcon({
  className = "w-12 h-12",
  size = 48,
  alt = "ChatConnect",
}: BrandIconProps) {
  return (
    <div
      className={`rounded-2xl neo-inset flex items-center justify-center p-1 overflow-hidden shrink-0 ${className}`}
    >
      <img
        src={APP_ICON_URL}
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-xl"
      />
    </div>
  );
}
