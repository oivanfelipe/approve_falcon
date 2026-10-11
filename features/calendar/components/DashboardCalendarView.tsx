"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { getPublicReviewPath } from "@/lib/freelancer-branding-shared";
import { deleteDelivery } from "@/features/deliveries/actions/deliveries";
import {
  WEEKDAYS,
  monthLabel,
  dayKey,
  scheduledDayKey,
  formatScheduledDate,
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
  fileName?: string | null;
  theme?: string | null;
  copyStatus?: Status;
  pendingCommentCount?: number;
}

interface DashboardCalendarViewProps {
  deliveries: CalendarDeliveryRow[];
  projectSlug?: string | null;
  onEmptyDayClick: (dateInputValue: string) => void;
  onAttachCreative?: (deliveryId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant: Record<Status, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

function copyStatusLabel(status: Status): string {
  if (status === "APPROVED") return "Aprovada";
  if (status === "CHANGES_REQUESTED") return "Pendente (V4)";
  return "Pendente (Cliente)";
}

function artStatusLabel(status: Status, hasFile: boolean): string {
  if (status === "APPROVED") return "Aprovada";
  if (status === "CHANGES_REQUESTED") return "Pendente (V4)";
  return hasFile ? "Pendente (Cliente)" : "Pendente (V4)";
}

const statusDot: Record<Status, string> = {
  PENDING: "bg-[#f5a623]",
  APPROVED: "bg-black",
  CHANGES_REQUESTED: "bg-[#e10600]",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardCalendarView({
  deliveries,
  projectSlug,
  onEmptyDayClick,
  onAttachCreative,
}: DashboardCalendarViewProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDelivery, setSelectedDelivery] = useState<CalendarDeliveryRow | null>(
    null,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();

  const deliveriesByDay = useMemo(() => {
    const map = new Map<string, CalendarDeliveryRow>();
    for (const d of deliveries) {
      if (!d.scheduledAt) continue;
      map.set(scheduledDayKey(new Date(d.scheduledAt)), d);
    }
    return map;
  }, [deliveries]);

  const grid = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  const closeModal = () => {
    setSelectedDelivery(null);
    setConfirmingDelete(false);
    setDeleteError("");
  };

  const handleDelete = () => {
    if (!selectedDelivery) return;
    setDeleteError("");
    startDeleteTransition(async () => {
      const result = await deleteDelivery(selectedDelivery.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      closeModal();
    });
  };

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
                "relative border-r-2 border-b-2 border-black min-h-16 sm:min-h-24 flex flex-col items-start p-2 text-left transition-colors",
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
              {delivery && !!delivery.pendingCommentCount && (
                <span
                  className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#e10600] text-white text-[9px] font-bold"
                  title={`${delivery.pendingCommentCount} comentário${delivery.pendingCommentCount !== 1 ? "s" : ""} do cliente aguardando resposta`}
                >
                  {delivery.pendingCommentCount}
                </span>
              )}
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
        Clique em um dia vazio para enviar uma peça agendada para aquela
        data. Clique em um dia com post para ver o status e o link de
        revisão.
      </p>

      {/* Day detail modal */}
      {selectedDelivery && (
        <Modal
          isOpen
          onClose={closeModal}
          title={
            selectedDelivery.theme ??
            selectedDelivery.label ??
            `Versão ${selectedDelivery.versionNumber}`
          }
          description={
            selectedDelivery.scheduledAt
              ? formatScheduledDate(new Date(selectedDelivery.scheduledAt), "pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })
              : undefined
          }
          size="sm"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDelivery.copyStatus && (
                <Badge variant={statusVariant[selectedDelivery.copyStatus]} size="sm">
                  Copy: {copyStatusLabel(selectedDelivery.copyStatus)}
                </Badge>
              )}
              <Badge variant={statusVariant[selectedDelivery.status]} size="sm">
                Arte:{" "}
                {artStatusLabel(
                  selectedDelivery.status,
                  Boolean(selectedDelivery.fileName),
                )}
              </Badge>
              {!!selectedDelivery.pendingCommentCount && (
                <Badge variant="error" size="sm" dot>
                  {selectedDelivery.pendingCommentCount} comentário
                  {selectedDelivery.pendingCommentCount !== 1 ? "s" : ""} do cliente
                </Badge>
              )}
            </div>

            {onAttachCreative && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => onAttachCreative(selectedDelivery.id)}
              >
                Editar post
              </Button>
            )}

            <Link
              href={getPublicReviewPath(selectedDelivery.reviewToken, projectSlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold uppercase bg-white border-2 border-black text-black hover:bg-black/5 transition-colors"
            >
              Abrir página de revisão
            </Link>

            {confirmingDelete ? (
              <div className="flex flex-col gap-3 p-4 bg-white border-2 border-[#e10600]">
                <p className="text-sm font-extrabold uppercase text-[#e10600]">
                  Apagar este post?
                </p>
                <p className="text-xs text-black/50">
                  Isso remove o post e seu link de revisão permanentemente.
                  Essa ação não pode ser desfeita.
                </p>
                {deleteError && (
                  <p className="text-xs font-medium text-[#e10600]" role="alert">
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteError("");
                    }}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    loading={isDeleting}
                  >
                    Confirmar exclusão
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
                fullWidth
              >
                Apagar post
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
