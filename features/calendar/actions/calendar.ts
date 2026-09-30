"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { generateReviewToken } from "@/lib/tokens";

export async function getOrCreateCalendarToken(
  projectId: string,
): Promise<{ token?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.ownerId },
    select: { id: true, calendarToken: true },
  });
  if (!project) return { error: "Project not found" };

  if (project.calendarToken) return { token: project.calendarToken };

  const token = generateReviewToken();
  await prisma.project.update({
    where: { id: projectId },
    data: { calendarToken: token },
  });

  return { token };
}
