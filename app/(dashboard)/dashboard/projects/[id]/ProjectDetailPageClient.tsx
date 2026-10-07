"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/browser";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import NewDeliveryModal from "@/features/deliveries/components/NewDeliveryModal";
import CalendarLinkButton from "@/features/calendar/components/CalendarLinkButton";
import DashboardCalendarView from "@/features/calendar/components/DashboardCalendarView";
import ImportSpreadsheetModal from "@/features/calendar/components/ImportSpreadsheetModal";
import { scheduleDelivery } from "@/features/deliveries/actions/deliveries";
import { Tabs } from "@/components/ui/Tabs";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Copy, Upload } from "lucide-react";
import { getPublicReviewPath } from "@/lib/freelancer-branding-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliveryRow {
  id: string;
  versionNumber: number;
  label: string | null;
  scheduledAt: Date | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  sourceType: "FILE" | "DRIVE_LINK";
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  reviewToken: string;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  lastViewedAt: Date | null;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  copyStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  copyText: string | null;
}

interface ProjectDetailClientProps {
  projectId: string;
  projectName: string;
  clientName: string;
  clientEmail: string | null | undefined;
  deliveries: DeliveryRow[];
  freelancerSlug?: string | null;
  calendarToken?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Share buttons ────────────────────────────────────────────────────────────

function ShareButtons({
  token,
  slug,
}: {
  token: string;
  slug?: string | null;
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}${getPublicReviewPath(token, slug)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={copyLink}
        variant={copiedLink ? "primary" : "outline"}
        size="sm"
        aria-label="Copy review link"
      >
        {copiedLink ? (
          <>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" /> Client link
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Unscheduled row ──────────────────────────────────────────────────────────

function UnscheduledRow({
  delivery,
  onAttach,
  onScheduled,
}: {
  delivery: DeliveryRow;
  onAttach: () => void;
  onScheduled: () => void;
}) {
  const [date, setDate] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const handleSchedule = async () => {
    if (!date) return;
    setIsPending(true);
    setError("");
    const result = await scheduleDelivery({
      deliveryId: delivery.id,
      scheduledAt: date,
    });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onScheduled();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border-2 border-black shadow-hard-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {delivery.planNumber && (
          <span className="shrink-0 font-mono text-xs font-bold text-white bg-black px-2 py-0.5">
            {delivery.planNumber}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-black truncate">
            {delivery.theme ?? delivery.label ?? `Versão ${delivery.versionNumber}`}
          </p>
          <p className="text-xs text-black/40 truncate">
            {[delivery.format, delivery.product].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Badge variant={statusVariant[delivery.copyStatus]} size="sm" dot>
          Copy: {statusLabel[delivery.copyStatus]}
        </Badge>

        {!delivery.fileName && (
          <Button variant="outline" size="sm" onClick={onAttach}>
            Subir arte
          </Button>
        )}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border-2 border-black px-2 py-1.5 text-xs font-mono"
        />
        <Button
          variant="primary"
          size="sm"
          disabled={!date || isPending}
          loading={isPending}
          onClick={handleSchedule}
        >
          Agendar
        </Button>
        {error && (
          <span className="text-[11px] font-medium text-[#e10600]">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailClient({
  projectId,
  projectName,
  clientName,
  clientEmail,
  deliveries: initialDeliveries,
  freelancerSlug,
  calendarToken,
}: ProjectDetailClientProps) {
  const [liveDeliveries, setLiveDeliveries] = useState(initialDeliveries);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadInitialDate, setUploadInitialDate] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "unscheduled">(
    "list",
  );
  const [importOpen, setImportOpen] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  const openUpload = (dateInputValue?: string) => {
    setUploadInitialDate(dateInputValue);
    setUploadOpen(true);
  };

  const unscheduledDeliveries = liveDeliveries.filter((d) => !d.scheduledAt);

  // ─── Supabase Realtime + refetch helper ────────────────────────────────────
  const refetch = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries`);
      if (!res.ok) return;
      const data: DeliveryRow[] = await res.json();
      setLiveDeliveries(
        data.map((d) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          lastViewedAt: d.lastViewedAt ? new Date(d.lastViewedAt) : null,
          scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
        })),
      );
    } catch {
      // silently ignore
    }
  }, [projectId]);

  useEffect(() => {
    const channel = supabaseClient
      .channel(`project-detail-${projectId}`)
      // Status changes live on Delivery rows
      .on(
        "postgres_changes",
        { event: "*", schema: "falcon", table: "Delivery" },
        (payload) => {
          const row = (
            payload.eventType === "DELETE" ? payload.old : payload.new
          ) as {
            projectId: string;
          };
          if (row.projectId === projectId) refetch();
        },
      )
      // View inserts → viewCount + lastViewedAt
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "falcon", table: "View" },
        (payload) => {
          const { deliveryId } = payload.new as { deliveryId: string };
          const belongs = liveDeliveries.some((d) => d.id === deliveryId);
          if (belongs) refetch();
        },
      )
      // Comment inserts/deletes → commentCount
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "falcon", table: "Comment" },
        (payload) => {
          const { deliveryId } = payload.new as { deliveryId: string };
          const belongs = liveDeliveries.some((d) => d.id === deliveryId);
          if (belongs) refetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "falcon", table: "Comment" },
        (payload) => {
          const { deliveryId } = payload.old as { deliveryId: string };
          const belongs = liveDeliveries.some((d) => d.id === deliveryId);
          if (belongs) refetch();
        },
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [projectId, refetch, liveDeliveries]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8 bg-white min-h-screen">
      {/* Back + header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase text-black/40 hover:text-black transition-colors w-fit"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black">
              {projectName}
            </h1>
            <p className="text-sm text-black/50 mt-1">
              Client: {clientName}
              {clientEmail && (
                <span className="text-black/35"> · {clientEmail}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CalendarLinkButton
              projectId={projectId}
              initialToken={calendarToken}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Importar planilha
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openUpload()}
              leftIcon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                </svg>
              }
            >
              Upload version
            </Button>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "list" | "calendar" | "unscheduled")}
      >
        <Tabs.List>
          <Tabs.Tab value="list">List</Tabs.Tab>
          <Tabs.Tab value="calendar">Calendar</Tabs.Tab>
          <Tabs.Tab value="unscheduled">
            Sem data
            {unscheduledDeliveries.length > 0 && ` (${unscheduledDeliveries.length})`}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="unscheduled" className="mt-4">
          {unscheduledDeliveries.length > 0 ? (
            <div className="flex flex-col gap-2">
              {unscheduledDeliveries.map((d) => (
                <UnscheduledRow
                  key={d.id}
                  delivery={d}
                  onAttach={() => setAttachingId(d.id)}
                  onScheduled={refetch}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/40 py-10 text-center">
              Nenhum post sem data. Importe uma planilha ou agende pelo
              calendário.
            </p>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="calendar" className="mt-4">
          <DashboardCalendarView
            deliveries={liveDeliveries}
            freelancerSlug={freelancerSlug}
            onEmptyDayClick={(dateInputValue) => openUpload(dateInputValue)}
          />
        </Tabs.Panel>

        <Tabs.Panel value="list" className="mt-4">
      {/* Deliveries */}
      {liveDeliveries.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono font-bold text-black/40 uppercase tracking-wider">
            {liveDeliveries.length} version
            {liveDeliveries.length !== 1 ? "s" : ""}
          </h2>
          <div className="flex flex-col gap-2">
            {liveDeliveries.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border-2 border-black shadow-hard-sm"
              >
                {/* Left: version info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="shrink-0 font-mono text-xs font-bold text-white bg-black px-2 py-0.5">
                    v{d.versionNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black truncate">
                      {d.label ?? d.fileName}
                    </p>
                    {d.label && (
                      <p className="text-xs text-black/40 truncate">
                        {d.fileName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  {d.sourceType === "DRIVE_LINK" ? (
                    <span className="text-xs font-mono font-bold text-white bg-black px-2 py-0.5">
                      Google Drive
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-black/40">
                      {formatSize(d.fileSize)}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 text-xs font-mono text-black/40">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    {d.commentCount}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-black/40">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {d.viewCount}
                  </div>

                  <Badge variant={statusVariant[d.status]} size="sm" dot>
                    {statusLabel[d.status]}
                  </Badge>

                  <span className="text-[10px] font-mono text-black/35">
                    {timeAgo(d.createdAt)}
                  </span>

                  {d.lastViewedAt ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#e10600]">
                      👀 {timeAgo(d.lastViewedAt)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-black/25 italic">
                      Not viewed
                    </span>
                  )}

                  <ShareButtons token={d.reviewToken} slug={freelancerSlug} />

                  <Link
                    href={`${getPublicReviewPath(d.reviewToken, freelancerSlug)}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-black/60 hover:text-black transition-colors"
                  >
                    Preview ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
              aria-hidden="true"
            >
              <polyline points="16 16 12 12 8 16" />
              <line x1="12" y1="12" x2="12" y2="21" />
              <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-black">No versions yet</p>
            <p className="text-xs text-black/45 mt-1">
              Upload your first file to generate a review link
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openUpload()}
          >
            Upload version
          </Button>
        </div>
      )}
        </Tabs.Panel>
      </Tabs>

      <NewDeliveryModal
        projectId={projectId}
        freelancerSlug={freelancerSlug}
        isOpen={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setUploadInitialDate(undefined);
        }}
        onSuccess={() => {
          refetch();
        }}
        initialScheduledAt={uploadInitialDate}
      />

      {attachingId && (
        <NewDeliveryModal
          projectId={projectId}
          freelancerSlug={freelancerSlug}
          isOpen
          attachToDeliveryId={attachingId}
          onClose={() => setAttachingId(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <ImportSpreadsheetModal
        projectId={projectId}
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          refetch();
          setViewMode("unscheduled");
        }}
      />
    </div>
  );
}


