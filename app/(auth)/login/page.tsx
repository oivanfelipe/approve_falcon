"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { registerUser } from "@/features/auth/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import FalconMark from "@/components/ui/FalconMark";
import { cn } from "@/lib/utils";

// ─── Tab helpers ──────────────────────────────────────────────────────────────

type Tab = "signin" | "register";

// ─── Sign in form ─────────────────────────────────────────────────────────────

function SignInForm({ next, email }: { next?: string; email?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha inválidos");
      } else {
        const target = next ?? new URLSearchParams(window.location.search).get("next");
        window.location.href = target ?? "/dashboard";
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="email"
        label="E-mail"
        type="email"
        placeholder="voce@exemplo.com"
        autoComplete="email"
        defaultValue={email}
        required
        fullWidth
      />
      <Input
        name="password"
        label="Senha"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        fullWidth
      />
      {error && (
        <p className="text-xs font-medium text-[#e10600]" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isPending}
        className="mt-1"
      >
        Entrar
      </Button>
    </form>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ next, email }: { next?: string; email?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      if (next) formData.set("next", next);
      const result = await registerUser(formData);
      if (result?.error) {
        setError(result.error);
      }
      // registerUser will redirect on success based on `next`
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input
        name="name"
        label="Nome completo"
        placeholder="Maria Silva"
        autoComplete="name"
        required
        fullWidth
      />
      <Input
        name="email"
        label="E-mail"
        type="email"
        placeholder="voce@exemplo.com"
        autoComplete="email"
        defaultValue={email}
        required
        fullWidth
      />
      <Input
        name="password"
        label="Senha"
        type="password"
        placeholder="Mín. 8 caracteres"
        autoComplete="new-password"
        required
        fullWidth
        hint="Pelo menos 8 caracteres"
      />
      {error && (
        <p className="text-xs font-medium text-[#e10600]" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isPending}
        className="mt-1"
      >
        Criar conta
      </Button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const next = searchParams.get("next") ?? undefined;
  const email = searchParams.get("email") ?? undefined;

  return (
    <div className="w-full max-w-sm flex flex-col gap-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 justify-center">
        <FalconMark size={26} className="shrink-0 text-[#e10600]" />
        <span className="text-lg font-extrabold uppercase tracking-tight text-black">
          Approve
        </span>
      </Link>

      {/* Card */}
      <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_#000] p-7">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border-2 border-black mb-6">
          {(["signin", "register"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e10600]/50",
                activeTab === tab
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black",
              )}
            >
              {tab === "signin" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {activeTab === "signin" ? (
          <SignInForm next={next} email={email} />
        ) : (
          <RegisterForm next={next} email={email} />
        )}
      </div>
    </div>
  );
}
