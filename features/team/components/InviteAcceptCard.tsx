"use client";

import React, { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { acceptInvite } from "@/features/team/actions/invite";

interface InviteAcceptCardProps {
  token: string;
  role: "ADMIN" | "EDITOR";
}

export default function InviteAcceptCard({ token, role }: InviteAcceptCardProps) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    setError("");
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-black/70">
          Convite aceito! Entre novamente pra carregar os projetos do time.
        </p>
        <Button
          variant="primary"
          fullWidth
          onClick={() => signOut({ redirectTo: "/login?next=/dashboard" })}
        >
          Entrar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-black/60">
        Papel: <span className="font-bold text-black">{role === "ADMIN" ? "Administrador" : "Editor"}</span>
      </p>
      {error && (
        <p className="text-xs font-medium text-[#e10600]" role="alert">
          {error}
        </p>
      )}
      <Button variant="primary" fullWidth loading={isPending} onClick={handleAccept}>
        Aceitar convite
      </Button>
    </div>
  );
}
