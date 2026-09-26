"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/components/ui/Badge";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DeliverySummary {
  id: string;
  reviewToken: string;
  versionNumber: number;
  label: string | null;
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  createdAt: string;
}

interface VersionSwitcherProps {
  deliveries: DeliverySummary[];
  currentToken: string;
  slug?: string | null;
  preview?: boolean;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes",
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function VersionSwitcher({
  deliveries,
  currentToken,
  slug,
  preview = false,
}: VersionSwitcherProps) {
  if (deliveries.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-black/50 uppercase tracking-wider font-mono font-bold">
        Histórico de versões
      </p>
      <ul className="flex flex-col gap-1 list-none" role="list">
        {deliveries
          .slice()
          .sort((a, b) => b.versionNumber - a.versionNumber)
          .map((d) => {
            const isCurrent = d.reviewToken === currentToken;
            const href = slug
              ? `/${slug}/review/${d.reviewToken}${preview ? "?preview=1" : ""}`
              : `/review/${d.reviewToken}${preview ? "?preview=1" : ""}`;

            return (
              <li key={d.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2.5 text-sm border-2",
                    "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e10600]/60",
                    isCurrent
                      ? "bg-black border-black text-white pointer-events-none"
                      : "hover:bg-black/5 border-transparent text-black/60 hover:text-black",
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold shrink-0",
                        isCurrent ? "text-[#e10600]" : "text-black/40",
                      )}
                    >
                      v{d.versionNumber}
                    </span>
                    <span className="truncate text-xs">
                      {d.label ?? `Version ${d.versionNumber}`}
                    </span>
                  </div>
                  <Badge variant={statusVariant[d.status]} size="sm" dot>
                    {statusLabel[d.status]}
                  </Badge>
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

