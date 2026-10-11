"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import FalconMark from "@/components/ui/FalconMark";

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
    label: "Time",
    href: "/dashboard/team",
    isActive: (p) => p.startsWith("/dashboard/team"),
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
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function SidebarLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-5">
      <FalconMark size={22} className="shrink-0 text-[#e10600]" />
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
  isAdmin?: boolean;
}

export default function Sidebar({ userName, userEmail, isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const visibleNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => item.href !== "/dashboard/team");

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full bg-black">
      <SidebarLogo />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2" aria-label="Dashboard navigation">
        <ul className="flex flex-col gap-0.5 list-none" role="list">
          {visibleNavItems.map(({ label, href, isActive: checkActive, icon }) => {
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
