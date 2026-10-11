"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  User,
} from "lucide-react";

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
// Modeled closely on Instagram's own post chrome (avatar + username row,
// square media, like/comment/share/save icons, carousel dots) so a marketer
// recognizes it instantly as "roughly what this post will look like" — not
// just formatted text. Only the slide text comes from the agency's script;
// everything else (avatar, username line, like/comment counts) is a neutral
// placeholder, since none of that exists yet.

export default function ArtCopyMockup({
  text,
  primaryColor = "#e10600",
  accountLabel,
  caption,
  avatarUrl,
}: {
  text: string;
  primaryColor?: string;
  accountLabel?: string | null;
  caption?: string | null;
  avatarUrl?: string | null;
}) {
  const slides = parseArtCopySlides(text);
  const [index, setIndex] = useState(0);

  if (slides.length === 0) return null;

  const current = slides[Math.min(index, slides.length - 1)];
  const hasMultiple = slides.length > 1;

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Header: avatar + username row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-2 border-black border-b-0 bg-white">
        <div className="w-8 h-8 rounded-full shrink-0 bg-black/5 border border-black/10 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={accountLabel ?? "Logo"}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-black/30" strokeWidth={1.75} />
          )}
        </div>
        {accountLabel ? (
          <span className="text-sm font-bold text-black truncate">
            {accountLabel}
          </span>
        ) : (
          <div className="h-2.5 w-28 bg-black/10 rounded-sm" />
        )}
        <MoreHorizontal className="w-4 h-4 text-black/40 ml-auto shrink-0" />
      </div>

      {/* Media */}
      <div className="relative aspect-square border-2 border-black bg-black flex items-center justify-center px-8 py-10 text-center overflow-hidden">
        <div className="flex flex-col gap-2 items-center">
          {current.label && (
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-1"
              style={{ color: primaryColor }}
            >
              {current.label}
            </span>
          )}
          <p className="text-xl font-extrabold text-white whitespace-pre-wrap leading-snug">
            {current.body}
          </p>
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              aria-label="Slide anterior"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-white/90 shadow-sm disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Próximo slide"
              onClick={() =>
                setIndex((i) => Math.min(slides.length - 1, i + 1))
              }
              disabled={index === slides.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-white/90 shadow-sm disabled:opacity-0 transition-opacity"
            >
              <ChevronRight className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </button>
            <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-white bg-black/50 rounded-full px-1.5 py-0.5">
              {index + 1}/{slides.length}
            </span>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor:
                      i === index ? "#ffffff" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action icons: like / comment / share — save */}
      <div className="flex items-center gap-3 px-3 pt-2.5 pb-1.5 border-2 border-black border-t-0 border-b-0 bg-white">
        <Heart className="w-[22px] h-[22px] text-black" strokeWidth={1.75} />
        <MessageCircle className="w-[22px] h-[22px] text-black" strokeWidth={1.75} />
        <Send className="w-[22px] h-[22px] text-black" strokeWidth={1.75} />
        <Bookmark className="w-[22px] h-[22px] text-black ml-auto" strokeWidth={1.75} />
      </div>

      {/* Likes placeholder + real caption */}
      <div className="flex flex-col gap-1.5 px-3 pb-3 border-2 border-black border-t-0 bg-white">
        <div className="h-2 w-20 bg-black/10 rounded-sm" />
        {caption ? (
          <p className="text-xs text-black leading-snug whitespace-pre-wrap">
            {accountLabel && (
              <span className="font-bold mr-1">{accountLabel}</span>
            )}
            {caption}
          </p>
        ) : (
          <div className="h-2 w-32 bg-black/10 rounded-sm" />
        )}
      </div>

      <p className="text-center text-[10px] font-mono text-black/30 mt-2">
        Prévia estrutural do roteiro — a arte final pode variar
      </p>
    </div>
  );
}
