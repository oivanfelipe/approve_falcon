"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { getSignedUploadUrl, deleteFile } from "@/lib/supabase/server";
import { generateReviewToken } from "@/lib/tokens";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendNewReviewEmail } from "@/lib/email";
import { getFreelancerBrandingByUserId } from "@/lib/freelancer-branding";
import { isGoogleDriveUrl } from "@/lib/google-drive";

function detectLocale(acceptLanguage: string | null): "pt" | "en" {
  if (!acceptLanguage) return "pt";
  const primary = acceptLanguage.split(",")[0]?.toLowerCase() ?? "";
  return primary.startsWith("pt") ? "pt" : "en";
}

function assertDeliveryNotApproved(delivery: { status: string }) {
  if (delivery.status === "APPROVED") {
    throw new Error("Esta versão já foi aprovada e não pode ser modificada.");
  }
}

const createDeliverySchema = z
  .object({
    projectId: z.string().cuid(),
    label: z.string().max(100).optional(),
    scheduledAt: z.string().optional(),
    sourceType: z.enum(["FILE", "DRIVE_LINK"]).default("FILE"),
    filePath: z.string().min(1).optional(),
    fileName: z.string().min(1),
    fileSize: z.coerce.number().int().positive().optional(),
    mimeType: z.string().min(1).optional(),
    driveUrl: z.string().url().max(2000).optional(),
    allowDownload: z.coerce.boolean().default(true),
    requiresEmail: z.coerce.boolean().default(false),
    expiresInDays: z.coerce.number().int().min(0).max(365).optional(),
    password: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === "DRIVE_LINK") {
      if (!data.driveUrl || !isGoogleDriveUrl(data.driveUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cole um link válido do Google Drive.",
          path: ["driveUrl"],
        });
      }
      return;
    }

    if (!data.filePath || !data.fileSize || !data.mimeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Arquivo inválido.",
        path: ["filePath"],
      });
    }
  });

export async function getUploadUrl(
  fileName: string,
  contentType: string,
  projectId: string,
): Promise<
  | { signedUrl: string; token: string; path: string; error?: never }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const ext = fileName.split(".").pop() ?? "bin";
  const ts = Date.now();
  const path = `${session.user.id}/${projectId}/${ts}.${ext}`;

  try {
    const data = await getSignedUploadUrl(path);
    return { signedUrl: data.signedUrl, token: data.token, path: data.path };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload URL error" };
  }
}

export async function createDelivery(
  raw: Record<string, unknown>,
): Promise<{ reviewToken?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const requestHeaders = await headers();
  const locale = detectLocale(requestHeaders.get("accept-language"));
  prisma.user
    .update({ where: { id: session.user.id }, data: { locale } })
    .catch(() => {});

  const parsed = createDeliverySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    projectId,
    label,
    scheduledAt,
    sourceType,
    filePath,
    fileName,
    fileSize,
    mimeType,
    driveUrl,
    allowDownload,
    requiresEmail,
    expiresInDays,
    password,
  } = parsed.data;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      clientName: true,
      clientEmail: true,
      _count: { select: { deliveries: true } },
    },
  });
  if (!project) return { error: "Project not found" };

  const versionNumber = project._count.deliveries + 1;
  const reviewToken = generateReviewToken();
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  let expiresAt: Date | null = null;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  await prisma.delivery.create({
    data: {
      projectId,
      versionNumber,
      label: label || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      sourceType,
      filePath: sourceType === "FILE" ? filePath : null,
      fileName,
      fileSize: sourceType === "FILE" ? fileSize : null,
      mimeType: sourceType === "FILE" ? mimeType : null,
      driveUrl: sourceType === "DRIVE_LINK" ? driveUrl : null,
      reviewToken,
      allowDownload,
      requiresEmail,
      expiresAt,
      password: passwordHash,
    },
  });

  if (project.clientEmail) {
    const branding = await getFreelancerBrandingByUserId(session.user.id);
    sendNewReviewEmail({
      to: project.clientEmail,
      projectName: project.name,
      clientName: project.clientName,
      reviewToken,
      versionNumber,
      label: label || null,
      freelancerSlug: branding.slug,
      locale,
    }).catch(console.error);
  }

  return { reviewToken };
}

export async function deleteDelivery(
  deliveryId: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, project: { userId: session.user.id } },
    select: {
      id: true,
      filePath: true,
      sourceType: true,
      projectId: true,
      status: true,
    },
  });
  if (!delivery) return { error: "Delivery not found" };

  try {
    assertDeliveryNotApproved(delivery);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Delivery bloqueada" };
  }

  if (delivery.sourceType === "FILE" && delivery.filePath) {
    await deleteFile(delivery.filePath).catch(console.error);
  }
  await prisma.delivery.delete({ where: { id: deliveryId } });

  revalidatePath(`/dashboard/projects/${delivery.projectId}`);
  return {};
}

