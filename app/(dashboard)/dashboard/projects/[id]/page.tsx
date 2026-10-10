import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import ProjectDetailPageClient from "@/app/(dashboard)/dashboard/projects/[id]/ProjectDetailPageClient";
import { getFreelancerBrandingByUserId } from "@/lib/freelancer-branding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projeto — Approve Falcon",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.ownerId },
    include: {
      deliveries: {
        orderBy: { versionNumber: "desc" },
        include: {
          _count: { select: { comments: true, views: true } },
          views: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const branding = await getFreelancerBrandingByUserId(session.user.ownerId);

  const deliveries = project.deliveries.map((d) => ({
    id: d.id,
    versionNumber: d.versionNumber,
    label: d.label,
    scheduledAt: d.scheduledAt,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    sourceType: d.sourceType as "FILE" | "DRIVE_LINK",
    status: d.status as "PENDING" | "APPROVED" | "CHANGES_REQUESTED",
    reviewToken: d.reviewToken,
    commentCount: d._count.comments,
    viewCount: d._count.views,
    createdAt: d.createdAt,
    lastViewedAt: d.views[0]?.createdAt ?? null,
    planNumber: d.planNumber,
    theme: d.theme,
    format: d.format,
    product: d.product,
    objective: d.objective,
    postFunction: d.postFunction,
    copyStatus: d.copyStatus as "PENDING" | "APPROVED" | "CHANGES_REQUESTED",
    copyText: d.copyText,
  }));

  return (
    <ProjectDetailPageClient
      projectId={id}
      projectName={project.name}
      clientName={project.clientName}
      clientEmail={project.clientEmail}
      deliveries={deliveries}
      freelancerSlug={branding.slug}
      calendarToken={project.calendarToken}
    />
  );
}
