"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Projetos",
    href: "/dashboard",
    // Active on the main dashboard page OR inside any /dashboard/projects/* sub-route
    isActive: (p) => p === "/dashboard" || p.startsWith("/dashboard/projects"),
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Configurações",
    href: "/dashboard/settings",
    isActive: (p) => p.startsWith("/dashboard/settings"),
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.63.82 1 1.51 1H21a2 2 0 010 4h-.09c-.69 0-1.31.37-1.51 1z" />
      </svg>
    ),
  },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function SidebarLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-5">
      <Image
        src="/logo.png"
        alt=""
        width={28}
        height={28}
        className="shrink-0"
      />
      <span className="text-sm font-extrabold uppercase tracking-tight">
        <span className="text-white">Approve</span>
        <span className="text-[#e10600]">Falcon</span>
      </span>
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-black">
      <SidebarLogo />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2" aria-label="Dashboard navigation">
        <ul className="flex flex-col gap-0.5 list-none" role="list">
          {navItems.map(({ label, href, isActive: checkActive, icon }) => {
            const active = checkActive(pathname);

            return (
              <li key={label}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-150",
                    "border-l-[3px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e10600]/60",
                    active
                      ? "bg-white/10 text-white border-l-[#e10600]"
                      : "text-white/55 border-l-transparent hover:text-white hover:bg-white/[0.06]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "shrink-0 transition-colors",
                      active ? "text-[#e10600]" : "text-white/40",
                    )}
                  >
                    {icon}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + sign out */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white/[0.04]">
          <div className="w-7 h-7 shrink-0 flex items-center justify-center text-[11px] font-extrabold text-black bg-white">
            {userName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {userName ?? "User"}
            </p>
            <p className="text-[10px] text-white/40 truncate">
              {userEmail ?? ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "shrink-0 p-1.5 text-white/40 hover:text-white",
              "hover:bg-white/10 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e10600]/60",
            )}
            aria-label="Sign out"
            title="Sign out"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
