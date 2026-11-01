"use client";

import React, { useState, useTransition } from "react";
import { Check, MessageCircle, Mic, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  markReadyForClientReview,
  setFeedbackDone,
} from "@/features/comments/actions/comments";

export interface FeedbackItem {
  id: string;
  authorName: string;
  content: string;
  hasAudio: boolean;
  hasPin: boolean;
  createdAt: Date | string;
}

// What the client asked to change on a post, as a checklist right inside its
// row: the team ticks each request as it's done and, once everything is
// ticked, hands the post back to the client in one click.
export default function FeedbackChecklist({
  deliveryId,
  items,
  changesRequested,
  onOpenThread,
  onReturned,
}: {
  deliveryId: string;
  items: FeedbackItem[];
  /** The client formally asked for changes (copy or art) — the post is waiting on the team. */
  changesRequested: boolean;
  /** Opens the full thread, for replying or looking at pins and audio. */
  onOpenThread: () => void;
  onReturned: () => void;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [isReturning, startReturning] = useTransition();

  const remaining = items.filter((i) => !done[i.id]).length;
  const allDone = remaining === 0;

  const toggle = async (id: string) => {
    const next = !done[id];
    setDone((prev) => ({ ...prev, [id]: next }));
    setError("");
    const result = await setFeedbackDone(id, next);
    if (result.error) {
      setDone((prev) => ({ ...prev, [id]: !next }));
      setError(result.error);
    }
  };

  const handleReturn = () => {
    setError("");
    startReturning(async () => {
      const result = await markReadyForClientReview(deliveryId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onReturned();
    });
  };

  if (items.length === 0 && !changesRequested) return null;

  return (
    <div className="flex flex-col gap-2 border-2 border-black bg-[#e10600]/[0.04] p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-extrabold uppercase tracking-wide text-black">
          {changesRequested ? "Ajustes pedidos pelo cliente" : "Comentários do cliente"}
          {items.length > 0 && (
            <span className="ml-2 font-mono font-bold text-black/50">
              {items.length - remaining}/{items.length}
            </span>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenThread}
          leftIcon={<MessageCircle className="w-3 h-3" />}
        >
          Ver conversa
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5 list-none">
          {items.map((item) => {
            const checked = Boolean(done[item.id]);
            return (
              <li key={item.id}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-black"
                  />
                  <span
                    className={cn(
                      "text-sm leading-snug text-black",
                      checked && "line-through text-black/40",
                    )}
                  >
                    {item.content || (item.hasAudio ? "Comentário em áudio" : "—")}
                    <span className="ml-2 inline-flex items-center gap-1.5 align-middle text-[11px] text-black/40 no-underline">
                      {item.hasAudio && <Mic className="w-3 h-3" aria-label="áudio" />}
                      {item.hasPin && <MapPin className="w-3 h-3" aria-label="marcado na arte" />}
                      {item.authorName}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-black/60">
          Nenhum item aberto. Se já ajustou, devolva o post ao cliente.
        </p>
      )}

      {changesRequested && (
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={handleReturn}
            loading={isReturning}
            disabled={!allDone}
            leftIcon={<Check className="w-3 h-3" />}
          >
            Devolver ao cliente
          </Button>
          {!allDone && (
            <span className="text-xs text-black/50">
              Faltam {remaining} {remaining === 1 ? "ajuste" : "ajustes"}
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-[#e10600]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
