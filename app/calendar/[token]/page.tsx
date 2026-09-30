import React from "react";
import { notFound } from "next/navigation";
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

  return <CalendarClientShell data={data} />;
}
