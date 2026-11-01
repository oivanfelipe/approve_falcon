"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Resolves every open client comment on this post and hands it back to the
// client: whatever stage they rejected (copy and/or art) goes back to
// PENDING — the "ok, pode revisar de novo" signal.
export async function markReadyForClientReview(
  deliveryId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, project: { userId: session.user.ownerId } },
    select: {
      id: true,
      projectId: true,
      copyText: true,
      artCopy: true,
      theme: true,
      objective: true,
      postFunction: true,
      status: true,
      copyStatus: true,
      fileName: true,
    },
  });
  if (!delivery) return { error: "Post não encontrado" };

  const hasCopyContent = Boolean(
    delivery.copyText ||
      delivery.artCopy ||
      delivery.theme ||
      delivery.objective ||
      delivery.postFunction,
  );

  // Only reopen what was actually rejected — an approved stage stays approved.
  const reopen: { copyStatus?: "PENDING"; status?: "PENDING" } = {};
  if (hasCopyContent && delivery.copyStatus === "CHANGES_REQUESTED") {
    reopen.copyStatus = "PENDING";
  }
  if (delivery.fileName && delivery.status === "CHANGES_REQUESTED") {
    reopen.status = "PENDING";
  }
  if (Object.keys(reopen).length > 0) {
    await prisma.delivery.update({ where: { id: deliveryId }, data: reopen });
  }

  await prisma.comment.updateMany({
    where: { deliveryId, authorType: "CLIENT", resolvedAt: null },
    data: { resolvedAt: new Date() },
  });

  revalidatePath("/dashboard/comments");
  revalidatePath(`/dashboard/projects/${delivery.projectId}`);
  return {};
}

// Ticks (or un-ticks) one client request in the post's adjustment checklist.
// Deliberately doesn't revalidate the page: the checklist keeps the ticked
// item on screen so it can be un-ticked, and the row refreshes once the
// post is handed back to the client.
export async function setFeedbackDone(
  commentId: string,
  done: boolean,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      authorType: "CLIENT",
      delivery: { project: { userId: session.user.ownerId } },
    },
    select: { id: true },
  });
  if (!comment) return { error: "Comentário não encontrado" };

  await prisma.comment.update({
    where: { id: commentId },
    data: { resolvedAt: done ? new Date() : null },
  });
  return {};
}
