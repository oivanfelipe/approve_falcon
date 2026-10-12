"use client";

import React, { useState, useTransition } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CommentSystem from "@/features/review/components/CommentSystem";
import EditDeliveryContentModal from "@/features/deliveries/components/EditDeliveryContentModal";
import { markReadyForClientReview } from "@/features/comments/actions/comments";
import { formatScheduledDate } from "@/features/calendar/lib/monthGrid";
import type { CommentInboxDelivery } from "@/features/comments/server/loadCommentsInboxData";

// The comment thread + "edit copy" + "liberar para o cliente" flow for one
// post. Shared between the Comments Inbox (grouped by client) and the
// per-post modal opened straight from the project page.
export default function DeliveryCommentsPanel({
  delivery,
  freelancerName,
  onChanged,
}: {
  delivery: CommentInboxDelivery;
  freelancerName: string;
  onChanged: () => void;
}) {
  const [editingOpen, setEditingOpen] = useState(false);
  const [isMarking, startMarking] = useTransition();
  const [markError, setMarkError] = useState("");

  const handleMarkReady = () => {
    setMarkError("");
    startMarking(async () => {
      const result = await markReadyForClientReview(delivery.id);
      if (result.error) {
        setMarkError(result.error);
        return;
      }
      onChanged();
    });
  };

  return (
    <div className="flex flex-col">
      {delivery.scheduledAt && (
        <div className="flex items-center gap-1.5 pt-2 text-xs font-semibold text-black/50">
          <Calendar className="w-3.5 h-3.5" />
          Publicação prevista:{" "}
          {formatScheduledDate(new Date(delivery.scheduledAt), "pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
      )}

      <div className="py-2">
        <CommentSystem
          token={delivery.reviewToken}
          deliveryId={delivery.id}
          initialComments={delivery.comments}
          mode="freelancer"
          freelancerName={freelancerName}
        />
      </div>

      <div className="flex items-center gap-2 pt-4 border-t-2 border-black/10 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setEditingOpen(true)}>
          Editar copy completa
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleMarkReady}
          loading={isMarking}
          disabled={delivery.pendingCount === 0}
        >
          Pronto — liberar para o cliente revisar
        </Button>
        {markError && (
          <span className="text-[11px] font-medium text-[#e10600]">
            {markError}
          </span>
        )}
      </div>

      {editingOpen && (
        <EditDeliveryContentModal
          delivery={delivery}
          isOpen
          onClose={() => setEditingOpen(false)}
          onSuccess={onChanged}
        />
      )}
    </div>
  );
}
