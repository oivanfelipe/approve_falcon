"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Rocket, Trash2 } from "lucide-react";
import { deleteProject } from "@/features/projects/actions/projects";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  id: string;
  name: string;
  clientName: string;
  clientEmail?: string | null;
  totalDeliveries: number;
  latestStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | null;
  updatedAt: Date;
  lastViewedAt?: Date | null;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  CHANGES_REQUESTED: "Alterações",
};

const statusVariant: Record<string, BadgeVariant> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "error",
};

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "agora mesmo";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectCard({
  id,
  name,
  clientName,
  totalDeliveries,
  latestStatus,
  updatedAt,
  lastViewedAt,
}: ProjectCardProps) {
  const variant = latestStatus ? statusVariant[latestStatus] : "warning";
  const label = latestStatus ? statusLabel[latestStatus] : "Sem entregas";

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    const result = await deleteProject(id);
    // deleteProject redirects to /dashboard on success, so this line is only
    // reached when it returns an error instead.
    if (result?.error) {
      setIsDeleting(false);
      setDeleteError(result.error);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 p-5",
        "bg-white border-2 border-black shadow-hard-sm",
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000]",
        "transition-all duration-150",
      )}
    >
      <Link
        href={`/dashboard/projects/${id}`}
        aria-label={`Abrir projeto ${name}`}
        className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e10600]/60"
      />

      <div className="relative z-10 flex flex-col gap-4 pointer-events-none">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-black truncate">{name}</h3>
            <p className="text-xs text-black/50 mt-0.5 truncate">
              {clientName}
            </p>
          </div>
          <Badge variant={variant} size="sm">
            {label}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex flex-col gap-1.5 pt-3 border-t-2 border-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-mono text-black/45">
              <Rocket className="w-3 h-3" />
              {totalDeliveries} vers{totalDeliveries !== 1 ? "ões" : "ão"}
            </div>
            <span className="text-[10px] font-mono text-black/35">
              {timeAgo(updatedAt)}
            </span>
          </div>
          {lastViewedAt ? (
            <span className="text-[10px] font-mono text-black/45">
              Visto {timeAgo(lastViewedAt)}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-black/30">
              Não visualizado
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label="Apagar projeto"
        className="absolute top-3 right-3 z-20 w-6 h-6 flex items-center justify-center text-black/0 group-hover:text-black/35 hover:!text-[#e10600] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {confirmingDelete && (
        <div className="absolute inset-0 z-30 bg-white border-2 border-[#e10600] flex flex-col items-center justify-center gap-2.5 p-5 text-center">
          <p className="text-xs font-bold text-black">
            Apagar &quot;{name}&quot; e todos os posts?
          </p>
          <p className="text-[11px] text-black/50">
            Essa ação não pode ser desfeita.
          </p>
          {deleteError && (
            <p className="text-[11px] font-medium text-[#e10600]">
              {deleteError}
            </p>
          )}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs font-bold uppercase border-2 border-black bg-white text-black hover:bg-black/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs font-bold uppercase border-2 border-[#e10600] bg-[#e10600] text-white hover:bg-[#c00500] disabled:opacity-50"
            >
              {isDeleting ? "Apagando..." : "Apagar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
