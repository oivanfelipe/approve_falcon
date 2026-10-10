"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from "lucide-react";

// ─── Parsing ──────────────────────────────────────────────────────────────────
// "Copy da arte" is a script written for a designer (capa, slide 2, slide 3…),
// not final copy — this never generates or alters that text, only lays out
// the blocks the agency already wrote so the client sees a rough shape of
// the post instead of an unbroken wall of text.

interface ArtCopySlide {
  label: string | null;
  body: string;
}

const MARKER_ONLY = /^(slide\s*\d*|capa|cena\s*\d*)\s*[:—-]*\s*$/i;
const MARKER_INLINE = /^(slide\s*\d*|capa|cena\s*\d*)\s*[:—-]\s*(.+)$/i;

export function parseArtCopySlides(text: string): ArtCopySlide[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split("\n");
    const firstLine = lines[0].trim();

    if (MARKER_ONLY.test(firstLine)) {
      return {
        label: firstLine.replace(/[:—-]+$/, "").trim(),
        body: lines.slice(1).join("\n").trim(),
      };
    }

    const inline = firstLine.match(MARKER_INLINE);
    if (inline) {
      const rest = [inline[2].trim(), lines.slice(1).join("\n").trim()]
        .filter(Boolean)
        .join("\n");
      return { label: inline[1].trim(), body: rest };
    }

    return { label: null, body: block };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
// Deliberately shaped like a real Instagram post (profile row, square frame,
// action icons, pagination dots) rather than a plain text card — a marketer
// recognizes this silhouette instantly, which is the point: give a rough
// sense of the finished post, not just formatted text.

export default function ArtCopyMockup({
  text,
  primaryColor = "#e10600",
  accountLabel,
}: {
  text: string;
  primaryColor?: string;
  accountLabel?: string | null;
}) {
  const slides = parseArtCopySlides(text);
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const current = slides[Math.min(index, slides.length - 1)];
  const hasMultiple = slides.length > 1;

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Profile row */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-2 border-black border-b-0 bg-white">
        <div
          className="w-7 h-7 rounded-full shrink-0 border border-black/10"
          style={{ backgroundColor: primaryColor }}
        />
        {accountLabel ? (
          <span className="text-xs font-bold text-black truncate">
            {accountLabel}
          </span>
        ) : (
          <div className="h-2 w-24 bg-black/10 rounded-sm" />
        )}
        <span className="ml-auto text-black/25 text-xs tracking-wider select-none">
          •••
        </span>
      </div>

      {/* Slide frame */}
      <div className="relative aspect-square border-2 border-black bg-black flex flex-col items-center justify-center gap-3 px-8 py-10 text-center overflow-hidden">
        {current.label && (
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]"
            style={{ color: primaryColor }}
          >
            {current.label}
          </span>
        )}
        <p className="text-xl font-extrabold text-white whitespace-pre-wrap leading-snug">
          {current.body}
        </p>

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white border-2 border-black disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() =>
                setIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={index === slides.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white border-2 border-black disabled:opacity-0 transition-opacity"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="absolute top-3 right-3 text-[10px] font-mono font-bold text-white/40">
              {index + 1}/{slides.length}
            </span>
          </>
        )}
      </div>

      {/* Action row + pagination */}
      <div className="flex flex-col gap-2 px-3 py-2.5 border-2 border-black border-t-0 bg-white">
        <div className="flex items-center gap-3 text-black/30">
          <Heart className="w-[18px] h-[18px]" />
          <MessageCircle className="w-[18px] h-[18px]" />
          <Send className="w-[18px] h-[18px]" />
          {hasMultiple && (
            <div className="ml-auto flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i === index ? primaryColor : "rgba(0,0,0,0.15)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] font-mono text-black/30 mt-2">
        Prévia estrutural do roteiro — a arte final pode variar
      </p>
    </div>
  );
}
