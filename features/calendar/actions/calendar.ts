"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { generateShareToken } from "@/lib/tokens";

export async function getOrCreateCalendarToken(
  projectId: string,
): Promise<{ token?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.ownerId },
    select: { id: true, calendarToken: true },
  });
  if (!project) return { error: "Projeto não encontrado" };

  if (project.calendarToken) return { token: project.calendarToken };

  const token = generateShareToken();
  await prisma.project.update({
    where: { id: projectId },
    data: { calendarToken: token },
  });

  return { token };
}
