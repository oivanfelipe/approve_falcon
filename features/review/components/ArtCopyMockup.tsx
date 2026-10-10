"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function ArtCopyMockup({
  text,
  primaryColor = "#e10600",
}: {
  text: string;
  primaryColor?: string;
}) {
  const slides = parseArtCopySlides(text);
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const current = slides[Math.min(index, slides.length - 1)];
  const hasMultiple = slides.length > 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full max-w-xs mx-auto border-2 border-black bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6 text-center overflow-y-auto">
          <div className="flex flex-col gap-2 items-center">
            {current.label && (
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border"
                style={{ color: primaryColor, borderColor: primaryColor }}
              >
                {current.label}
              </span>
            )}
            <p className="text-sm font-semibold text-black whitespace-pre-wrap leading-snug">
              {current.body}
            </p>
          </div>
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white border-2 border-black disabled:opacity-20"
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
              className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white border-2 border-black disabled:opacity-20"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex items-center justify-center gap-1.5">
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

      <p className="text-center text-[10px] font-mono text-black/30">
        Prévia estrutural do roteiro — a arte final pode variar
      </p>
    </div>
  );
}
