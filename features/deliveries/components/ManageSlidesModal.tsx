"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import UploadZone from "@/features/deliveries/components/UploadZone";
import {
  getUploadUrl,
  addDeliveryAsset,
  deleteDeliveryAsset,
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

interface ManageSlidesModalProps {
  projectId: string;
  deliveryId: string;
  primaryFileName: string | null;
  assets: SlideAsset[];
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

type SourceMode = "file" | "drive";

export default function ManageSlidesModal({
  projectId,
  deliveryId,
  primaryFileName,
  assets,
  isOpen,
  onClose,
  onChanged,
}: ManageSlidesModalProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedDriveUrl = driveUrl.trim();
  const isDriveUrlValid =
    trimmedDriveUrl.length > 0 && isGoogleDriveUrl(trimmedDriveUrl);
  const canSubmit = sourceMode === "file" ? !!selectedFile : isDriveUrlValid;

  const resetAddForm = () => {
    setSelectedFile(null);
    setDriveUrl("");
    setDriveName("");
  };

  const handleAddSlide = () => {
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

          const result = await addDeliveryAsset({
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
          const result = await addDeliveryAsset({
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
        setError(e instanceof Error ? e.message : "Falha ao adicionar lâmina");
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lâminas do carrossel"
      description="Além da arte principal, adicione as demais imagens ou links do carrossel. A ordem aqui é a ordem de exibição."
      size="md"
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40">
            Lâminas atuais
          </p>
          <div className="flex items-center justify-between px-3 py-2 border-2 border-black bg-black/[0.03]">
            <span className="text-sm font-semibold text-black truncate">
              1. {primaryFileName ?? "Arte principal (sem arquivo ainda)"}
            </span>
            <span className="text-[10px] font-mono text-black/35 shrink-0 ml-2">
              editar via &quot;Editar arte&quot;
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
          {assets.length === 0 && (
            <p className="text-xs text-black/40">
              Nenhuma lâmina extra ainda — só a arte principal.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t border-black/10">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-black/40">
            Adicionar lâmina
          </p>
          <Tabs value={sourceMode} onValueChange={(v) => setSourceMode(v as SourceMode)}>
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

          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit || isPending}
            loading={isPending && removingId === null}
            onClick={handleAddSlide}
          >
            Adicionar lâmina
          </Button>

          {error && (
            <p className="text-xs font-medium text-[#e10600]" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
