"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  getBrandTextColor,
  getPublicReviewPath,
  normalizeHexColor,
  normalizeSlug,
  type FreelancerBranding,
} from "@/lib/freelancer-branding-shared";

interface SettingsPageClientProps {
  initialSettings: FreelancerBranding;
  fallbackName: string;
}

export default function SettingsPageClient({
  initialSettings,
  fallbackName,
}: SettingsPageClientProps) {
  const [displayName, setDisplayName] = useState(
    initialSettings.displayName === "Approve Falcon"
      ? fallbackName
      : initialSettings.displayName,
  );
  const [slug, setSlug] = useState(initialSettings.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoPath ?? "");
  const [logoPreview, setLogoPreview] = useState(initialSettings.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(
    initialSettings.primaryColor || DEFAULT_PRIMARY_COLOR,
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialSettings.secondaryColor || DEFAULT_SECONDARY_COLOR,
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [isUploading, startUploading] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sanitizedSlug = useMemo(() => normalizeSlug(slug), [slug]);
  const previewName = displayName.trim() || fallbackName;
  const previewPath = getPublicReviewPath("seu-token", sanitizedSlug);
  const previewPrimary = normalizeHexColor(primaryColor, DEFAULT_PRIMARY_COLOR);
  const previewSecondary = normalizeHexColor(
    secondaryColor,
    DEFAULT_SECONDARY_COLOR,
  );

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;

    startUploading(async () => {
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/freelancer-settings/logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possí­vel enviar a logo.");
        return;
      }

      setLogoUrl(data.logoUrl ?? "");
      setLogoPreview(URL.createObjectURL(file));
    });
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startSaving(async () => {
      setError("");
      setSuccess("");

      const response = await fetch("/api/freelancer-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          logoUrl: logoUrl || null,
          primaryColor,
          secondaryColor,
          slug: sanitizedSlug,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Nãoo foi possí­vel salvar as configurações.");
        return;
      }

      setDisplayName(data.displayName ?? previewName);
      setSlug(data.slug ?? sanitizedSlug);
      setLogoUrl(data.logoPath ?? logoUrl);
      setLogoPreview(data.logoUrl ?? logoPreview);
      setPrimaryColor(data.primaryColor ?? previewPrimary);
      setSecondaryColor(data.secondaryColor ?? previewSecondary);
      setSuccess("Configurações salvas com sucesso.");
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 bg-white min-h-screen">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono font-bold uppercase tracking-[0.24em] text-black/40">
          Configurações
        </p>
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-black">
          Sua identidade no link
        </h1>
        <p className="max-w-2xl text-sm text-black/50">
          Personalize nome exibido, logo, cores e o slug do link público sem
          alterar o fluxo atual dos reviews.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
        <Card variant="elevated" padding="lg">
          <form className="flex flex-col gap-5" onSubmit={handleSave}>
            <Input
              label="Nome exibido"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Dev Studio"
              fullWidth
              required
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-black">
                  Logo
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    className="text-xs font-medium text-black/45 transition-colors hover:text-black"
                    onClick={() => {
                      setLogoUrl("");
                      setLogoPreview(null);
                    }}
                  >
                    Remover logo
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 border-2 border-black bg-white p-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden border-2 border-black bg-white">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Preview da logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-black/35">Sem logo</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-sm text-black/60">
                    PNG, JPG, WEBP ou SVG com até 2 MB.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Enviar logo
                    </Button>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  handleLogoUpload(event.target.files?.[0] ?? null)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-black">
                  Cor primária
                </span>
                <div className="flex items-center gap-3 border-2 border-black bg-white px-3 py-2">
                  <input
                    type="color"
                    value={previewPrimary}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-8 w-8 cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-sm font-mono text-black/75">
                    {previewPrimary}
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-black">
                  Cor secundária
                </span>
                <div className="flex items-center gap-3 border-2 border-black bg-white px-3 py-2">
                  <input
                    type="color"
                    value={previewSecondary}
                    onChange={(event) => setSecondaryColor(event.target.value)}
                    className="h-8 w-8 cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-sm font-mono text-black/75">
                    {previewSecondary}
                  </span>
                </div>
              </label>
              {/* background color picker removed */}
            </div>

            <Input
              label="Slug do link"
              value={slug}
              onChange={(event) => setSlug(normalizeSlug(event.target.value))}
              placeholder="dev-studio"
              fullWidth
              required
              hint="Use apenas letras minúsculas, números e hí­fen."
            />

            <div className="border-2 border-black bg-white p-4">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-black/40">
                Link compartilhado
              </p>
              <p className="mt-2 font-mono text-sm text-black">
                {`seu-dominio.com${previewPath}`}
              </p>
              <p className="mt-2 text-xs text-black/45">
                O formato branded preserva o token da review e usa o seu slug
                como identidade pública.
              </p>
            </div>

            {(error || success) && (
              <p
                className={
                  error
                    ? "text-sm font-medium text-[#e10600]"
                    : "text-sm font-medium text-black"
                }
                role={error ? "alert" : "status"}
              >
                {error || success}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" loading={isSaving}>
                Salvar configurações
              </Button>
            </div>
          </form>
        </Card>

        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className="p-5 bg-black border-b-2 border-black">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.22em] text-white/60">
              Preview em tempo real
            </p>
          </div>
          <div className="flex flex-col gap-6 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden border-2 border-black bg-white">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo da marca"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="text-lg font-extrabold"
                    style={{ color: previewPrimary }}
                  >
                    {previewName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-lg font-extrabold text-black">
                  {previewName}
                </p>
                <p className="text-sm text-black/45">Ambiente do cliente</p>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-black">
                    Homepage redesign
                  </p>
                  <p className="text-xs text-black/40">Cliente: Example Co.</p>
                </div>
                <span
                  className="px-3 py-1 text-xs font-mono font-bold uppercase border-[1.5px] border-black"
                  style={{
                    backgroundColor: previewPrimary,
                    color: getBrandTextColor(previewPrimary),
                  }}
                >
                  Em revisão
                </span>
              </div>

              <div className="mt-4 border-2 border-black p-4">
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-black/40">
                  Decisão de revisão
                </p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    className="px-4 py-3 text-sm font-extrabold uppercase border-2 border-black shadow-[3px_3px_0_0_#000]"
                    style={{
                      backgroundColor: previewPrimary,
                      color: getBrandTextColor(previewPrimary),
                    }}
                  >
                    Aprovar esta versão
                  </button>
                  <button
                    type="button"
                    className="px-4 py-3 text-sm font-extrabold uppercase border-2 bg-white"
                    style={{
                      borderColor: previewSecondary,
                      color: previewSecondary,
                    }}
                  >
                    Solicitar alterações
                  </button>
                </div>
              </div>
            </div>

            <div className="border-2 border-black bg-white p-4">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-black/40">
                Rota branded
              </p>
              <p className="mt-2 text-sm text-black/75">{previewPath}</p>
              <p className="mt-2 text-xs text-black/40">
                Se o slug não existir, o sistema continua aceitando o caminho
                padrão em <code>/review/[token]</code>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
