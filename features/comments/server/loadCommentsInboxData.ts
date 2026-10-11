import { prisma } from "@/lib/prisma/client";
import type { CommentData } from "@/features/review/components/CommentSystem";

export interface CommentInboxDelivery {
  id: string;
  reviewToken: string;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  postFunction: string | null;
  objective: string | null;
  artCopy: string | null;
  copyText: string | null;
  label: string | null;
  versionNumber: number;
  scheduledAt: Date | null;
  copyStatus: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  projectId: string;
  projectName: string;
  clientName: string;
  pendingCount: number;
  lastCommentAt: string | null;
  comments: CommentData[];
}

const deliverySelect = {
  id: true,
  reviewToken: true,
  planNumber: true,
  theme: true,
  format: true,
  product: true,
  postFunction: true,
  objective: true,
  artCopy: true,
  copyText: true,
  label: true,
  versionNumber: true,
  scheduledAt: true,
  copyStatus: true,
  status: true,
  project: { select: { id: true, name: true, clientName: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      parentId: true,
      authorType: true,
      authorName: true,
      content: true,
      audioUrl: true,
      xPosition: true,
      yPosition: true,
      resolvedAt: true,
      createdAt: true,
    },
  },
};

type RawDelivery = {
  id: string;
  reviewToken: string;
  planNumber: string | null;
  theme: string | null;
  format: string | null;
  product: string | null;
  postFunction: string | null;
  objective: string | null;
  artCopy: string | null;
  copyText: string | null;
  label: string | null;
  versionNumber: number;
  scheduledAt: Date | null;
  copyStatus: string;
  status: string;
  project: { id: string; name: string; clientName: string };
  comments: {
    id: string;
    parentId: string | null;
    authorType: string;
    authorName: string;
    content: string;
    audioUrl: string | null;
    xPosition: number | null;
    yPosition: number | null;
    resolvedAt: Date | null;
    createdAt: Date;
  }[];
};

function mapDelivery(d: RawDelivery): CommentInboxDelivery {
  const clientComments = d.comments.filter((c) => c.authorType === "CLIENT");
  const pendingCount = clientComments.filter((c) => !c.resolvedAt).length;
  const lastComment = d.comments[d.comments.length - 1] ?? null;

  return {
    id: d.id,
    reviewToken: d.reviewToken,
    planNumber: d.planNumber,
    theme: d.theme,
    format: d.format,
    product: d.product,
    postFunction: d.postFunction,
    objective: d.objective,
    artCopy: d.artCopy,
    copyText: d.copyText,
    label: d.label,
    versionNumber: d.versionNumber,
    scheduledAt: d.scheduledAt,
    copyStatus: d.copyStatus as "PENDING" | "APPROVED" | "CHANGES_REQUESTED",
    status: d.status as "PENDING" | "APPROVED" | "CHANGES_REQUESTED",
    projectId: d.project.id,
    projectName: d.project.name,
    clientName: d.project.clientName,
    pendingCount,
    lastCommentAt: lastComment ? lastComment.createdAt.toISOString() : null,
    comments: d.comments.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      authorType: c.authorType as "CLIENT" | "FREELANCER",
      authorName: c.authorName,
      content: c.content,
      audioUrl: c.audioUrl,
      xPosition: c.xPosition,
      yPosition: c.yPosition,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

// Every post that has at least one comment from the CLIENT — the inbox the
// operational team checks instead of relying on the "something in the
// copy" email notification.
export async function loadCommentsInboxData(
  ownerId: string,
): Promise<CommentInboxDelivery[]> {
  const deliveries = await prisma.delivery.findMany({
    where: {
      project: { userId: ownerId },
      comments: { some: { authorType: "CLIENT" } },
    },
    select: deliverySelect,
  });

  const result = deliveries.map(mapDelivery);

  result.sort((a, b) => {
    if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
    if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
    return (
      new Date(b.lastCommentAt ?? 0).getTime() -
      new Date(a.lastCommentAt ?? 0).getTime()
    );
  });

  return result;
}

// Same shape as the inbox list, but for a single post — used to open the
// comments/edit panel directly from the project page, regardless of
// whether it has any comments yet.
export async function loadDeliveryCommentsPanelData(
  deliveryId: string,
  ownerId: string,
): Promise<CommentInboxDelivery | null> {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, project: { userId: ownerId } },
    select: deliverySelect,
  });

  return delivery ? mapDelivery(delivery) : null;
}

export async function countPendingClientComments(
  ownerId: string,
): Promise<number> {
  return prisma.delivery.count({
    where: {
      project: { userId: ownerId },
      comments: { some: { authorType: "CLIENT", resolvedAt: null } },
    },
  });
}
