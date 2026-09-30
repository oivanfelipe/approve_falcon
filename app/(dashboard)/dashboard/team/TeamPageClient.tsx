"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  inviteTeamMember,
  revokeInvite,
  updateMemberRole,
  removeMember,
} from "@/features/team/actions/team";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "ADMIN" | "EDITOR";

interface Member {
  id: string;
  role: Role;
  user: { id: string; name: string | null; email: string };
}

interface Invite {
  id: string;
  email: string;
  role: Role;
}

interface TeamPageClientProps {
  owner: { id: string; name: string | null; email: string } | null;
  members: Member[];
  invites: Invite[];
  currentUserId: string;
}

// ─── Role toggle ──────────────────────────────────────────────────────────────

function RoleToggle({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex gap-1 p-1 bg-white border-2 border-black">
      {(["EDITOR", "ADMIN"] as Role[]).map((role) => (
        <button
          key={role}
          type="button"
          disabled={disabled}
          onClick={() => onChange(role)}
          className={cn(
            "px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value === role ? "bg-black text-white" : "text-black/50 hover:text-black",
          )}
        >
          {role === "ADMIN" ? "Admin" : "Editor"}
        </button>
      ))}
    </div>
  );
}

// ─── Invite form ──────────────────────────────────────────────────────────────

function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("EDITOR");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("role", role);
      const result = await inviteTeamMember(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEmail("");
      setRole("EDITOR");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 bg-white border-2 border-black"
    >
      <div className="flex-1">
        <Input
          label="E-mail"
          type="email"
          placeholder="pessoa@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-black/60">Papel</span>
        <RoleToggle value={role} onChange={setRole} />
      </div>
      <Button type="submit" variant="primary" loading={isPending}>
        Convidar
      </Button>
      {error && (
        <p className="text-xs font-medium text-[#e10600] w-full" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs font-medium text-black w-full">
          Convite enviado!
        </p>
      )}
    </form>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isSelf,
}: {
  member: Member;
  isSelf: boolean;
}) {
  const [role, setRole] = useState(member.role);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    startTransition(() => {
      updateMemberRole(member.id, newRole);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removeMember(member.id);
      setConfirmRemove(false);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white border-2 border-black">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black truncate">
          {member.user.name || member.user.email}
          {isSelf && <span className="text-black/40 font-normal"> (você)</span>}
        </p>
        <p className="text-xs text-black/40 truncate">{member.user.email}</p>
      </div>
      <RoleToggle value={role} onChange={handleRoleChange} disabled={isPending} />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmRemove(true)}
        disabled={isPending}
      >
        Remover
      </Button>

      <ConfirmDialog
        open={confirmRemove}
        title="Remover do time?"
        description={`${member.user.name || member.user.email} vai perder o acesso aos projetos imediatamente.`}
        confirmLabel="Remover"
        destructive
        loading={isPending}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}

// ─── Invite row ───────────────────────────────────────────────────────────────

function InviteRow({ invite }: { invite: Invite }) {
  const [revoked, setRevoked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    startTransition(async () => {
      await revokeInvite(invite.id);
      setRevoked(true);
    });
  };

  if (revoked) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-white border-2 border-dashed border-black/30">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black/70 truncate">{invite.email}</p>
        <p className="text-xs text-black/40">Convite pendente</p>
      </div>
      <Badge variant="warning">{invite.role === "ADMIN" ? "Admin" : "Editor"}</Badge>
      <Button variant="ghost" size="sm" loading={isPending} onClick={handleRevoke}>
        Cancelar
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPageClient({
  owner,
  members,
  invites,
  currentUserId,
}: TeamPageClientProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8 bg-white min-h-screen">
      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-black">
          Time
        </h1>
        <p className="text-sm text-black/50 mt-1">
          Administradores podem convidar, remover e mudar o papel de qualquer
          pessoa. Editores têm acesso total aos projetos, mas não gerenciam o
          time.
        </p>
      </div>

      <InviteForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-mono font-bold text-black/40 uppercase tracking-wider">
          Membros
        </h2>
        <div className="flex flex-col gap-2">
          {owner && (
            <div className="flex items-center gap-3 p-4 bg-black/[0.03] border-2 border-black">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {owner.name || owner.email}
                  {owner.id === currentUserId && (
                    <span className="text-black/40 font-normal"> (você)</span>
                  )}
                </p>
                <p className="text-xs text-black/40 truncate">{owner.email}</p>
              </div>
              <Badge variant="default">Dono</Badge>
            </div>
          )}
          {members.map((m) => (
            <MemberRow key={m.id} member={m} isSelf={m.user.id === currentUserId} />
          ))}
        </div>
      </div>

      {invites.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-mono font-bold text-black/40 uppercase tracking-wider">
            Convites pendentes
          </h2>
          <div className="flex flex-col gap-2">
            {invites.map((i) => (
              <InviteRow key={i.id} invite={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
