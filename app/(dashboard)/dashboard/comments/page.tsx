import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import { loadCommentsInboxData } from "@/features/comments/server/loadCommentsInboxData";
import CommentsInboxClient from "./CommentsInboxClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comentários — Approve",
};

interface PageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function CommentsInboxPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { project } = await searchParams;
  const deliveries = await loadCommentsInboxData(session.user.ownerId);

  const filterProject = project
    ? await prisma.project.findFirst({
        where: { id: project, userId: session.user.ownerId },
        select: { id: true, name: true },
      })
    : null;

  return (
    <CommentsInboxClient
      initialDeliveries={deliveries}
      freelancerName={session.user.name ?? session.user.email ?? "Equipe"}
      initialProjectFilter={filterProject?.id}
      filterProjectName={filterProject?.name}
    />
  );
}
