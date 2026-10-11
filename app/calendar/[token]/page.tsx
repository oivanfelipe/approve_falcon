import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { loadCalendarPageData } from "@/features/calendar/server/loadCalendarPageData";
import CalendarClientShell from "@/features/calendar/components/CalendarClientShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendário de conteúdo — Approve Falcon",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CalendarPage({ params }: PageProps) {
  const { token } = await params;
  const data = await loadCalendarPageData(token);

  if (!data) notFound();

  const session = await auth();
  // Logged-in member of the agency that owns this calendar — gets edit and
  // comment capabilities directly on the client's own link.
  const isTeamMember = Boolean(
    session?.user?.ownerId && data.project.userId === session.user.ownerId,
  );
  const freelancerName = isTeamMember
    ? (session?.user?.name ?? session?.user?.email ?? "Equipe")
    : null;

  return (
    <CalendarClientShell
      data={data}
      isTeamMember={isTeamMember}
      freelancerName={freelancerName}
    />
  );
}
