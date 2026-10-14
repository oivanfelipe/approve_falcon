"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import FilePreview from "@/features/review/components/FilePreview";
import DriveEmbed from "@/features/review/components/DriveEmbed";
import ApprovalPanel from "@/features/review/components/ApprovalPanel";
import ArtCopyMockup from "@/features/review/components/ArtCopyMockup";
import RealAssetCarousel from "@/features/review/components/RealAssetCarousel";
import PostCaption from "@/features/review/components/PostCaption";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { releaseArtForReview } from "@/features/deliveries/actions/deliveries";
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
import { getPendingStageBadge } from "@/features/calendar/lib/pendingStage";
import { getPublicReviewPath } from "@/lib/freelancer-branding-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

interface CalendarClientShellProps {
  data: CalendarPageData;
  isTeamMember?: boolean;
  freelancerName?: string | null;
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

// Team-facing phrasing for the same statuses — the decision belongs to the
// client, so this reads as a report, never a call to action (same treatment
// as the single-post review page).
const teamStatusLabel: Record<Status, string> = {
  PENDING: "Aguardando decisão do cliente",
  APPROVED: "Aprovado pelo cliente",
  CHANGES_REQUESTED: "Cliente pediu alterações",
};

type OverviewGroup = "pending_client" | "pending_team" | "approved" | "published";

const OVERVIEW_FILTERS: { key: "all" | OverviewGroup; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending_client", label: "Pendente de você" },
  { key: "pending_team", label: "Com a agência" },
  { key: "approved", label: "Aprovados" },
  { key: "published", label: "Publicados" },
];

// ─── Day detail modal ─────────────────────────────────────────────────────────

function DayDetailModal({
  delivery,
  copyStatus,
  onClose,
  onStatusChange,
  onCopyStatusChange,
  primaryColor,
  accountLabel,
  avatarUrl,
  isTeamMember,
}: {
  delivery: CalendarDelivery;
  copyStatus: Status;
  onClose: () => void;
  onStatusChange: (status: Status) => void;
  onCopyStatusChange: (status: Status) => void;
  primaryColor?: string;
  accountLabel?: string | null;
  avatarUrl?: string | null;
  isTeamMember?: boolean;
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState("");
  const date = new Date(delivery.scheduledAt!);
  const hasCopyContent = Boolean(
    delivery.copyText ||
      delivery.artCopy ||
      delivery.theme ||
      delivery.objective ||
      delivery.postFunction,
  );
  const hasCreativeFile = Boolean(delivery.driveUrl || delivery.signedUrl);
  // The real art, once uploaded, is always shown ahead of the
  // planning-stage copy mockup.
  const creativeRevealed =
    hasCreativeFile || copyStatus === "APPROVED" || !hasCopyContent;

  const handleReleaseArt = async () => {
    setIsReleasing(true);
    setReleaseError("");
    const result = await releaseArtForReview(delivery.id);
    setIsReleasing(false);
    if (result.error) {
      setReleaseError(result.error);
      return;
    }
    onStatusChange("PENDING");
  };

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
                    avatarUrl={avatarUrl}
                  />
                </div>
              )}

