"use client";

import React from "react";
import { parseDriveLink } from "@/lib/google-drive";
import { cn } from "@/lib/utils";

interface DriveEmbedProps {
  driveUrl: string;
  fileName: string;
  allowDownload: boolean;
}

function OpenInDriveLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase",
        "bg-white border-2 border-black text-black",
        "hover:bg-black/5 transition-colors",
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      Abrir no Google Drive
    </a>
  );
}

export default function DriveEmbed({
  driveUrl,
  fileName,
  allowDownload,
}: DriveEmbedProps) {
  const parsed = parseDriveLink(driveUrl);

  if (!parsed) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="text-sm text-black/60">
          Não foi possível carregar a prévia deste link do Google Drive.
        </p>
        <OpenInDriveLink url={driveUrl} />
      </div>
    );
  }

  const isFolder = parsed.type === "folder";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <iframe
        src={parsed.embedUrl}
        className={cn(
          "w-full border-2 border-black bg-white",
          isFolder ? "h-[70vh]" : "h-[70vh]",
        )}
        title={fileName}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
      <p className="text-[11px] text-black/45 text-center max-w-md">
        Criativo hospedado no Google Drive. Se a prévia não carregar,
        confirme que o link está compartilhado como &ldquo;Qualquer pessoa
        com o link pode visualizar&rdquo;.
      </p>
      {allowDownload && <OpenInDriveLink url={parsed.viewUrl} />}
    </div>
  );
}
