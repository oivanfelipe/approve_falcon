"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs } from "@/components/ui/Tabs";
import UploadZone from "@/features/deliveries/components/UploadZone";
import {
  updateDeliveryContent,
  getUploadUrl,
  attachCreativeToDelivery,
  addDeliveryAsset,
  deleteDeliveryAsset,
  revokeCopyApproval,
  revokeArtApproval,
  releaseArtForReview,
} from "@/features/deliveries/actions/deliveries";
import { supabaseClient } from "@/lib/supabase/browser";
import { isGoogleDriveUrl } from "@/lib/google-drive";

interface SlideAsset {
  id: string;
  fileName: string | null;
  sourceType: "FILE" | "DRIVE_LINK";
  driveUrl: string | null;
  mimeType: string | null;
}

interface EditableDelivery {
  id: string;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  postFunction: string | null;
  objective: string | null;
  artCopy: string | null;
  copyText: string | null;
  copyStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  /** Art approval status — a separate, later stage from copyStatus. */
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  fileName?: string | null;
  assets?: SlideAsset[];
}

interface EditDeliveryContentModalProps {
  delivery: EditableDelivery;
  /** Needed to upload/manage art and slides — the tab is hidden without it. */
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Opens the modal straight on the art/slides tab (e.g. "Subir arte" entry points). */
  initialTab?: "content" | "art";
}

type UploadSourceMode = "file" | "drive";

// ─── Art & slides tab ───────────────────────────────────────────────────────
// The main art (slide 1) and the extra carousel slides are both just
// "artes" attached to this post — managed together here instead of two
// separate flows.

