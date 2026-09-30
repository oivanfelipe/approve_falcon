"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";

export async function getInviteByToken(token: string) {
  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { owner: { select: { name: true, email: true } } },
  });
  if (!invite) return null;
  if (invite.status !== "PENDING") return null;
  if (invite.expiresAt && invite.expiresAt < new Date()) return null;
  return invite;
}

export async function acceptInvite(token: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "Not authenticated" };
  }

  const invite = await getInviteByToken(token);
  if (!invite) return { error: "This invite is invalid or has expired" };

  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { error: "This invite was sent to a different email address" };
  }

  await prisma.$transaction([
    prisma.teamMembership.upsert({
      where: {
        ownerId_userId: { ownerId: invite.ownerId, userId: session.user.id },
      },
      create: { ownerId: invite.ownerId, userId: session.user.id, role: invite.role },
      update: { role: invite.role },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return {};
}
