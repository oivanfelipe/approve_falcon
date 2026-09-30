"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { getPublicReviewPath } from "@/lib/freelancer-branding-shared";
import {
  WEEKDAYS,
  monthLabel,
  dayKey,
  buildMonthGrid,
  toDateInputValue,
} from "@/features/calendar/lib/monthGrid";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

interface CalendarDeliveryRow {
  id: string;
  versionNumber: number;
  label: string | null;
  scheduledAt: Date | null;
  status: Status;
  reviewToken: string;
}

interface DashboardCalendarViewProps {
  deliveries: CalendarDeliveryRow[];
  freelancerSlug?: string | null;
  onEmptyDayClick: (dateInputValue: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant: Record<Status, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

const statusLabel: Record<Status, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

const statusDot: Record<Status, string> = {
  PENDING: "bg-[#f5a623]",
  APPROVED: "bg-black",
  CHANGES_REQUESTED: "bg-[#e10600]",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardCalendarView({
  deliveries,
  freelancerSlug,
  onEmptyDayClick,
}: DashboardCalendarViewProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDelivery, setSelectedDelivery] = useState<CalendarDeliveryRow | null>(
    null,
  );

  const deliveriesByDay = useMemo(() => {
    const map = new Map<string, CalendarDeliveryRow>();
    for (const d of deliveries) {
      if (!d.scheduledAt) continue;
      map.set(dayKey(new Date(d.scheduledAt)), d);
    }
    return map;
  }, [deliveries]);

  const grid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() =>
            setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
          }
          className="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black hover:bg-black/5 transition-colors"
        >
          ‹ Prev
        </button>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-black">
          {monthLabel(monthDate)}
        </h2>
        <button
          onClick={() =>
            setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
          }
          className="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black hover:bg-black/5 transition-colors"
        >
          Next ›
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-t-2 border-l-2 border-black">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="border-r-2 border-b-2 border-black bg-black text-white text-center text-[10px] sm:text-xs font-bold uppercase py-2"
          >
            {w}
          </div>
        ))}

        {grid.map((date) => {
          const inMonth = date.getMonth() === monthDate.getMonth();
          const delivery = deliveriesByDay.get(dayKey(date));

          return (
            <button
              key={date.toISOString()}
              onClick={() =>
                delivery
                  ? setSelectedDelivery(delivery)
                  : onEmptyDayClick(toDateInputValue(date))
              }
              className={cn(
                "border-r-2 border-b-2 border-black min-h-16 sm:min-h-24 flex flex-col items-start p-2 text-left transition-colors",
                !inMonth && "bg-black/5",
                delivery ? "hover:bg-[#e10600]/5" : "hover:bg-black/5",
              )}
            >
              <span
                className={cn(
                  "text-xs font-bold",
                  inMonth ? "text-black" : "text-black/30",
                )}
              >
                {date.getDate()}
              </span>
              {delivery && (
                <div className="mt-auto flex flex-col gap-1 w-full">
                  <span className={cn("w-2 h-2 rounded-full", statusDot[delivery.status])} />
                  <span className="hidden sm:block text-[10px] font-semibold text-black/70 truncate">
                    {delivery.label ?? `v${delivery.versionNumber}`}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-black/40">
        Click an empty day to upload a piece scheduled for that date. Click a
        day with a piece to see its status and review link.
      </p>

      {/* Day detail modal */}
      {selectedDelivery && (
        <Modal
          isOpen
          onClose={() => setSelectedDelivery(null)}
          title={selectedDelivery.label ?? `Version ${selectedDelivery.versionNumber}`}
          description={
            selectedDelivery.scheduledAt
              ? new Date(selectedDelivery.scheduledAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : undefined
          }
          size="sm"
        >
          <div className="flex flex-col gap-4">
            <Badge variant={statusVariant[selectedDelivery.status]} className="w-fit">
              {statusLabel[selectedDelivery.status]}
            </Badge>
            <Link
              href={getPublicReviewPath(selectedDelivery.reviewToken, freelancerSlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold uppercase bg-white border-2 border-black text-black hover:bg-black/5 transition-colors"
            >
              Open review page
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
}
