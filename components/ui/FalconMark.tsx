import React from "react";

/**
 * The Approve Falcon mark: a squared-off checkmark with a bladed tip —
 * "approve" (the check) and "falcon" (the angled dive) in one geometric
 * shape. Single flat stroke via currentColor, no gradient, no soft caps.
 */
export default function FalconMark({
  className,
  size = 20,
  style,
}: {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M18 54 L41 77 L84 21"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
