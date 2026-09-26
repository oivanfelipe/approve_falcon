"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
  resize?: "none" | "both" | "horizontal" | "vertical";
  brandColor?: string;
}

const resizeClasses = {
  none: "resize-none",
  both: "resize",
  horizontal: "resize-x",
  vertical: "resize-y",
};

// ─── Component ────────────────────────────────────────────────────────────────

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      fullWidth = false,
      resize = "vertical",
      className,
      id,
      required,
      rows = 4,
      brandColor,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? `textarea-${generatedId}`;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold text-black select-none"
          >
            {label}
            {required && (
              <span className="ml-1 text-[#e10600]" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          className={cn(
            "w-full bg-white border-2 text-black placeholder:text-black/35",
            "px-4 py-3 text-sm rounded-md",
            "transition-colors duration-150 outline-none",
            error
              ? "border-[#e10600] focus:ring-2 focus:ring-[#e10600]/25"
              : "border-black focus:ring-2 focus:ring-[#e10600]/25",
            resizeClasses[resize],
            className,
          )}
          style={brandColor ? { borderColor: brandColor } : undefined}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : hint
                ? `${textareaId}-hint`
                : undefined
          }
          aria-invalid={error ? "true" : undefined}
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-[#e10600] font-medium"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${textareaId}-hint`} className="text-xs text-black/45">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
