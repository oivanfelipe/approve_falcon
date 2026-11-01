"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs } from "@/components/ui/Tabs";
import UploadZone from "@/features/deliveries/components/UploadZone";
import {
  getUploadUrl,
  createDelivery,
  splitArtCopyIntoSlides,
} from "@/features/deliveries/actions/deliveries";
import { supabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { isGoogleDriveUrl } from "@/lib/google-drive";
import { isCaptionRequired } from "@/lib/caption-rules";
import { getOrCreateCalendarToken } from "@/features/calendar/actions/calendar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewDeliveryModalProps {
  projectId: string;
  projectSlug?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reviewToken: string) => void;
  initialScheduledAt?: string;
}

type Step = "upload" | "uploading" | "done" | "error";
type SourceMode = "file" | "drive";

// ─── Link copy toast ──────────────────────────────────────────────────────────

function ReviewLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-black/60">
        Este é o link do mês do cliente — o mesmo de sempre. O post novo já está nele, na fila de aprovação.
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
  isOpen,
  onClose,
  onSuccess,
  initialScheduledAt,
}: NewDeliveryModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [label, setLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt ?? "");
  const [copyText, setCopyText] = useState("");
  const [planNumber, setPlanNumber] = useState("");
  const [theme, setTheme] = useState("");
  const [format, setFormat] = useState("");
  const [product, setProduct] = useState("");
  const [postFunction, setPostFunction] = useState("");
  const [objective, setObjective] = useState("");
  const [artCopy, setArtCopy] = useState("");

  useEffect(() => {
    if (isOpen) setScheduledAt(initialScheduledAt ?? "");
  }, [isOpen, initialScheduledAt]);
  const [password, setPassword] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [calendarUrl, setCalendarUrl] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitNote, setSplitNote] = useState("");

  const trimmedDriveUrl = driveUrl.trim();
  const isDriveUrlValid = trimmedDriveUrl.length > 0 && isGoogleDriveUrl(trimmedDriveUrl);
  const hasCreative = sourceMode === "file" ? !!selectedFile : isDriveUrlValid;
  // Art without a caption leaves the client with half a post to approve.
  const captionRequired = hasCreative && isCaptionRequired(format);
  const missingCaption = captionRequired && copyText.trim().length === 0;
  const canSubmit = hasCreative
    ? !missingCaption
    : theme.trim().length > 0 ||
      planNumber.trim().length > 0 ||
      copyText.trim().length > 0;

  const handleSplitSlides = async () => {
    setIsSplitting(true);
    setSplitNote("");
    const result = await splitArtCopyIntoSlides(artCopy);
    setIsSplitting(false);
    if (result.error || !result.text) {
      setSplitNote(result.error ?? "Não consegui separar o texto.");
      return;
    }
    setArtCopy(result.text);
    setSplitNote(
      result.method === "ai"
        ? "Separado pela IA. Confira antes de salvar — as palavras não foram alteradas."
        : "Separado por parágrafos (a IA não está disponível agora). Confira antes de salvar.",
    );
  };

  // After saving, hand over the client's month link (not a per-post link).
  const loadCalendarUrl = async () => {
    const r = await getOrCreateCalendarToken(projectId);
    if (r.token) setCalendarUrl(`${window.location.origin}/calendar/${r.token}`);
  };

  const handleClose = () => {
    if (step === "uploading") return; // prevent close while uploading
    setStep("upload");
    setSourceMode("file");
    setSelectedFile(null);
    setDriveUrl("");
    setDriveName("");
    setLabel("");
    setScheduledAt("");
    setCopyText("");
    setPlanNumber("");
    setTheme("");
    setFormat("");
    setProduct("");
    setPostFunction("");
    setObjective("");
    setArtCopy("");
    setPassword("");
    setAllowDownload(true);
    setErrorMsg("");
    setProgress(0);
    setSplitNote("");
    setCalendarUrl("");
    onClose();
  };

  const planningFields = () => ({
    label: label.trim() || undefined,
    scheduledAt: scheduledAt || undefined,
    copyText: copyText.trim() || undefined,
    planNumber: planNumber.trim() || undefined,
    theme: theme.trim() || undefined,
    format: format.trim() || undefined,
    product: product.trim() || undefined,
    postFunction: postFunction.trim() || undefined,
    objective: objective.trim() || undefined,
    artCopy: artCopy.trim() || undefined,
    allowDownload,
    password: password.trim() || undefined,
  });

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

        // 3) Create the delivery record
        const result = await createDelivery({
          projectId,
          ...planningFields(),
          sourceType: "FILE",
          filePath: urlResult.path,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
        });
        if (result.error) throw new Error(result.error);
        const token = result.reviewToken ?? "";

        setProgress(100);
        setStep("done");
        onSuccess(token);
        void loadCalendarUrl();
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
          ...planningFields(),
          sourceType: "DRIVE_LINK",
          driveUrl: trimmedDriveUrl,
          fileName:
            driveName.trim() ||
            label.trim() ||
            theme.trim() ||
            "Criativo do Google Drive",
        });
        if (result.error) throw new Error(result.error);
        const token = result.reviewToken ?? "";

        setProgress(100);
        setStep("done");
        onSuccess(token);
        void loadCalendarUrl();
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Falha ao salvar o link");
        setStep("error");
      }
    });
  };

  // No file selected and no Drive link pasted — save just the plan (same
  // fields a spreadsheet row would carry). The art is attached later.
  const handleCreatePlanOnly = () => {
    startTransition(async () => {
      setStep("uploading");
      setProgress(50);

      try {
        const result = await createDelivery({
          projectId,
          ...planningFields(),
        });
        if (result.error) throw new Error(result.error);
        const token = result.reviewToken ?? "";

        setProgress(100);
        setStep("done");
        onSuccess(token);
        void loadCalendarUrl();
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Falha ao salvar");
        setStep("error");
      }
    });
  };

  const handleSubmit = () => {
    if (sourceMode === "file" && selectedFile) handleUploadFile();
    else if (sourceMode === "drive" && isDriveUrlValid) handleSubmitDriveLink();
    else handleCreatePlanOnly();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo post"
      description="Suba a arte e cole a legenda — o cliente aprova os dois juntos, como o post vai aparecer. Só o planejamento? Preencha o tema e salve; a arte entra depois."
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
              {hasCreative ? "Enviar e obter link" : "Salvar post"}
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
        <div className="flex flex-col gap-6">
          {/* 1 — Tema: how the team recognises this post in the list */}
          <Input
            label="Tema do post"
            placeholder="Ex.: 5 erros ao contratar…"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            fullWidth
          />

          <Input
            label="Formato"
            placeholder="Reels, Carrossel, Estático, Stories…"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            fullWidth
          />

          {/* 2 — Arte */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
              1 · Arte
            </h3>
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
                  />
                </div>
              </Tabs.Panel>
            </Tabs>
            <p className="text-xs text-black/50">
              Carrossel? Salve o post e adicione as outras lâminas em
              Editar → Arte e lâminas.
            </p>
          </section>

          {/* 3 — Legenda (required once there is art) */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
              2 · Legenda e CTA{" "}
              {captionRequired && <span className="text-[#e10600]">*</span>}
            </h3>
            <Textarea
              aria-label="Legenda e CTA"
              placeholder="O texto que vai junto com o post. O cliente lê e aprova aqui, ao lado da arte."
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              rows={5}
              fullWidth
              resize="vertical"
              error={
                missingCaption
                  ? "Falta a legenda. Sem ela o cliente só aprovaria metade do post."
                  : undefined
              }
            />
          </section>

          {/* 4 — Data */}
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">
              3 · Quando publica
            </h3>
            <Input
              type="date"
              aria-label="Data de publicação"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              hint="Opcional. O post entra no calendário e na fila de aprovação desse dia."
            />
          </section>

          {/* Everything else, out of the way */}
          <details className="group border-2 border-black/15">
            <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 hover:bg-black/5">
              Planejamento do post (opcional)
            </summary>
            <div className="flex flex-col gap-5 p-4 border-t-2 border-black/15">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Nº"
                  value={planNumber}
                  onChange={(e) => setPlanNumber(e.target.value)}
                  fullWidth
                />
                <Input
                  label="Função"
                  placeholder="Institucional…"
                  value={postFunction}
                  onChange={(e) => setPostFunction(e.target.value)}
                  fullWidth
                />
                <Input
                  label="Produto"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  fullWidth
                />
              </div>

              <Textarea
                label="Objetivo / Pilar"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={2}
                fullWidth
                resize="vertical"
              />

              <div className="flex flex-col gap-2">
                <Textarea
                  label="Texto da arte (para o designer)"
                  hint="Cole o texto corrido e use o botão para separar em lâminas."
                  value={artCopy}
                  onChange={(e) => setArtCopy(e.target.value)}
                  rows={5}
                  fullWidth
                  resize="vertical"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSplitSlides}
                    loading={isSplitting}
                    disabled={!artCopy.trim() || isSplitting}
                  >
                    Separar em lâminas
                  </Button>
                  {splitNote && (
                    <p className="text-xs text-black/60 flex-1 min-w-48">
                      {splitNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </details>

          <details className="group border-2 border-black/15">
            <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold uppercase tracking-wider text-black/70 hover:bg-black/5">
              Opções do link
            </summary>
            <div className="flex flex-col gap-5 p-4 border-t-2 border-black/15">
              <Input
                label="Rótulo da versão"
                placeholder="Ex.: Ajustes de cor, Versão final…"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                hint="Exibido no histórico de versões do cliente"
              />

              <Input
                type="password"
                label="Senha do link"
                placeholder="Deixar em branco para sem senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="O cliente deve inserir esta senha para ver o post"
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
                      allowDownload
                        ? "translate-x-4 bg-white"
                        : "translate-x-0 bg-black",
                    )}
                  />
                </button>
              </label>
            </div>
          </details>
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
                Post salvo
              </p>
            </div>
          </div>
          {calendarUrl ? (
            <ReviewLinkBox url={calendarUrl} />
          ) : (
            <p className="text-xs text-black/50">Gerando o link do mês…</p>
          )}
          {!scheduledAt && (
            <p className="text-xs font-semibold text-[#b45309]">
              Sem data de publicação o post não aparece no calendário do
              cliente. Defina a data em Edição.
            </p>
          )}
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


