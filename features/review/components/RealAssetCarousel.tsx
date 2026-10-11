"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FilePreview from "@/features/review/components/FilePreview";
import DriveEmbed from "@/features/review/components/DriveEmbed";
import { cn } from "@/lib/utils";
import type { SignedDeliveryAsset } from "@/lib/delivery-assets";

// Carousel ("carrossel") posts can have more than one slide beyond the
// delivery's own primary file/link. Slide 0 keeps whatever rich preview the
// caller already renders for the primary creative (pin comments, zoom,
// etc.) — only slides 1+ get this simpler, comment-less preview.

function ExtraSlide({
  asset,
  allowDownload,
}: {
  asset: SignedDeliveryAsset;
  allowDownload: boolean;
}) {
  if (asset.sourceType === "DRIVE_LINK" && asset.driveUrl) {
    return (
      <DriveEmbed
        driveUrl={asset.driveUrl}
        fileName={asset.fileName ?? "Lâmina"}
        allowDownload={allowDownload}
      />
    );
  }

  if (!asset.signedUrl) {
    return (
      <p className="p-6 text-sm text-black/50 text-center">
        Não foi possível carregar esta lâmina.
      </p>
    );
  }

  if (asset.mimeType?.startsWith("image/")) {
    return (
      <img
        src={asset.signedUrl}
        alt={asset.fileName ?? "Lâmina"}
        className="w-full max-h-[70vh] border-2 border-black object-contain bg-white"
      />
    );
  }

  return (
    <FilePreview
      signedUrl={asset.signedUrl}
      mimeType={asset.mimeType ?? ""}
      fileName={asset.fileName ?? "Lâmina"}
      allowDownload={allowDownload}
    />
  );
}

export default function RealAssetCarousel({
  renderPrimary,
  extraAssets,
  allowDownload,
}: {
  renderPrimary: () => React.ReactNode;
  extraAssets: SignedDeliveryAsset[];
  allowDownload: boolean;
}) {
  const [index, setIndex] = useState(0);
  const total = extraAssets.length + 1;

  if (total <= 1) return <>{renderPrimary()}</>;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full">
        {index === 0 ? (
          renderPrimary()
        ) : (
          <ExtraSlide
            asset={extraAssets[index - 1]}
            allowDownload={allowDownload}
          />
        )}

        <button
          type="button"
          aria-label="Lâmina anterior"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 border border-black/10 shadow-sm disabled:opacity-0 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-black" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Próxima lâmina"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 border border-black/10 shadow-sm disabled:opacity-0 transition-opacity"
        >
          <ChevronRight className="w-4 h-4 text-black" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-black/50">
          {index + 1}/{total}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para lâmina ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === index ? "bg-black" : "bg-black/20",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
