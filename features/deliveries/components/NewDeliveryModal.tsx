"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import UploadZone from "@/features/deliveries/components/UploadZone";
import {
  getUploadUrl,
  createDelivery,
} from "@/features/deliveries/actions/deliveries";
import { supabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { getPublicReviewPath } from "@/lib/freelancer-branding-shared";
import { isGoogleDriveUrl } from "@/lib/google-drive";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewDeliveryModalProps {
  projectId: string;
  freelancerSlug?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reviewToken: string) => void;
}

type Step = "upload" | "uploading" | "done" | "error";
type SourceMode = "file" | "drive";

// ─── Link copy toast ──────────────────────────────────────────────────────────

function ReviewLinkBox({
  token,
  slug,
}: {
  token: string;
  slug?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${getPublicReviewPath(token, slug)}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-black/60">
        Compartilhe este link com seu cliente. Sem necessidade de conta.
      </p>
      <div className="flex items-center gap-2 p-3 bg-white border-2 border-black">
        <span className="flex-1 text-xs text-black font-mono truncate">
          {url}
        </span>
        <button
          onClick={copy}
          className={cn(
            "shrink-0 px-3 py-1.5 text-xs font-bold uppercase border-2 border-black transition-colors duration-150",
            copied ? "bg-black text-white" : "bg-white text-black hover:bg-black/5",
          )}
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewDeliveryModal({
  projectId,
  freelancerSlug,
  isOpen,
  onClose,
  onSuccess,
}: NewDeliveryModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [label, setLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [password, setPassword] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [reviewToken, setReviewToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  const trimmedDriveUrl = driveUrl.trim();
  const isDriveUrlValid = trimmedDriveUrl.length > 0 && isGoogleDriveUrl(trimmedDriveUrl);
  const canSubmit =
    sourceMode === "file" ? !!selectedFile : isDriveUrlValid;

  const handleClose = () => {
    if (step === "uploading") return; // prevent close while uploading
    setStep("upload");
    setSourceMode("file");
    setSelectedFile(null);
    setDriveUrl("");
    setDriveName("");
    setLabel("");
    setScheduledAt("");
    setPassword("");
    setAllowDownload(true);
    setReviewToken("");
    setErrorMsg("");
    setProgress(0);
    onClose();
  };

  const handleUploadFile = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      setStep("uploading");
      setProgress(10);

      try {
        // 1) Get presigned upload URL from server
        const urlResult = await getUploadUrl(
          selectedFile.name,
          selectedFile.type,
          projectId,
        );

        if ("error" in urlResult) throw new Error(urlResult.error);

        setProgress(30);

        // 2) Upload directly to Supabase from the browser
        const { error: uploadError } = await supabaseClient.storage
          .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "deliveries")
          .uploadToSignedUrl(urlResult.path, urlResult.token, selectedFile, {
            contentType: selectedFile.type,
          });

        if (uploadError) throw new Error(uploadError.message);

        setProgress(75);

        // 3) Create delivery record
        const result = await createDelivery({
          projectId,
          label: label.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
          sourceType: "FILE",
          filePath: urlResult.path,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          allowDownload,
          password: password.trim() || undefined,
        });

        if (result.error) throw new Error(result.error);

        setProgress(100);
        setReviewToken(result.reviewToken!);
        setStep("done");
        onSuccess(result.reviewToken!);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Falha no envio");
        setStep("error");
      }
    });
  };

  const handleSubmitDriveLink = () => {
    if (!isDriveUrlValid) return;

    startTransition(async () => {
      setStep("uploading");
      setProgress(50);

      try {
        const result = await createDelivery({
          projectId,
          label: label.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
          sourceType: "DRIVE_LINK",
          driveUrl: trimmedDriveUrl,
          fileName: driveName.trim() || label.trim() || "Criativo do Google Drive",
          allowDownload,
          password: password.trim() || undefined,
        });

        if (result.error) throw new Error(result.error);

        setProgress(100);
        setReviewToken(result.reviewToken!);
        setStep("done");
        onSuccess(result.reviewToken!);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Falha ao salvar o link");
        setStep("error");
      }
    });
  };

  const handleSubmit = () => {
    if (sourceMode === "file") handleUploadFile();
    else handleSubmitDriveLink();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar nova versão"
      description="Envie um arquivo ou cole o link de um criativo no Google Drive para gerar um link de revisão seguro para o cliente."
      size="md"
      closeOnOverlayClick={step !== "uploading"}
      footer={
        step === "upload" ? (
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!canSubmit || isPending}
              loading={isPending}
              onClick={handleSubmit}
            >
              Enviar e obter link
            </Button>
          </div>
        ) : step === "done" ? (
          <Button variant="primary" fullWidth onClick={handleClose}>
            Concluído
          </Button>
        ) : null
      }
    >
      {/* ── Upload form ───────────────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="flex flex-col gap-5">
          <Tabs
            value={sourceMode}
            onValueChange={(v) => setSourceMode(v as SourceMode)}
          >
            <Tabs.List>
              <Tabs.Tab value="file">Enviar arquivo</Tabs.Tab>
              <Tabs.Tab value="drive">Link do Google Drive</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="file" className="mt-4">
              <UploadZone
                onFileSelect={(f) => setSelectedFile(f)}
                maxSizeMb={100}
              />
            </Tabs.Panel>

            <Tabs.Panel value="drive" className="mt-4">
              <div className="flex flex-col gap-4">
                <Input
                  label="Link do Google Drive"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  error={
                    trimmedDriveUrl.length > 0 && !isDriveUrlValid
                      ? "Cole um link válido do Google Drive (arquivo, pasta, Doc, Sheet ou Slide)."
                      : undefined
                  }
                  hint="No Drive, clique em Compartilhar e defina como “Qualquer pessoa com o link” pode visualizar."
                />
                <Input
                  label="Nome do criativo (opcional)"
                  placeholder="Ex.: Feed 1080x1080 - Campanha Setembro"
                  value={driveName}
                  onChange={(e) => setDriveName(e.target.value)}
                  hint="Exibido para o cliente como o nome do arquivo"
                />
              </div>
            </Tabs.Panel>
          </Tabs>

          <Input
            label="Rótulo da versão (opcional)"
            placeholder="Ex.: Ajustes de cor, Versão final…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            hint="Exibido no histórico de versões do cliente"
          />

          <Input
            type="date"
            label="Data de publicação (opcional)"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            hint="Se preenchida, esta peça aparece no link de calendário do projeto"
          />

          <Input
            type="password"
            label="Senha do link (opcional)"
            placeholder="Deixar em branco para sem senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="O cliente deve inserir esta senha para ver o arquivo"
          />

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-black/70">
              Permitir download pelo cliente
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={allowDownload}
              onClick={() => setAllowDownload((v) => !v)}
              className={cn(
                "relative w-10 h-5.5 border-2 border-black transition-colors duration-150",
                allowDownload ? "bg-[#e10600]" : "bg-white",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 border border-black transition-transform duration-150",
                  allowDownload ? "translate-x-4 bg-white" : "translate-x-0 bg-black",
                )}
              />
            </button>
          </label>
        </div>
      )}

      {/* ── Uploading ─────────────────────────────────────────────────────── */}
      {step === "uploading" && (
        <div className="flex flex-col items-center gap-5 py-6">
          <div className="relative w-16 h-16">
            <svg
              className="animate-spin w-16 h-16 text-black/15"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <svg
              className="absolute inset-0 w-16 h-16 -rotate-90 text-[#e10600]"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                strokeLinecap="square"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-black">
              {progress}%
            </span>
          </div>
          <p className="text-sm font-medium text-black/60">
            {sourceMode === "drive" ? "Salvando link…" : "Enviando seu arquivo…"}
          </p>
        </div>
      )}

      {/* ── Done ──────────────────────────────────────────────────────────── */}
      {step === "done" && (
        <div className="flex flex-col gap-5">
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
              <p className="text-sm font-bold text-black">Envio concluído!</p>
              <p className="text-xs text-black/50 mt-0.5">
                Seu link de revisão está pronto
              </p>
            </div>
          </div>
          <ReviewLinkBox token={reviewToken} slug={freelancerSlug} />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
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
              <p className="text-sm font-bold text-[#e10600]">Falha no envio</p>
              <p className="text-xs text-black/50 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setStep("upload");
              setErrorMsg("");
            }}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </Modal>
  );
}


