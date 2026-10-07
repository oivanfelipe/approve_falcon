"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getBrandTextColor,
  hexToRgba,
  DEFAULT_PRIMARY_COLOR,
} from "@/lib/freelancer-branding-shared";
import type { CommentData } from "@/features/review/components/CommentSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSelection {
  start: number; // character offset
  end: number;
  xStart: number; // start / text.length — normalized, matches image-pin xPosition
  yEnd: number; // end / text.length — normalized, matches image-pin yPosition
  clientX: number; // px, relative to container — for popup positioning
  clientY: number;
}

interface TextWithCommentsProps {
  text: string;
  comments: CommentData[];
  pinnedCommentNumbers: Record<string, number>;
  token: string;
  onCommentAdded: (comment: CommentData) => void;
  commentApiBase?: string;
  openPinCommentId?: string | null;
  onPinOpened?: () => void;
  onPinClick?: (commentId: string) => void;
  primaryColor?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Character offset of (node, offset) relative to all text inside `container`. */
function getTextOffset(container: Node, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) return total + offset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total;
}

// ─── Add comment popup ────────────────────────────────────────────────────────

function AddTextCommentPopup({
  selection,
  token,
  commentApiBase,
  onAdd,
  onCancel,
  primaryColor,
}: {
  selection: PendingSelection;
  token: string;
  commentApiBase: string;
  onAdd: (comment: CommentData) => void;
  onCancel: () => void;
  primaryColor?: string;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNameInput] = useState(() => {
    try {
      return !localStorage.getItem("review_author_name");
    } catch {
      return true;
    }
  });
  const [initialName] = useState(() => {
    try {
      return localStorage.getItem("review_author_name") ?? "";
    } catch {
      return "";
    }
  });
  const [name, setName] = useState(initialName);

  const submit = async () => {
    if (!content.trim()) {
      setError("Comment is required");
      return;
    }
    if (showNameInput && !name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch(`${commentApiBase}/${token}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.trim(),
        authorName: name.trim(),
        xPosition: selection.xStart,
        yPosition: selection.yEnd,
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data: CommentData = await res.json();
      try {
        if (name.trim())
          localStorage.setItem("review_author_name", name.trim());
      } catch {
        // ignore
      }
      onAdd(data);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post");
    }
  };

  return (
    <div
      className="absolute z-30 w-64 flex flex-col gap-3 bg-white border-2 border-black p-3 shadow-[6px_6px_0_0_#000]"
      style={{ left: selection.clientX, top: selection.clientY + 8 }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-bold uppercase text-black">
        Comentar neste trecho
      </p>
      <input
        className="w-full bg-white border-2 border-black px-3 py-1.5 text-sm text-black placeholder:text-black/35 outline-none"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus={showNameInput}
        style={{ display: showNameInput ? undefined : "none" }}
      />
      <textarea
        className="w-full bg-white border-2 border-black px-3 py-2 text-sm text-black placeholder:text-black/35 outline-none resize-none"
        placeholder="Escreva um comentário…"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus={!showNameInput}
      />
      {error && (
        <p className="text-[11px] font-medium text-[#e10600]">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 border-2 border-black text-xs font-bold uppercase text-black bg-white hover:bg-black/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 py-1.5 border-2 border-black text-xs font-bold uppercase disabled:opacity-50 transition-colors"
          style={{
            backgroundColor: primaryColor ?? DEFAULT_PRIMARY_COLOR,
            color: getBrandTextColor(primaryColor ?? DEFAULT_PRIMARY_COLOR),
          }}
        >
          {loading ? "Enviando…" : "Comentar"}
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TextWithComments({
  text,
  comments,
  pinnedCommentNumbers,
  token,
  onCommentAdded,
  commentApiBase = "/api/review",
  openPinCommentId,
  onPinOpened,
  onPinClick,
  primaryColor,
}: TextWithCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  const textPins = comments
    .filter((c) => c.xPosition !== null && c.yPosition !== null)
    .map((c) => ({
      id: c.id,
      start: Math.max(0, Math.min(text.length, Math.round((c.xPosition ?? 0) * text.length))),
      end: Math.max(0, Math.min(text.length, Math.round((c.yPosition ?? 0) * text.length))),
    }))
    .filter((p) => p.end > p.start);

  useEffect(() => {
    if (!openPinCommentId) return;
    const container = containerRef.current;
    if (!container) return;

    const el = container.querySelector(
      `[data-comment-id="${openPinCommentId}"]`,
    ) as HTMLElement | null;
    if (!el) {
      // no element found
      onPinOpened?.();
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the external scroll/highlight sync above, not derived state
    setActivePinId(openPinCommentId);
    // clear highlight after 3s and notify parent
    const t = setTimeout(() => {
      setActivePinId(null);
      onPinOpened?.();
    }, 3000);

    return () => clearTimeout(t);
  }, [openPinCommentId, onPinOpened]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;
    if (!container) return;

    if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
      setPending(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;

    const start = getTextOffset(container, range.startContainer, range.startOffset);
    const end = getTextOffset(container, range.endContainer, range.endOffset);
    if (end <= start) return;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPending({
      start,
      end,
      xStart: start / text.length,
      yEnd: end / text.length,
      clientX: Math.max(0, rect.left - containerRect.left),
      clientY: rect.bottom - containerRect.top,
    });
  }, [text.length]);

  const handleCommentAdded = (comment: CommentData) => {
    onCommentAdded(comment);
    setPending(null);
    window.getSelection()?.removeAllRanges();
  };

  // Build non-overlapping render segments from text + pin boundaries
  const breakpoints = Array.from(
    new Set<number>([0, text.length, ...textPins.flatMap((p) => [p.start, p.end])]),
  ).sort((a, b) => a - b);

  const segments: { start: number; end: number; pin?: (typeof textPins)[number] }[] = [];
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const segStart = breakpoints[i];
    const segEnd = breakpoints[i + 1];
    const coveringPin = textPins.find((p) => p.start <= segStart && p.end >= segEnd);
    segments.push({ start: segStart, end: segEnd, pin: coveringPin });
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="text-sm text-black leading-relaxed cursor-text select-text"
        style={{ whiteSpace: "pre-wrap" }}
      >
        {segments.map((seg, i) => {
          const chunk = text.slice(seg.start, seg.end);
          if (!seg.pin) return <React.Fragment key={i}>{chunk}</React.Fragment>;

          const isActive = activePinId === seg.pin.id;

          return (
            <span
              key={i}
              data-comment-id={seg.pin.id}
              title={
                typeof pinnedCommentNumbers[seg.pin.id] === "number"
                  ? `Ver comentário #${pinnedCommentNumbers[seg.pin.id]}`
                  : "Ver comentário"
              }
              onClick={(e) => {
                e.stopPropagation();
                onPinClick?.(seg.pin!.id);
              }}
              className={cn(
                "cursor-pointer rounded-sm border-b-2",
                isActive && "ring-2 ring-offset-1",
              )}
              style={{
                backgroundColor: hexToRgba(primaryColor ?? DEFAULT_PRIMARY_COLOR, 0.2),
                borderColor: primaryColor ?? DEFAULT_PRIMARY_COLOR,
              }}
            >
              {chunk}
            </span>
          );
        })}
      </div>

      {pending && (
        <AddTextCommentPopup
          selection={pending}
          token={token}
          commentApiBase={commentApiBase}
          onAdd={handleCommentAdded}
          onCancel={() => setPending(null)}
          primaryColor={primaryColor}
        />
      )}

      <p className="mt-3 text-[11px] text-black/40 select-none">
        Selecione um trecho do texto para comentar nele
      </p>
    </div>
  );
}
