"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProject } from "@/features/projects/actions/projects";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from "@/lib/freelancer-branding-shared";

interface EditProjectBrandingModalProps {
  projectId: string;
  currentLogoUrl: string | null; // signed URL for preview, if any
  currentPrimaryColor: string | null;
  currentSecondaryColor: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProjectBrandingModal({
  projectId,
  currentLogoUrl,
  currentPrimaryColor,
  currentSecondaryColor,
  isOpen,
  onClose,
  onSuccess,
}: EditProjectBrandingModalProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(
    currentPrimaryColor ?? DEFAULT_PRIMARY_COLOR,
  );
  const [secondaryColor, setSecondaryColor] = useState(
    currentSecondaryColor ?? DEFAULT_SECONDARY_COLOR,
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        let clientLogoUrl: string | undefined;

        if (logoFile) {
          const uploadForm = new FormData();
          uploadForm.set("file", logoFile);
          const res = await fetch("/api/projects/logo", {
            method: "POST",
            body: uploadForm,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Falha ao enviar a logo");
          clientLogoUrl = data.logoUrl;
        } else if (removeLogo) {
          clientLogoUrl = "";
        }

        const formData = new FormData();
        if (clientLogoUrl !== undefined) {
          formData.set("clientLogoUrl", clientLogoUrl);
        }
        formData.set("primaryColor", primaryColor);
        formData.set("secondaryColor", secondaryColor);

        const result = await updateProject(projectId, formData);
        if (result?.error) throw new Error(result.error);

        onSuccess();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao salvar a marca");
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Marca do cliente"
      description="A logo e as cores do cliente são usadas nos mockups e nas páginas de revisão deste projeto."
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form="edit-project-branding-form"
            loading={isPending}
          >
            Salvar
          </Button>
        </div>
      }
    >
      <form
        id="edit-project-branding-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-black">
            Logo do cliente
          </label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-full border-2 border-black bg-black/[0.03] flex items-center justify-center overflow-hidden">
              {logoFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(logoFile)}
                  alt="Nova logo"
                  className="w-full h-full object-cover"
                />
              ) : currentLogoUrl && !removeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentLogoUrl}
                  alt="Logo atual"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setLogoFile(e.target.files?.[0] ?? null);
                setRemoveLogo(false);
              }}
              className="text-xs text-black/60"
            />
          </div>
          {currentLogoUrl && !logoFile && (
            <button
              type="button"
              onClick={() => setRemoveLogo((v) => !v)}
              className="text-xs font-semibold text-black/40 hover:text-[#e10600] transition-colors self-start"
            >
              {removeLogo ? "Manter logo atual" : "Remover logo"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="color"
            label="Cor primária"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            fullWidth
          />
          <Input
            type="color"
            label="Cor secundária"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            fullWidth
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-[#e10600]" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
