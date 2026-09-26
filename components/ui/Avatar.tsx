import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizeClass = sizes[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn(
          "border-2 border-black object-cover flex-shrink-0",
          sizeClass,
          className,
        )}
      />
    );
  }

  const displayName = name ?? "?";

  return (
    <div
      aria-label={displayName}
      className={cn(
        "flex-shrink-0 flex items-center justify-center font-extrabold text-white bg-black",
        sizeClass,
        className,
      )}
    >
      {getInitials(displayName)}
    </div>
  );
}
