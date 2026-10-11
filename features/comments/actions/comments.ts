"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Resolves every open client comment on this post and, when it still has
// copy content pending review, puts the copy back to PENDING — the "ok,
// pode revisar de novo" signal for the client.
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

  if (hasCopyContent) {
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: { copyStatus: "PENDING" },
    });
  }

  await prisma.comment.updateMany({
    where: { deliveryId, authorType: "CLIENT", resolvedAt: null },
    data: { resolvedAt: new Date() },
  });

  revalidatePath("/dashboard/comments");
  revalidatePath(`/dashboard/projects/${delivery.projectId}`);
  return {};
}
