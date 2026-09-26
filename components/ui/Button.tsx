"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getBrandTextColor } from "@/lib/freelancer-branding-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  brandColor?: string;
}

// ─── Variant & size maps ──────────────────────────────────────────────────────
// Approve Falcon system: black structure, white surfaces, red reserved for
// the primary action. Solid offset shadows instead of blur, hard borders
// instead of soft translucent ones, no gradients.

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "rounded-md bg-[#e10600] text-white border-2 border-black " +
    "shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] " +
    "hover:translate-x-[2px] hover:translate-y-[2px]",
  secondary:
    "rounded-md bg-white text-black border-2 border-black " +
    "shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] " +
    "hover:translate-x-[2px] hover:translate-y-[2px]",
  ghost: "rounded-md text-black/60 hover:text-black hover:bg-black/[0.05]",
  outline:
    "rounded-md border-2 border-black text-black bg-transparent " +
    "hover:bg-black/[0.04]",
  // Solid red — for a genuinely destructive action or an active/urgent state
  // (e.g. "recording…"), not just any red-tinted warning.
  danger:
    "rounded-md bg-[#e10600] text-white border-2 border-black " +
    "shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] " +
    "hover:translate-x-[2px] hover:translate-y-[2px]",
  success:
    "rounded-md bg-[#e10600] text-white border-2 border-black " +
    "shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] " +
    "hover:translate-x-[2px] hover:translate-y-[2px]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-xs gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

const spinnerSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 15,
  lg: 17,
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size }: { size: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      href,
      brandColor,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center font-extrabold uppercase tracking-wide",
      "transition-all duration-150 cursor-pointer select-none",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[#e10600]/60 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && "w-full",
      className,
    );

    const inner = (
      <>
        {loading ? (
          <Spinner size={spinnerSizes[size]} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    );

    // A freelancer's own brand color (Settings) takes over the accent while
    // keeping the system's black border/shadow structure intact.
    const styleOverride = brandColor
      ? variant === "primary" || variant === "danger" || variant === "success"
        ? {
            backgroundColor: brandColor,
            color: getBrandTextColor(brandColor),
          }
        : variant === "outline"
          ? { borderColor: brandColor, color: brandColor }
          : { color: brandColor }
      : undefined;

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          style={styleOverride as React.CSSProperties}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        style={styleOverride as React.CSSProperties}
        {...props}
      >
        {inner}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
