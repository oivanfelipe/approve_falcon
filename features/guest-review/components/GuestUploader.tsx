"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "application/pdf", "video/"];
const ACCEPT = "image/*,application/pdf,video/*";

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE) return "File too large. Maximum size is 20 MB.";
  if (!ALLOWED_PREFIXES.some((p) => file.type.startsWith(p))) {
    return "Unsupported file type. Upload an image, PDF, or video.";
  }
  return null;
}

type State = "idle" | "uploading" | "done" | "error";

interface Result {
  reviewUrl: string;
  fileName: string;
}

export default function GuestUploader() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setState("error");
      return;
    }

    setState("uploading");
    setError("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/guest/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed. Please try again.");
      }
      const data = await res.json();
      setResult({ reviewUrl: data.reviewUrl, fileName: file.name });
      setState("done");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed. Please try again.",
      );
      setState("error");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
  };

  const copyLink = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.reviewUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const copyWhatsApp = () => {
    if (!result) return;
    const msg = `Hey! Please review the design here:\n\n${result.reviewUrl}\n\nYou can approve or request changes directly on the page.`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    });
  };

  // ── Done state ────────────────────────────────────────────────────────────
  if (state === "done" && result) {
    return (
      <div className="flex flex-col gap-5 p-6 bg-white border-2 border-black shadow-hard-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-base font-extrabold uppercase text-black">
              Review link ready!
            </p>
            <p className="text-xs text-black/50 truncate max-w-[240px]">
              {result.fileName}
            </p>
          </div>
        </div>

        {/* URL box */}
        <div className="flex items-center gap-2 p-3 bg-white border-2 border-black">
          <span className="flex-1 text-xs text-black/70 truncate select-all">
            {result.reviewUrl}
          </span>
          <button
            onClick={copyLink}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-bold uppercase transition-all border-2 border-black",
              copiedLink
                ? "bg-black text-white"
                : "bg-[#e10600] hover:bg-black text-white",
            )}
          >
            {copiedLink ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Share */}
        <div className="flex gap-2">
          <button
            onClick={copyWhatsApp}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold uppercase transition-all border-2 border-black",
              copiedWa
                ? "bg-black text-white"
                : "bg-white text-black/70 hover:bg-black/5 hover:text-black",
            )}
          >
            {copiedWa ? "Copied!" : "Copy WhatsApp message"}
          </button>
        </div>

        <a
          href={result.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 text-sm font-bold uppercase text-center text-white bg-[#e10600] border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Open review page ↗
        </a>

        <hr className="border-black/10" />

        {/* Upsell */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase text-black">
              Save this project permanently
            </p>
            <p className="text-xs text-black/45 mt-1">
              Free guest links expire in 7 days. Create a free account to keep
              them and manage all your projects in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex-1 py-2 text-xs font-bold uppercase text-center text-white bg-[#e10600] border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Sign up free →
            </Link>
            <button
              onClick={() => {
                setState("idle");
                setResult(null);
              }}
              className="px-4 py-2 text-xs font-bold uppercase text-black/60 hover:text-black border-2 border-black bg-white hover:bg-black/5 transition-colors"
            >
              New upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Uploading state ───────────────────────────────────────────────────────
  if (state === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 bg-white border-2 border-black min-h-[240px]">
        <div className="w-10 h-10 rounded-full border-2 border-black/15 border-t-[#e10600] animate-spin" />
        <p className="text-sm text-black/60">Uploading your file…</p>
      </div>
    );
  }

  // ── Idle / Error state ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload file for review"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-10",
          "cursor-pointer transition-all duration-200 border-2 border-dashed select-none",
          isDragging
            ? "border-[#e10600] bg-[#e10600]/[0.04]"
            : state === "error"
              ? "border-[#e10600] bg-white"
              : "border-black/30 bg-white hover:border-black",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleChange}
        />

        <div
          className={cn(
            "w-14 h-14 flex items-center justify-center transition-colors",
            isDragging ? "bg-[#e10600]/10" : "bg-black/[0.05]",
          )}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isDragging ? "text-[#e10600]" : "text-black/40"}
            aria-hidden="true"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-black/70">
            {isDragging ? "Drop it!" : "Drop your file here"}
          </p>
          <p className="text-xs text-black/40 mt-0.5">
            or{" "}
            <span className="text-[#e10600] underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>

        <p className="text-[11px] text-black/40 font-mono uppercase">
          Images · PDFs · Videos · Max 20 MB
        </p>
      </div>

      {state === "error" && (
        <p className="text-xs font-medium text-[#e10600] px-1">{error}</p>
      )}
    </div>
  );
}
