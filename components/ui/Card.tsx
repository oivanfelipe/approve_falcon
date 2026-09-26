import React from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardVariant = "default" | "glass" | "elevated" | "outlined";
type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

// ─── Variant & padding maps ───────────────────────────────────────────────────

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border-2 border-black",
  glass: "bg-white border-2 border-black shadow-[6px_6px_0_0_#000]",
  elevated: "bg-white border-2 border-black shadow-[6px_6px_0_0_#000]",
  outlined: "bg-transparent border-2 border-black",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-extrabold text-black leading-snug",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-black/55 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center pt-4 mt-4 border-t-2 border-black/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        "transition-colors duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export { Card };
export type { CardProps, CardVariant, CardPadding };
