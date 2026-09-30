import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { getInviteByToken } from "@/features/team/actions/invite";
import InviteAcceptCard from "@/features/team/components/InviteAcceptCard";
import FalconMark from "@/components/ui/FalconMark";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convite de time — Approve Falcon",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <Link href="/" className="flex items-center gap-2.5 justify-center">
          <FalconMark size={26} className="shrink-0 text-[#e10600]" />
          <span className="text-lg font-extrabold uppercase tracking-tight">
            <span className="text-black">Approve</span>
            <span className="text-[#e10600]">Falcon</span>
          </span>
        </Link>
        <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_#000] p-7 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const [invite, session] = await Promise.all([getInviteByToken(token), auth()]);

  if (!invite) {
    return (
      <Card>
        <h1 className="text-lg font-extrabold uppercase text-black">
          Convite inválido
        </h1>
        <p className="text-sm text-black/60">
          Esse link de convite não existe mais, já foi usado ou expirou. Peça
          pra quem te convidou enviar um novo.
        </p>
      </Card>
    );
  }

  const inviterName = invite.owner.name || invite.owner.email;

  if (!session?.user?.email) {
    return (
      <Card>
        <h1 className="text-lg font-extrabold uppercase text-black">
          Você foi convidado!
        </h1>
        <p className="text-sm text-black/60">
          <span className="font-semibold text-black">{inviterName}</span>{" "}
          convidou você pra entrar no time no Approve Falcon como{" "}
          <span className="font-semibold text-black">
            {invite.role === "ADMIN" ? "Administrador" : "Editor"}
          </span>
          .
        </p>
        <p className="text-xs text-black/40">
          Entre ou crie uma conta usando o e-mail{" "}
          <span className="font-mono">{invite.email}</span> pra continuar.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invite.email)}`}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold uppercase bg-black text-white hover:bg-black/85 transition-colors"
        >
          Entrar ou criar conta
        </Link>
      </Card>
    );
  }

  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <Card>
        <h1 className="text-lg font-extrabold uppercase text-black">
          E-mail diferente
        </h1>
        <p className="text-sm text-black/60">
          Você está logado como{" "}
          <span className="font-mono">{session.user.email}</span>, mas este
          convite foi enviado para{" "}
          <span className="font-mono">{invite.email}</span>.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(invite.email)}`}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-bold uppercase bg-white border-2 border-black text-black hover:bg-black/5 transition-colors"
        >
          Sair e entrar com outra conta
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-lg font-extrabold uppercase text-black">
        Você foi convidado!
      </h1>
      <p className="text-sm text-black/60">
        <span className="font-semibold text-black">{inviterName}</span>{" "}
        convidou você pra entrar no time no Approve Falcon.
      </p>
      <InviteAcceptCard token={token} role={invite.role} />
    </Card>
  );
}