function ArtAndSlidesTab({
  deliveryId,
  projectId,
  primaryFileName,
  assets,
  artStatus,
  onChanged,
}: {
  deliveryId: string;
  projectId: string;
  primaryFileName: string | null;
  assets: SlideAsset[];
  artStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  onChanged: () => void;
}) {
  const [sourceMode, setSourceMode] = useState<UploadSourceMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState("");

  const handleRevokeApproval = async () => {
    setIsRevoking(true);
    setRevokeError("");
    const result = await revokeArtApproval(deliveryId);
    setIsRevoking(false);
    if (result.error) {
      setRevokeError(result.error);
      return;
    }
    onChanged();
  };

  const handleRelease = async () => {
    setIsReleasing(true);
    setReleaseError("");
    const result = await releaseArtForReview(deliveryId);
    setIsReleasing(false);
    if (result.error) {
      setReleaseError(result.error);
      return;
    }
    onChanged();
  };

  const trimmedDriveUrl = driveUrl.trim();
  const isDriveUrlValid =
    trimmedDriveUrl.length > 0 && isGoogleDriveUrl(trimmedDriveUrl);
  const canSubmit = sourceMode === "file" ? !!selectedFile : isDriveUrlValid;

  const resetAddForm = () => {
    setSelectedFile(null);
    setDriveUrl("");
    setDriveName("");
  };

  // Uploads to whichever slide this is for: slide 1 (the main art) replaces
  // the delivery's own file; any other slide is added to its asset list.
  const handleUpload = (target: "primary" | "extra") => {
    setError("");
    startTransition(async () => {
      try {
        if (sourceMode === "file") {
          if (!selectedFile) return;
          const urlResult = await getUploadUrl(
            selectedFile.name,
            selectedFile.type,
            projectId,
          );
          if ("error" in urlResult) throw new Error(urlResult.error);

          const { error: uploadError } = await supabaseClient.storage
            .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "deliveries")
            .uploadToSignedUrl(urlResult.path, urlResult.token, selectedFile, {
              contentType: selectedFile.type,
            });
          if (uploadError) throw new Error(uploadError.message);

          const result =
            target === "primary"
              ? await attachCreativeToDelivery({
                  deliveryId,
                  sourceType: "FILE",
                  filePath: urlResult.path,
                  fileName: selectedFile.name,
                  fileSize: selectedFile.size,
                  mimeType: selectedFile.type,
                })
              : await addDeliveryAsset({
                  deliveryId,
                  sourceType: "FILE",
                  filePath: urlResult.path,
                  fileName: selectedFile.name,
                  fileSize: selectedFile.size,
                  mimeType: selectedFile.type,
                });
          if (result.error) throw new Error(result.error);
        } else {
          if (!isDriveUrlValid) return;
          const result =
            target === "primary"
              ? await attachCreativeToDelivery({
                  deliveryId,
                  sourceType: "DRIVE_LINK",
                  driveUrl: trimmedDriveUrl,
                  fileName: driveName.trim() || "Criativo do Google Drive",
                })
              : await addDeliveryAsset({
                  deliveryId,
                  sourceType: "DRIVE_LINK",
                  driveUrl: trimmedDriveUrl,
                  fileName: driveName.trim() || "Lâmina do Google Drive",
                });
          if (result.error) throw new Error(result.error);
        }

        resetAddForm();
        onChanged();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao enviar a arte");
      }
    });
  };

  const handleRemove = (assetId: string) => {
    setRemovingId(assetId);
    setError("");
    startTransition(async () => {
      const result = await deleteDeliveryAsset(assetId);
      setRemovingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      onChanged();
    });
  };

  if (artStatus === "APPROVED") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-black/60">
          Esta arte já foi aprovada pelo cliente. Para subir uma nova versão
          ou editar as lâminas, remova a aprovação primeiro.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRevokeApproval}
          loading={isRevoking}
          disabled={isRevoking}
        >
          Remover aprovação da arte
        </Button>
        {revokeError && (
          <p className="text-xs font-medium text-[#e10600]" role="alert">
            {revokeError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {artStatus === "CHANGES_REQUESTED" && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-2 border-[#e10600]/30 bg-[#e10600]/5">
          <p className="text-xs text-black/70">
            O cliente pediu ajustes na arte. Depois de atualizar, libere para
            uma nova revisão.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRelease}
            loading={isReleasing}
            disabled={isReleasing}
          >
            Liberar arte para revisão
          </Button>
        </div>
      )}
      {releaseError && (
        <p className="text-xs font-medium text-[#e10600]" role="alert">
          {releaseError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40">
          Lâminas deste post
        </p>
        <div className="flex items-center justify-between px-3 py-2 border-2 border-black bg-black/[0.03]">
          <span className="text-sm font-semibold text-black truncate">
            1. {primaryFileName ?? "Arte principal (sem arquivo ainda)"}
          </span>
        </div>
        {assets.map((asset, i) => (
          <div
            key={asset.id}
            className="flex items-center justify-between px-3 py-2 border-2 border-black"
          >
            <span className="text-sm text-black truncate">
              {i + 2}. {asset.fileName ?? "Lâmina"}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(asset.id)}
              disabled={isPending && removingId === asset.id}
              className="text-xs font-bold text-black/40 hover:text-[#e10600] transition-colors shrink-0 ml-2 disabled:opacity-50"
            >
              {isPending && removingId === asset.id ? "..." : "Remover"}
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-black/10">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40">
          Enviar arte
        </p>
        <Tabs value={sourceMode} onValueChange={(v) => setSourceMode(v as UploadSourceMode)}>
          <Tabs.List>
            <Tabs.Tab value="file">Enviar arquivo</Tabs.Tab>
            <Tabs.Tab value="drive">Link do Google Drive</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="file" className="mt-3">
            <UploadZone onFileSelect={(f) => setSelectedFile(f)} maxSizeMb={100} />
          </Tabs.Panel>

          <Tabs.Panel value="drive" className="mt-3">
            <div className="flex flex-col gap-3">
              <Input
                label="Link do Google Drive"
                placeholder="https://drive.google.com/file/d/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                error={
                  trimmedDriveUrl.length > 0 && !isDriveUrlValid
                    ? "Cole um link válido do Google Drive."
                    : undefined
                }
              />
              <Input
                label="Nome (opcional)"
                value={driveName}
                onChange={(e) => setDriveName(e.target.value)}
              />
            </div>
          </Tabs.Panel>
        </Tabs>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit || isPending}
            loading={isPending}
            onClick={() => handleUpload("primary")}
          >
            {primaryFileName ? "Substituir arte principal" : "Definir como arte principal"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canSubmit || isPending}
            loading={isPending}
            onClick={() => handleUpload("extra")}
          >
            Adicionar como lâmina
          </Button>
        </div>

        {error && (
          <p className="text-xs font-medium text-[#e10600]" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type ModalTab = "content" | "art";

export default function EditDeliveryContentModal({
  delivery,
  projectId,
  isOpen,
  onClose,
  onSuccess,
  initialTab = "content",
}: EditDeliveryContentModalProps) {
  const [tab, setTab] = useState<ModalTab>(initialTab);
  const [planNumber, setPlanNumber] = useState(delivery.planNumber ?? "");
  const [theme, setTheme] = useState(delivery.theme ?? "");
  const [format, setFormat] = useState(delivery.format ?? "");
  const [product, setProduct] = useState(delivery.product ?? "");
  const [postFunction, setPostFunction] = useState(delivery.postFunction ?? "");
  const [objective, setObjective] = useState(delivery.objective ?? "");
  const [artCopy, setArtCopy] = useState(delivery.artCopy ?? "");
  const [copyText, setCopyText] = useState(delivery.copyText ?? "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [isRevokingCopy, setIsRevokingCopy] = useState(false);
  const [revokeCopyError, setRevokeCopyError] = useState("");
  const copyApproved = delivery.copyStatus === "APPROVED";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");
    const result = await updateDeliveryContent({
      deliveryId: delivery.id,
      planNumber,
      theme,
      format,
      product,
      postFunction,
      objective,
      artCopy,
      copyText,
    });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess();
    onClose();
  };

  const handleRevokeCopyApproval = async () => {
    setIsRevokingCopy(true);
    setRevokeCopyError("");
    const result = await revokeCopyApproval(delivery.id);
    setIsRevokingCopy(false);
    if (result.error) {
      setRevokeCopyError(result.error);
      return;
    }
    onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar post"
      description="Ajuste a copy, o roteiro da arte, a legenda e as lâminas deste post."
      size="lg"
      footer={
        tab === "content" ? (
          copyApproved ? (
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Fechar
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleRevokeCopyApproval}
                loading={isRevokingCopy}
              >
                Remover aprovação da copy
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="edit-delivery-content-form"
                loading={isPending}
              >
                Salvar alterações
              </Button>
            </div>
          )
        ) : (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )
      }
    >
      {projectId && (
        <Tabs value={tab} onValueChange={(v) => setTab(v as ModalTab)}>
          <Tabs.List className="mb-4">
            <Tabs.Tab value="content">Conteúdo</Tabs.Tab>
            <Tabs.Tab value="art">
              Arte e lâminas
              {delivery.assets && delivery.assets.length > 0
                ? ` (${delivery.assets.length + 1})`
                : ""}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}

      {tab === "content" && copyApproved && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-black/60">
            Esta copy já foi aprovada pelo cliente. Para editar, remova a
            aprovação primeiro — o post volta ao fluxo normal de revisão.
          </p>
          {revokeCopyError && (
            <p className="text-xs font-medium text-[#e10600]" role="alert">
              {revokeCopyError}
            </p>
          )}
        </div>
      )}

      {tab === "content" && !copyApproved && (
        <form
          id="edit-delivery-content-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Nº"
              value={planNumber}
              onChange={(e) => setPlanNumber(e.target.value)}
              fullWidth
            />
            <Input
              label="Formato"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Carrossel, Reels…"
              fullWidth
            />
            <Input
              label="Função"
              value={postFunction}
              onChange={(e) => setPostFunction(e.target.value)}
              placeholder="Institucional…"
              fullWidth
            />
            <Input
              label="Produto"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              fullWidth
            />
          </div>

          <Input
            label="Tema"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            fullWidth
          />

          <Textarea
            label="Objetivo / Pilar"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={2}
            fullWidth
            resize="vertical"
          />

          <Textarea
            label="Copy da arte (lâminas)"
            hint='Use "Slide 1:", "Slide 2:"… em linhas separadas por uma linha em branco para cada lâmina.'
            value={artCopy}
            onChange={(e) => setArtCopy(e.target.value)}
            rows={6}
            fullWidth
            resize="vertical"
          />

          <Textarea
            label="Legenda e CTA"
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            rows={6}
            fullWidth
            resize="vertical"
          />

          {error && (
            <p className="text-xs font-medium text-[#e10600]" role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      {tab === "art" && projectId && (
        <ArtAndSlidesTab
          deliveryId={delivery.id}
          projectId={projectId}
          primaryFileName={delivery.fileName ?? null}
          assets={delivery.assets ?? []}
          artStatus={delivery.status}
          onChanged={onSuccess}
        />
      )}
    </Modal>
  );
}
