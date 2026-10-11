"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import type { BadgeVariant } from "@/components/ui/Badge";
import DeliveryCommentsPanel from "@/features/comments/components/DeliveryCommentsPanel";
import type { CommentInboxDelivery } from "@/features/comments/server/loadCommentsInboxData";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const copyStatusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

const copyStatusLabel: Record<string, string> = {
  PENDING: "Aguardando revisão",
  APPROVED: "Aprovada",
  CHANGES_REQUESTED: "Alterações solicitadas",
};

function formatScheduledDate(date: Date | string | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function CommentInboxCard({
  delivery,
  freelancerName,
  onChanged,
}: {
  delivery: CommentInboxDelivery;
  freelancerName: string;
  onChanged: () => void;
}) {
  return (
    <div className="border-2 border-black shadow-hard-sm bg-white flex flex-col">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b-2 border-black flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-mono font-bold text-white bg-black px-2 py-1 uppercase">
            {delivery.clientName}
          </span>
          {delivery.planNumber && (
            <span className="font-mono text-xs font-bold text-white bg-black/70 px-1.5 py-0.5">
              {delivery.planNumber}
            </span>
          )}
          <span className="text-sm font-bold text-black">
            {delivery.theme ??
              delivery.label ??
              `Versão ${delivery.versionNumber}`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={copyStatusVariant[delivery.copyStatus]} size="sm" dot>
            Copy: {copyStatusLabel[delivery.copyStatus]}
          </Badge>
          {formatScheduledDate(delivery.scheduledAt) && (
            <span className="text-[11px] font-mono text-black/40">
              {formatScheduledDate(delivery.scheduledAt)}
            </span>
          )}
        </div>
      </div>

      <div className="px-5">
        <DeliveryCommentsPanel
          delivery={delivery}
          freelancerName={freelancerName}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Filter = "pending" | "resolved" | "all";

export default function CommentsInboxClient({
  initialDeliveries,
  freelancerName,
}: {
  initialDeliveries: CommentInboxDelivery[];
  freelancerName: string;
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [filter, setFilter] = useState<Filter>("pending");

  const refetch = React.useCallback(async () => {
    try {
      const res = await fetch("/api/comments-inbox");
      if (!res.ok) return;
      const data: CommentInboxDelivery[] = await res.json();
      setDeliveries(data);
    } catch {
      // silently ignore
    }
  }, []);

  const pendingCount = useMemo(
    () => deliveries.filter((d) => d.pendingCount > 0).length,
    [deliveries],
  );

  const filtered = useMemo(() => {
    if (filter === "pending") return deliveries.filter((d) => d.pendingCount > 0);
    if (filter === "resolved")
      return deliveries.filter((d) => d.pendingCount === 0);
    return deliveries;
  }, [deliveries, filter]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-black/40">
          Time operacional
        </p>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black">
          Comentários dos clientes
        </h1>
        <p className="text-sm text-black/50 max-w-xl">
          Veja exatamente o que cada cliente comentou, ajuste a copy direto
          por aqui e libere para uma nova revisão quando estiver pronto.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <Tabs.List>
          <Tabs.Tab value="pending">Pendentes ({pendingCount})</Tabs.Tab>
          <Tabs.Tab value="resolved">Resolvidos</Tabs.Tab>
          <Tabs.Tab value="all">Todos</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filtered.map((delivery) => (
            <CommentInboxCard
              key={delivery.id}
              delivery={delivery}
              freelancerName={freelancerName}
              onChanged={refetch}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
          <p className="text-sm font-semibold text-black">
            Nenhum comentário por aqui
          </p>
          <p className="text-xs text-black/45">
            {filter === "pending"
              ? "Nenhum post com comentário pendente no momento."
              : "Nada para mostrar nesse filtro."}
          </p>
        </div>
      )}
    </div>
  );
}
