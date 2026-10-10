"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { importContentPlan } from "@/features/calendar/actions/calendar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentPlanEntry {
  sheet: string;
  row: number;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  weekHint: string | null;
  objective: string | null;
  artCopy: string | null;
  copyText: string | null;
}

interface AiMappedColumn {
  sheet: string;
  header: string;
  mappedTo: string;
}

interface ImportSpreadsheetModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "pick" | "parsing" | "preview" | "importing" | "done" | "error";

// Keep in sync with the MAX_FILE_BYTES check in
// app/api/projects/[id]/import-calendar/route.ts (itself kept under
// Vercel's ~4.5MB platform request-body cap for Functions).
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const FIELD_LABELS: Record<string, string> = {
  planNumber: "Nº",
  theme: "Tema",
  format: "Formato",
  product: "Produto",
  weekHint: "Data",
  objective: "Objetivo / Pilar",
  artCopy: "Copy da arte",
  copyText: "Legenda e CTA",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportSpreadsheetModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: ImportSpreadsheetModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [entries, setEntries] = useState<ContentPlanEntry[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [aiMappedColumns, setAiMappedColumns] = useState<AiMappedColumn[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const [importedCount, setImportedCount] = useState(0);

  const handleClose = () => {
    if (step === "parsing" || step === "importing") return;
    setStep("pick");
    setEntries([]);
    setExcluded(new Set());
    setWarnings([]);
    setAiMappedColumns([]);
    setErrorMsg("");
    setImportedCount(0);
    onClose();
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg(
        "Arquivo maior que 4MB. Remova imagens/formatação pesada da planilha (ou separe em abas menores) e tente novamente.",
      );
      setStep("error");
      return;
    }

    setStep("parsing");
    setErrorMsg("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/projects/${projectId}/import-calendar`, {
          method: "POST",
          body: formData,
        });

        let data: {
          error?: string;
          entries?: ContentPlanEntry[];
          warnings?: string[];
          aiMappedColumns?: AiMappedColumn[];
        } | null = null;
        try {
          data = await res.json();
        } catch {
          // The platform (or a proxy) rejected the request before our route
          // handler ran — e.g. a body-size limit — so the response body
          // isn't JSON. Fall back to a message based on the HTTP status.
          throw new Error(
            res.status === 413
              ? "Arquivo muito grande para o servidor aceitar. Reduza o tamanho da planilha e tente novamente."
              : `Falha ao ler a planilha (erro ${res.status}).`,
          );
        }
        if (!res.ok) throw new Error(data?.error ?? "Falha ao ler a planilha");

        setEntries(data?.entries ?? []);
        setWarnings(data?.warnings ?? []);
        setAiMappedColumns(data?.aiMappedColumns ?? []);
        setExcluded(new Set());
        setStep("preview");
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Falha ao ler a planilha");
        setStep("error");
      }
    });
  };

  const handleConfirmImport = () => {
    const toImport = entries.filter((_, i) => !excluded.has(i));
    if (toImport.length === 0) return;

    setStep("importing");
    startTransition(async () => {
      try {
        const result = await importContentPlan({
          projectId,
          entries: toImport.map((e) => ({
            planNumber: e.planNumber,
            theme: e.theme,
            format: e.format,
            product: e.product,
            objective: e.objective,
            artCopy: e.artCopy,
            copyText: e.copyText,
          })),
        });
        if (result.error) throw new Error(result.error);
        setImportedCount(result.count ?? toImport.length);
        setStep("done");
        onSuccess();
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Falha ao importar");
        setStep("error");
      }
    });
  };

  const toggleExcluded = (i: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const includedCount = entries.length - excluded.size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar calendário de conteúdo"
      description="Suba a planilha de planejamento (Nº, Tema, Formato, Data, Objetivo/Pilar, Copy da arte, Legenda e CTA), até 4MB. Cada linha entra como um post sem imagem e sem data — você agenda e sobe a arte depois."
      size="xl"
      closeOnOverlayClick={step !== "parsing" && step !== "importing"}
      footer={
        step === "preview" ? (
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={includedCount === 0 || isPending}
              loading={isPending}
              onClick={handleConfirmImport}
            >
              Importar {includedCount} post{includedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        ) : step === "done" ? (
          <Button variant="primary" fullWidth onClick={handleClose}>
            Concluído
          </Button>
        ) : null
      }
    >
      {(step === "pick" || step === "parsing") && (
        <div className="flex flex-col gap-4">
          <label
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-black/30 p-10 cursor-pointer hover:border-black/60 hover:bg-black/[0.02] transition-colors"
          >
            <span className="text-sm font-bold uppercase text-black">
              {step === "parsing" ? "Lendo planilha…" : "Escolher arquivo .xlsx"}
            </span>
            <span className="text-xs text-black/40">
              Aceita várias abas (ex.: uma por mês)
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={step === "parsing"}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
          </label>
        </div>
      )}

      {step === "preview" && (
        <div className="flex flex-col gap-4">
          {warnings.length > 0 && (
            <div className="border-2 border-[#f5a623] bg-[#f5a623]/10 p-3 flex flex-col gap-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-black/70">
                  {w}
                </p>
              ))}
            </div>
          )}

          {aiMappedColumns.length > 0 && (
            <div className="border-2 border-black bg-black/[0.03] p-3 flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase text-black">
                Colunas identificadas por IA — confira antes de importar
              </p>
              {aiMappedColumns.map((m, i) => (
                <p key={i} className="text-xs text-black/70">
                  <span className="font-mono">&quot;{m.header}&quot;</span> →{" "}
                  {FIELD_LABELS[m.mappedTo] ?? m.mappedTo}
                  <span className="text-black/40"> (aba: {m.sheet})</span>
                </p>
              ))}
            </div>
          )}
          <p className="text-xs text-black/50">
            {entries.length} linha{entries.length !== 1 ? "s" : ""} encontrada
            {entries.length !== 1 ? "s" : ""}. Desmarque alguma se não quiser
            importar.
          </p>
          <div className="max-h-[50vh] overflow-y-auto border-2 border-black">
            {entries.map((entry, i) => {
              const isExcluded = excluded.has(i);
              return (
                <div
                  key={`${entry.sheet}-${entry.row}`}
                  className="flex items-start gap-3 p-3 border-b border-black/10 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={!isExcluded}
                    onChange={() => toggleExcluded(i)}
                    className="mt-1 shrink-0"
                  />
                  <div
                    className={
                      isExcluded ? "opacity-40 flex-1 min-w-0" : "flex-1 min-w-0"
                    }
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.planNumber && (
                        <span className="font-mono text-xs font-bold text-white bg-black px-1.5 py-0.5">
                          {entry.planNumber}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-black truncate">
                        {entry.theme || "(sem tema)"}
                      </span>
                      {entry.format && (
                        <Badge variant="default" size="sm">
                          {entry.format}
                        </Badge>
                      )}
                      {entry.product && (
                        <span className="text-xs text-black/40">
                          {entry.product}
                        </span>
                      )}
                      {entry.weekHint && (
                        <span className="text-xs text-black/40">
                          {entry.weekHint}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-black/30 ml-auto">
                        aba: {entry.sheet}
                      </span>
                    </div>
                    {entry.copyText && (
                      <p className="text-xs text-black/60 mt-1 line-clamp-2">
                        {entry.copyText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="flex flex-col items-center gap-4 py-10">
          <p className="text-sm font-medium text-black/60">Importando posts…</p>
        </div>
      )}

      {step === "done" && (
        <div className="flex items-center gap-3 p-4 bg-white border-2 border-black">
          <div className="w-8 h-8 bg-black flex items-center justify-center text-white shrink-0">
            <svg
              width="16"
              height="16"
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
          </div>
          <div>
            <p className="text-sm font-bold text-black">
              {importedCount} post{importedCount !== 1 ? "s" : ""} importado
              {importedCount !== 1 ? "s" : ""}!
            </p>
            <p className="text-xs text-black/50 mt-0.5">
              Agora agende a data e suba a arte de cada um na aba &quot;Sem
              data&quot;.
            </p>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 bg-white border-2 border-[#e10600]">
            <div className="w-8 h-8 bg-[#e10600] flex items-center justify-center text-white shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#e10600]">Falha</p>
              <p className="text-xs text-black/50 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <Button variant="secondary" fullWidth onClick={() => setStep("pick")}>
            Tentar novamente
          </Button>
        </div>
      )}
    </Modal>
  );
}
