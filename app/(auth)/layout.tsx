import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Approve Falcon",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {children}
    </div>
  );
}
