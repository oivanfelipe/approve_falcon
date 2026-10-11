"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import DeliveryCommentsPanel from "@/features/comments/components/DeliveryCommentsPanel";
import type { CommentInboxDelivery } from "@/features/comments/server/loadCommentsInboxData";

// Opens the same comment-thread + edit-copy + "liberar para o cliente" flow
// as the Comments Inbox, but scoped to one post and triggered right from
// its row on the project page — no need to go to a separate screen.
export default function DeliveryCommentsModal({
  deliveryId,
  isOpen,
  onClose,
  freelancerName,
  onChanged,
}: {
  deliveryId: string;
  isOpen: boolean;
  onClose: () => void;
  freelancerName: string;
  onChanged: () => void;
}) {
  const [delivery, setDelivery] = useState<CommentInboxDelivery | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/comments-panel`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível carregar os comentários");
        return;
      }
      setDelivery(await res.json());
    } catch {
      setError("Não foi possível carregar os comentários");
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const handleChanged = () => {
    load();
    onChanged();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={delivery?.theme ?? delivery?.label ?? "Comentários do post"}
      description={delivery?.clientName}
    >
      {loading && (
        <p className="text-sm text-black/50 py-6 text-center">Carregando…</p>
      )}
      {!loading && error && (
        <p className="text-sm text-[#e10600] py-6 text-center">{error}</p>
      )}
      {!loading && !error && delivery && (
        <DeliveryCommentsPanel
          delivery={delivery}
          freelancerName={freelancerName}
          onChanged={handleChanged}
        />
      )}
    </Modal>
  );
}
