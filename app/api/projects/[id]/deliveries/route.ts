import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.ownerId },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const deliveries = await prisma.delivery.findMany({
    where: { projectId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      versionNumber: true,
      label: true,
      scheduledAt: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      sourceType: true,
      status: true,
      reviewToken: true,
      createdAt: true,
      planNumber: true,
      theme: true,
      format: true,
      product: true,
      objective: true,
      postFunction: true,
      copyStatus: true,
      copyText: true,
      artCopy: true,
      _count: {
        select: { comments: true, views: true },
      },
      views: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const result = deliveries.map((d) => ({
    id: d.id,
    versionNumber: d.versionNumber,
    label: d.label,
    scheduledAt: d.scheduledAt,
    fileName: d.fileName,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    sourceType: d.sourceType,
    status: d.status,
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
    copyStatus: d.copyStatus,
    copyText: d.copyText,
    artCopy: d.artCopy,
  }));

  return NextResponse.json(result);
}