            </div>
          ) : !hasCreativeFile ? (
            <p className="p-6 text-sm text-black/50 text-center">
              Copy aprovada. Aguardando a arte ser enviada pelo time.
            </p>
          ) : (
            <div className="p-4 flex flex-col gap-4">
              <RealAssetCarousel
                allowDownload={delivery.allowDownload}
                extraAssets={delivery.assets}
                renderPrimary={() =>
                  delivery.sourceType === "DRIVE_LINK" && delivery.driveUrl ? (
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
                  )
                }
              />
              <PostCaption caption={delivery.copyText} accountLabel={accountLabel} />
            </div>
          )}
        </div>

        {isTeamMember ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-black/50 uppercase tracking-wider font-bold font-mono">
              Status da revisão
            </p>
            <div className="flex items-center gap-2.5 p-4 bg-white border-2 border-black">
              <Badge
                variant={statusVariant[creativeRevealed ? delivery.status : copyStatus]}
                dot
                size="sm"
              >
                {teamStatusLabel[creativeRevealed ? delivery.status : copyStatus]}
              </Badge>
            </div>

            {creativeRevealed && delivery.status === "CHANGES_REQUESTED" && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleReleaseArt}
                  loading={isReleasing}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Liberar para aprovação do cliente
                </Button>
                {releaseError && (
                  <p className="text-xs font-medium text-[#e10600]" role="alert">
                    {releaseError}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : creativeRevealed ? (
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

export default function CalendarClientShell({
  data,
  isTeamMember = false,
}: CalendarClientShellProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [copyStatuses, setCopyStatuses] = useState<Record<string, Status>>({});
  const [openDeliveryId, setOpenDeliveryId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [view, setView] = useState<"calendar" | "grid">(
    searchParams.get("view") === "grid" ? "grid" : "calendar",
  );
  const [overviewFilter, setOverviewFilter] = useState<"all" | OverviewGroup>("all");

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
  const agencyLabel = data.branding?.displayName ?? "Agência";

  const overviewItems = useMemo(() => {
    return data.deliveries.map((d) => {
      const copyStatus = copyStatuses[d.id] ?? (d.copyStatus as Status);
      const artStatus = statuses[d.id] ?? (d.status as Status);
      const hasFile = Boolean(d.driveUrl || d.signedUrl);
      const hasCopyContent = Boolean(
        d.copyText || d.artCopy || d.theme || d.objective || d.postFunction,
      );
      const badge = getPendingStageBadge({
        copyStatus,
        artStatus,
        hasFile,
        hasCopyContent,
        agencyLabel,
        published: Boolean(d.publishedAt),
      });
      const group: OverviewGroup =
        badge.status === "APPROVED"
          ? d.publishedAt
            ? "published"
            : "approved"
          : badge.label.startsWith("Pendente (Cliente)")
            ? "pending_client"
            : "pending_team";
      return { delivery: d, badge, group };
    });
  }, [data.deliveries, statuses, copyStatuses, agencyLabel]);

  const overviewCounts = useMemo(() => {
    const counts: Record<"all" | OverviewGroup, number> = {
      all: overviewItems.length,
      pending_client: 0,
      pending_team: 0,
      approved: 0,
      published: 0,
    };
    for (const item of overviewItems) counts[item.group] += 1;
    return counts;
  }, [overviewItems]);

  const filteredOverviewItems =
    overviewFilter === "all"
      ? overviewItems
      : overviewItems.filter((item) => item.group === overviewFilter);

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

      {/* View toggle */}
      <div className="flex items-center justify-center gap-2 px-6 py-4">
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={cn(
            "px-3.5 h-9 text-xs font-bold uppercase tracking-wide border-2 border-black transition-colors",
            view === "calendar"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black/5",
          )}
        >
          Calendário
        </button>
        <button
          type="button"
          onClick={() => setView("grid")}
          className={cn(
            "px-3.5 h-9 text-xs font-bold uppercase tracking-wide border-2 border-black transition-colors",
            view === "grid"
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black/5",
          )}
        >
          Todas as peças
        </button>
      </div>

      {view === "grid" ? (
        <div className="max-w-5xl mx-auto w-full px-6 pb-10 flex flex-col gap-5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {OVERVIEW_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setOverviewFilter(key)}
                className={cn(
                  "px-3.5 h-9 text-xs font-bold uppercase tracking-wide border-2 border-black transition-colors",
                  overviewFilter === key
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-black/5",
                )}
              >
                {label} ({overviewCounts[key]})
              </button>
            ))}
          </div>

          {filteredOverviewItems.length === 0 ? (
            <p className="text-sm text-black/40 text-center py-16">
              Nenhuma peça neste filtro.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredOverviewItems.map(({ delivery, badge }) => (
                <Link
                  key={delivery.id}
                  href={getPublicReviewPath(delivery.reviewToken)}
                  className="block border-2 border-black bg-white shadow-hard-sm hover:bg-black/[0.02] transition-colors overflow-hidden"
                >
                  <div className="relative aspect-[4/5] bg-black/[0.03] flex items-center justify-center">
                    {delivery.signedUrl && delivery.mimeType?.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={delivery.signedUrl}
                        alt={delivery.theme ?? delivery.fileName ?? "Arte"}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(0,0,0,.3)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                    {delivery.planNumber && (
                      <span className="absolute top-2 left-2 font-mono text-[10px] font-bold text-white bg-black px-1.5 py-0.5">
                        {delivery.planNumber}
                      </span>
                    )}
                    <Badge
                      variant={statusVariant[badge.status]}
                      className="absolute top-2 right-2 text-[9px]"
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-sm font-bold text-black truncate">
                      {delivery.theme ?? delivery.label ?? `Versão ${delivery.versionNumber}`}
                    </span>
                    <span className="text-xs text-black/45">
                      {[delivery.format, delivery.scheduledAt
                        ? formatScheduledDate(new Date(delivery.scheduledAt), "pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })
                        : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
            const badge = delivery
              ? getPendingStageBadge({
                  copyStatus: copyStatuses[delivery.id] ?? (delivery.copyStatus as Status),
                  artStatus: statuses[delivery.id] ?? (delivery.status as Status),
                  hasFile: Boolean(delivery.driveUrl || delivery.signedUrl),
                  hasCopyContent: Boolean(
                    delivery.copyText ||
                      delivery.artCopy ||
                      delivery.theme ||
                      delivery.objective ||
                      delivery.postFunction,
                  ),
                  agencyLabel,
                  published: Boolean(delivery.publishedAt),
                })
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
                {delivery && badge && (
                  <div className="mt-auto flex flex-col gap-1 w-full">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        statusDot[badge.status],
                      )}
                    />
                    <Badge variant={statusVariant[badge.status]} className="w-fit text-[9px]">
                      {badge.label}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
        </>
      )}

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
          avatarUrl={data.branding?.logoUrl}
          isTeamMember={isTeamMember}
        />
      )}

      <footer
        className="text-center text-[11px] text-black/30 py-6"
        style={primaryColor ? { color: primaryColor } : undefined}
      >
        Powered by Approve
      </footer>
    </div>
  );
}
