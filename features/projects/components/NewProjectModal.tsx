"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createProject } from "@/features/projects/actions/projects";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from "@/lib/freelancer-branding-shared";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
}: NewProjectModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      setError(null);

      if (logoFile) {
        const uploadForm = new FormData();
        uploadForm.set("file", logoFile);
        const res = await fetch("/api/projects/logo", {
          method: "POST",
          body: uploadForm,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Falha ao enviar a logo");
          return;
        }
        formData.set("clientLogoUrl", data.logoUrl);
      }

      const result = await createProject(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success, createProject redirects to /dashboard/projects/[id]
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo projeto"
      description="Crie um novo projeto para começar a enviar arquivos para seu cliente."
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
            form="new-project-form"
            loading={isPending}
          >
            Criar projeto
          </Button>
        </div>
      }
    >
      <form
        id="new-project-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <Input
          name="name"
          label="Nome do projeto"
          placeholder="Identidade visual, Redesign do site…"
          required
          fullWidth
        />
        <Input
          name="clientName"
          label="Nome do cliente"
          placeholder="Empresa Ltda, João Silva…"
          required
          fullWidth
        />
        <Input
          name="clientEmail"
          label="E-mail do cliente (opcional)"
          type="email"
          placeholder="cliente@empresa.com"
          fullWidth
          hint="Usado para notificações de revisão por e-mail"
        />
        <Textarea
          name="description"
          label="Descrição (opcional)"
          placeholder="Notas sobre este projeto…"
          rows={3}
          fullWidth
          resize="none"
        />

        <div className="flex flex-col gap-2 pt-2 border-t border-black/10">
          <label className="text-sm font-semibold text-black">
            Logo do cliente (opcional)
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full border-2 border-black bg-black/[0.03] flex items-center justify-center overflow-hidden">
              {logoFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(logoFile)}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="text-xs text-black/60"
            />
          </div>
          <p className="text-xs text-black/45">
            Usada nos mockups e nas páginas de revisão deste cliente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="color"
            name="primaryColor"
            label="Cor primária"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            fullWidth
          />
          <Input
            type="color"
            name="secondaryColor"
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
