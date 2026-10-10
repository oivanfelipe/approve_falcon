"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import FilePreview from "@/features/review/components/FilePreview";
import DriveEmbed from "@/features/review/components/DriveEmbed";
import ApprovalPanel from "@/features/review/components/ApprovalPanel";
import ArtCopyMockup from "@/features/review/components/ArtCopyMockup";
import { cn } from "@/lib/utils";
import type { CalendarPageData, CalendarDelivery } from "@/features/calendar/server/loadCalendarPageData";
import {
  WEEKDAYS,
  monthLabel,
  dayKey,
  scheduledDayKey,
  formatScheduledDate,
  buildMonthGrid,
} from "@/features/calendar/lib/monthGrid";

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

// ─── Day detail modal ─────────────────────────────────────────────────────────

function DayDetailModal({
  delivery,
  copyStatus,
  onClose,
  onStatusChange,
  onCopyStatusChange,
  primaryColor,
  accountLabel,
}: {
  delivery: CalendarDelivery;
  copyStatus: Status;
  onClose: () => void;
  onStatusChange: (status: Status) => void;
  onCopyStatusChange: (status: Status) => void;
  primaryColor?: string;
  accountLabel?: string | null;
}) {
  const date = new Date(delivery.scheduledAt!);
  const hasCopyContent = Boolean(
    delivery.copyText ||
      delivery.artCopy ||
      delivery.theme ||
      delivery.objective ||
      delivery.postFunction,
  );
  const creativeRevealed = copyStatus === "APPROVED" || !hasCopyContent;
  const hasCreativeFile = Boolean(delivery.driveUrl || delivery.signedUrl);

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={formatScheduledDate(date, "pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })}
      description={delivery.label ?? `Versão ${delivery.versionNumber}`}
    >
      <div className="flex flex-col gap-6">
        <div className="border-2 border-black">
          {!creativeRevealed ? (
            <div className="p-6 flex flex-col gap-5">
              <p className="text-[11px] font-mono text-black/40">
                Etapa 1 de 2 — aprove o planejamento abaixo. A arte é criada
                e enviada para aprovação depois.
              </p>
              {(delivery.theme || delivery.format || delivery.product || delivery.objective || delivery.postFunction) && (
                <div className="flex flex-col gap-3 pb-4 border-b border-black/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    {delivery.planNumber && (
                      <span className="font-mono text-xs font-bold text-white bg-black px-1.5 py-0.5">
                        {delivery.planNumber}
                      </span>
                    )}
                    {delivery.theme && (
                      <span className="text-sm font-bold text-black">
                        {delivery.theme}
                      </span>
                    )}
                  </div>
                  {(delivery.format || delivery.product || delivery.postFunction) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {delivery.format && (
                        <span className="text-xs text-black/60">
                          <span className="font-mono font-bold uppercase tracking-wider text-black/35">
                            Formato{" "}
                          </span>
                          {delivery.format}
                        </span>
                      )}
                      {delivery.postFunction && (
                        <span className="text-xs text-black/60">
                          <span className="font-mono font-bold uppercase tracking-wider text-black/35">
                            Função{" "}
                          </span>
                          {delivery.postFunction}
                        </span>
                      )}
                      {delivery.product && (
                        <span className="text-xs text-black/60">
                          <span className="font-mono font-bold uppercase tracking-wider text-black/35">
                            Produto{" "}
                          </span>
                          {delivery.product}
                        </span>
                      )}
                    </div>
                  )}
                  {delivery.objective && (
                    <p className="text-xs text-black/60">
                      <span className="font-mono font-bold uppercase tracking-wider text-black/35">
                        Objetivo / Pilar{" "}
                      </span>
                      {delivery.objective}
                    </p>
                  )}
                </div>
              )}

              {delivery.artCopy && (
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40 mb-2">
                    Copy da arte — prévia
                  </p>
                  <ArtCopyMockup
                    text={delivery.artCopy}
                    primaryColor={primaryColor}
                    accountLabel={accountLabel}
                    caption={delivery.copyText}
                  />
                </div>
              )}

              {delivery.copyText && (
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40 mb-2">
                    Legenda e CTA
                  </p>
                  <p className="text-sm text-black whitespace-pre-wrap leading-relaxed">
                    {delivery.copyText}
                  </p>
                </div>
              )}
            </div>
          ) : !hasCreativeFile ? (
            <p className="p-6 text-sm text-black/50 text-center">
              Copy aprovada. Aguardando a arte ser enviada pelo time.
            </p>
          ) : delivery.sourceType === "DRIVE_LINK" && delivery.driveUrl ? (
            <DriveEmbed
              driveUrl={delivery.driveUrl}
              fileName={delivery.fileName ?? "Arte"}
              allowDownload={delivery.allowDownload}
            />
          ) : delivery.signedUrl && delivery.mimeType ? (
            <FilePreview
              signedUrl={delivery.signedUrl}
              mimeType={delivery.mimeType}
              fileName={delivery.fileName ?? "Arte"}
              allowDownload={delivery.allowDownload}
            />
          ) : (
            <p className="p-6 text-sm text-black/50">
              Não foi possível carregar este arquivo.
            </p>
          )}
        </div>

        {creativeRevealed ? (
          <ApprovalPanel
            token={delivery.reviewToken}
            status={delivery.status as Status}
            onStatusChange={onStatusChange}
          />
        ) : (
          <ApprovalPanel
            token={delivery.reviewToken}
            status={copyStatus}
            onStatusChange={onCopyStatusChange}
            actionPrefix="copy-"
            labels={{
              heading: "Decisão sobre a copy",
              approveButton: "Aprovar copy",
              approveConfirmTitle: "Confirmar aprovação da copy",
              requestButton: "Solicitar alterações na copy",
              requestConfirmTitle: "Solicitar alterações na copy",
            }}
          />
        )}
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
  const [copyStatuses, setCopyStatuses] = useState<Record<string, Status>>({});
  const [openDeliveryId, setOpenDeliveryId] = useState<string | null>(null);

  const deliveriesByDay = useMemo(() => {
    const map = new Map<string, CalendarDelivery>();
    for (const d of data.deliveries) {
      if (!d.scheduledAt) continue;
      map.set(scheduledDayKey(new Date(d.scheduledAt)), d);
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
            const copyStatus = delivery
              ? copyStatuses[delivery.id] ?? (delivery.copyStatus as Status)
              : null;
            const creativeRevealed =
              !delivery ||
              copyStatus === "APPROVED" ||
              !(
                delivery.copyText ||
                delivery.artCopy ||
                delivery.theme ||
                delivery.objective ||
                delivery.postFunction
              );
            const status = delivery
              ? creativeRevealed
                ? statuses[delivery.id] ?? (delivery.status as Status)
                : copyStatus
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
          copyStatus={
            copyStatuses[openDelivery.id] ?? (openDelivery.copyStatus as Status)
          }
          onClose={() => setOpenDeliveryId(null)}
          onStatusChange={(status) =>
            setStatuses((prev) => ({ ...prev, [openDelivery.id]: status }))
          }
          onCopyStatusChange={(status) =>
            setCopyStatuses((prev) => ({ ...prev, [openDelivery.id]: status }))
          }
          primaryColor={primaryColor}
          accountLabel={data.branding?.displayName}
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
