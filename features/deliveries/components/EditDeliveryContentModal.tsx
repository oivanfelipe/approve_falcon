"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateDeliveryContent } from "@/features/deliveries/actions/deliveries";

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
}

interface EditDeliveryContentModalProps {
  delivery: EditableDelivery;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDeliveryContentModal({
  delivery,
  isOpen,
  onClose,
  onSuccess,
}: EditDeliveryContentModalProps) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar post"
      description={
        delivery.copyStatus === "APPROVED"
          ? "Esta copy já foi aprovada pelo cliente — salvar aqui volta o status para pendente, e o cliente verá a versão atualizada."
          : "Ajuste a copy, o roteiro da arte (lâminas) ou a legenda deste post."
      }
      size="lg"
      footer={
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
      }
    >
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
    </Modal>
  );
}
