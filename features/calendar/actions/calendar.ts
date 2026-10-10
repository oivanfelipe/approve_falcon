"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { generateReviewToken } from "@/lib/tokens";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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

const contentPlanEntrySchema = z.object({
  planNumber: z.string().max(50).nullable().optional(),
  theme: z.string().max(300).nullable().optional(),
  format: z.string().max(100).nullable().optional(),
  product: z.string().max(100).nullable().optional(),
  objective: z.string().max(5000).nullable().optional(),
  postFunction: z.string().max(300).nullable().optional(),
  artCopy: z.string().max(5000).nullable().optional(),
  copyText: z.string().max(5000).nullable().optional(),
  // ISO yyyy-mm-dd — only set when the spreadsheet had a real calendar date
  // (not a fuzzy week hint), so the post can go straight onto the calendar.
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const importContentPlanSchema = z.object({
  projectId: z.string().cuid(),
  entries: z.array(contentPlanEntrySchema).min(1).max(500),
});

export async function importContentPlan(
  raw: unknown,
): Promise<{ count?: number; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = importContentPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { projectId, entries } = parsed.data;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.ownerId },
    select: { id: true, _count: { select: { deliveries: true } } },
  });
  if (!project) return { error: "Project not found" };

  let nextVersion = project._count.deliveries + 1;

  await prisma.delivery.createMany({
    data: entries.map((entry) => ({
      projectId,
      versionNumber: nextVersion++,
      label: entry.theme || null,
      planNumber: entry.planNumber || null,
      theme: entry.theme || null,
      format: entry.format || null,
      product: entry.product || null,
      objective: entry.objective || null,
      postFunction: entry.postFunction || null,
      artCopy: entry.artCopy || null,
      copyText: entry.copyText || null,
      copyStatus: "PENDING",
      scheduledAt: entry.scheduledDate ? new Date(entry.scheduledDate) : null,
      sourceType: "FILE",
      fileName: null,
      reviewToken: generateReviewToken(),
    })),
  });

  revalidatePath(`/dashboard/projects/${projectId}`);

  return { count: entries.length };
}
