"use client";

import React from "react";

// The caption/CTA text, once the real art already exists — same visual
// treatment the planning-stage mockup used for it (bold account name +
// plain text), without the rest of the mockup's fake slide chrome.
export default function PostCaption({
  caption,
  accountLabel,
}: {
  caption?: string | null;
  accountLabel?: string | null;
}) {
  if (!caption) return null;

  return (
    <div className="w-full max-w-md mx-auto border-2 border-black bg-white px-4 py-3">
      <p className="text-sm text-black leading-snug whitespace-pre-wrap">
        {accountLabel && <span className="font-bold mr-1">{accountLabel}</span>}
        {caption}
      </p>
    </div>
  );
}
