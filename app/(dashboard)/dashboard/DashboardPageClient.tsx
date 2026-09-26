"use client";

import React, { useState } from "react";
import ProjectCard from "@/features/projects/components/ProjectCard";
import NewProjectModal from "@/features/projects/components/NewProjectModal";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";
import useLiveProjects from "@/features/projects/hooks/useLiveProjects";
import { cn } from "@/lib/utils";
import StatCard from "@/features/dashboard/components/StatCard";

interface Stats {
  totalProjects: number;
  totalPending: number;
  totalApproved: number;
  totalChanges: number;
}

interface ProjectData {
  id: string;
  name: string;
  clientName: string;
  clientEmail?: string | null;
  totalDeliveries: number;
  latestStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | null;
  updatedAt: Date;
  lastViewedAt?: Date | null;
}

const STATUS_FILTERS = [
  { key: "ALL", label: "Todos" },
  { key: "PENDING", label: "Pendente" },
  { key: "APPROVED", label: "Aprovado" },
  { key: "CHANGES_REQUESTED", label: "Alterações" },
] as const;

export default function DashboardPageClient({
  stats,
  projects,
  searchInputId,
}: {
  stats: Stats;
  projects: ProjectData[];
  searchInputId?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "CHANGES_REQUESTED"
  >("ALL");
  const [liveProjects, setLiveProjects] =
    useLiveProjects<ProjectData>(projects);

  // Realtime handled by useLiveProjects hook

  // ─── Sorting priority ───────────────────────────────────────────────────────
  const STATUS_PRIORITY: Record<string, number> = {
    PENDING: 1,
    CHANGES_REQUESTED: 2,
    APPROVED: 3,
  };

  const filteredProjects = liveProjects
    .filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.clientName ?? "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || p.latestStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.latestStatus ?? ""] ?? 4;
      const pb = STATUS_PRIORITY[b.latestStatus ?? ""] ?? 4;
      if (pa !== pb) return pa - pb;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-black">
              Projetos
            </h1>
            <p className="text-sm text-black/50 mt-0.5">
              Gerencie suas entregas e links de revisão
            </p>
          </div>
          <Button
            variant="falconPrimary"
            size="sm"
            onClick={() => setModalOpen(true)}
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Novo projeto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total de projetos" value={stats.totalProjects} />
          <StatCard
            label="Aguardando revisão"
            value={stats.totalPending}
            accent
          />
          <StatCard label="Aprovados" value={stats.totalApproved} />
          <StatCard label="Alterações" value={stats.totalChanges} accent />
        </div>

        {/* Search + Status filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <input
              id={searchInputId}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projetos ou clientes..."
              className={cn(
                "w-full h-11 pl-10 pr-4 text-sm text-black placeholder:text-black/35",
                "bg-white border-2 border-black rounded-md",
                "focus:outline-none focus:ring-2 focus:ring-[#e10600]/50",
              )}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "px-3.5 h-9 text-xs font-bold uppercase tracking-wide border-2 border-black transition-colors",
                  statusFilter === key
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-black/5",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((p) => (
              <ProjectCard key={p.id} {...p} />
            ))}
          </div>
        ) : liveProjects.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-semibold text-black/70">
              Nenhum resultado encontrado
            </p>
            <p className="text-xs text-black/40">
              Tente outro nome de projeto ou cliente
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-black"
                aria-hidden="true"
              >
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">
                Nenhum projeto ainda
              </p>
              <p className="text-xs text-black/50 mt-1">
                Crie seu primeiro projeto para começar
              </p>
            </div>
            <Button
              variant="falconPrimary"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              Criar projeto
            </Button>
          </div>
        )}

        <NewProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  );
}
