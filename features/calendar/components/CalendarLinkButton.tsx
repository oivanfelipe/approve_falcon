"use client";

import React, { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { getOrCreateCalendarToken } from "@/features/calendar/actions/calendar";

interface CalendarLinkButtonProps {
  projectId: string;
  initialToken?: string | null;
}

export default function CalendarLinkButton({
  projectId,
  initialToken,
}: CalendarLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(initialToken ?? null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const url = token ? `${window.location.origin}/calendar/${token}` : "";

  const handleGenerate = () => {
    setError("");
    startTransition(async () => {
      const result = await getOrCreateCalendarToken(projectId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setToken(result.token ?? null);
    });
  };

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="1" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        }
      >
        Calendário
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Link do calendário"
        description="Um único link para o cliente ver todas as peças com data de publicação marcada, aprovar ou pedir alterações direto no dia."
        size="md"
      >
        {token ? (
          <div className="flex flex-col gap-3">
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
            <p className="text-xs text-black/50">
              Só aparecem no calendário as peças que tiverem uma data de
              publicação definida no envio.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-black/60">
              Gere um link único de calendário para este projeto.
            </p>
            {error && (
              <p className="text-xs font-medium text-[#e10600]" role="alert">
                {error}
              </p>
            )}
            <Button
              variant="primary"
              fullWidth
              loading={isPending}
              onClick={handleGenerate}
            >
              Gerar link de calendário
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
