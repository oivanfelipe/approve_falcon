"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import FilePreview from "@/features/review/components/FilePreview";
import DriveEmbed from "@/features/review/components/DriveEmbed";
import ApprovalPanel from "@/features/review/components/ApprovalPanel";
import { cn } from "@/lib/utils";
import type { CalendarPageData, CalendarDelivery } from "@/features/calendar/server/loadCalendarPageData";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

interface CalendarClientShellProps {
  data: CalendarPageData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant: Record<Status, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

const statusDot: Record<Status, string> = {
  PENDING: "bg-[#f5a623]",
  APPROVED: "bg-black",
  CHANGES_REQUESTED: "bg-[#e10600]",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function monthLabel(date: Date): string {
  return date
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

// ─── Day detail modal ─────────────────────────────────────────────────────────

function DayDetailModal({
  delivery,
  onClose,
  onStatusChange,
}: {
  delivery: CalendarDelivery;
  onClose: () => void;
  onStatusChange: (status: Status) => void;
}) {
  const date = new Date(delivery.scheduledAt!);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })}
      description={delivery.label ?? `Versão ${delivery.versionNumber}`}
    >
      <div className="flex flex-col gap-6">
        <div className="border-2 border-black">
          {delivery.sourceType === "DRIVE_LINK" && delivery.driveUrl ? (
            <DriveEmbed
              driveUrl={delivery.driveUrl}
              fileName={delivery.fileName}
              allowDownload={delivery.allowDownload}
            />
          ) : delivery.signedUrl && delivery.mimeType ? (
            <FilePreview
              signedUrl={delivery.signedUrl}
              mimeType={delivery.mimeType}
              fileName={delivery.fileName}
              allowDownload={delivery.allowDownload}
            />
          ) : (
            <p className="p-6 text-sm text-black/50">
              Não foi possível carregar este arquivo.
            </p>
          )}
        </div>

        <ApprovalPanel
          token={delivery.reviewToken}
          status={delivery.status as Status}
          onStatusChange={onStatusChange}
        />
      </div>
    </Modal>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarClientShell({ data }: CalendarClientShellProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [openDeliveryId, setOpenDeliveryId] = useState<string | null>(null);

  const deliveriesByDay = useMemo(() => {
    const map = new Map<string, CalendarDelivery>();
    for (const d of data.deliveries) {
      if (!d.scheduledAt) continue;
      map.set(dayKey(new Date(d.scheduledAt)), d);
    }
    return map;
  }, [data.deliveries]);

  const grid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const openDelivery = data.deliveries.find((d) => d.id === openDeliveryId) ?? null;

  const primaryColor = data.branding?.primaryColor;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {data.branding?.displayName && (
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40">
              {data.branding.displayName}
            </p>
          )}
          <h1 className="text-xl font-extrabold uppercase tracking-tight text-black">
            {data.project.name}
          </h1>
          <p className="text-sm text-black/50">Cliente: {data.project.clientName}</p>
        </div>
      </header>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <button
          onClick={() =>
            setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
          }
          className="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black hover:bg-black/5 transition-colors"
        >
          ‹ Anterior
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
          Próximo ›
        </button>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto w-full px-6 pb-10">
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
            const status = delivery
              ? statuses[delivery.id] ?? (delivery.status as Status)
              : null;

            return (
              <button
                key={date.toISOString()}
                disabled={!delivery}
                onClick={() => delivery && setOpenDeliveryId(delivery.id)}
                className={cn(
                  "border-r-2 border-b-2 border-black min-h-20 sm:min-h-28 flex flex-col items-start p-2 text-left transition-colors",
                  !inMonth && "bg-black/5",
                  delivery && "cursor-pointer hover:bg-[#e10600]/5",
                  !delivery && "cursor-default",
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
                {delivery && status && (
                  <div className="mt-auto flex flex-col gap-1 w-full">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        statusDot[status],
                      )}
                    />
                    <span className="hidden sm:block text-[10px] font-semibold text-black/70 truncate">
                      {delivery.label ?? `Versão ${delivery.versionNumber}`}
                    </span>
                    <Badge variant={statusVariant[status]} className="hidden sm:inline-flex w-fit text-[9px]">
                      {status === "PENDING"
                        ? "Pendente"
                        : status === "APPROVED"
                          ? "Aprovado"
                          : "Alterações"}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {openDelivery && (
        <DayDetailModal
          delivery={openDelivery}
          onClose={() => setOpenDeliveryId(null)}
          onStatusChange={(status) =>
            setStatuses((prev) => ({ ...prev, [openDelivery.id]: status }))
          }
        />
      )}

      <footer
        className="text-center text-[11px] text-black/30 py-6"
        style={primaryColor ? { color: primaryColor } : undefined}
      >
        Powered by Approve Falcon
      </footer>
    </div>
  );
}
