import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "info";

type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Renders a small colored dot on the left */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ─── Variant maps ─────────────────────────────────────────────────────────────
// Approve Falcon system: white/black/red only. Red is reserved for the one
// status that needs attention ("changes requested"); everything resolved or
// waiting stays neutral black/white.

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white text-black/70 border-black/30",
  brand: "bg-black text-white border-black",
  success: "bg-black text-white border-black",
  warning: "bg-white text-black/70 border-black/45",
  error: "bg-[#e10600] text-white border-black",
  info: "bg-white text-black/70 border-black/30",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-black/40",
  brand: "bg-white",
  success: "bg-white",
  warning: "bg-black/40",
  error: "bg-white",
  info: "bg-black/40",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] rounded-md",
  md: "px-2.5 py-1 text-xs rounded-md",
};

// ─── Component ────────────────────────────────────────────────────────────────

function Badge({
  variant = "default",
  size = "md",
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wide border-[1.5px]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotClasses[variant],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
