import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import FalconMark from "@/components/ui/FalconMark";

export const metadata: Metadata = {
  title: "404 — Page Not Found · Approve Falcon",
  description: "The page you were looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="border-b-2 border-black">
        <Container>
          <div className="h-16 flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline-none"
              aria-label="Approve Falcon home"
            >
              <FalconMark size={22} className="shrink-0 text-[#e10600]" />
              <span className="text-sm font-extrabold uppercase tracking-tight">
                <span className="text-black">Approve</span>
                <span className="text-[#e10600]">Falcon</span>
              </span>
            </Link>
          </div>
        </Container>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center">
        <Container>
          <div className="flex flex-col items-center text-center gap-8 py-24">
            {/* 404 number */}
            <span className="text-[10rem] sm:text-[14rem] font-extrabold leading-none tracking-tighter text-black select-none">
              404
            </span>

            {/* Text */}
            <div className="flex flex-col items-center gap-4 -mt-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-black tracking-tight">
                Page not found
              </h1>
              <p className="text-base text-black/50 max-w-sm leading-relaxed">
                The page you&apos;re looking for doesn&apos;t exist or was
                moved. Let&apos;s get you back on track.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" href="/dashboard">
                Go to dashboard
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
