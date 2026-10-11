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
    copyText: z.string().max(2000).optional(),
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
    where: { id: projectId, userId: session.user.ownerId },
    select: { id: true },
  });
  if (!project) return { error: "Project not found" };

  const ext = fileName.split(".").pop() ?? "bin";
  const ts = Date.now();
  const path = `${session.user.ownerId}/${projectId}/${ts}.${ext}`;

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
    copyText,
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
    where: { id: projectId, userId: session.user.ownerId },
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
      copyText: copyText || null,
      // No copy to review → skip straight to the creative stage.
      copyStatus: copyText ? "PENDING" : "APPROVED",
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
    const branding = await getFreelancerBrandingByUserId(session.user.ownerId);
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
    where: { id: deliveryId, project: { userId: session.user.ownerId } },
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

const attachCreativeSchema = z
  .object({
    deliveryId: z.string().cuid(),
    sourceType: z.enum(["FILE", "DRIVE_LINK"]).default("FILE"),
    filePath: z.string().min(1).optional(),
    fileName: z.string().min(1),
    fileSize: z.coerce.number().int().positive().optional(),
    mimeType: z.string().min(1).optional(),
    driveUrl: z.string().url().max(2000).optional(),
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

export async function attachCreativeToDelivery(
  raw: Record<string, unknown>,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = attachCreativeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const {
    deliveryId,
    sourceType,
    filePath,
    fileName,
    fileSize,
    mimeType,
    driveUrl,
  } = parsed.data;

  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, project: { userId: session.user.ownerId } },
    select: { id: true, projectId: true, status: true },
  });
  if (!delivery) return { error: "Delivery not found" };

  try {
    assertDeliveryNotApproved(delivery);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Delivery bloqueada" };
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      sourceType,
      filePath: sourceType === "FILE" ? filePath : null,
      fileName,
      fileSize: sourceType === "FILE" ? fileSize : null,
      mimeType: sourceType === "FILE" ? mimeType : null,
      driveUrl: sourceType === "DRIVE_LINK" ? driveUrl : null,
    },
  });

  revalidatePath(`/dashboard/projects/${delivery.projectId}`);
  return {};
}

const updateDeliveryContentSchema = z.object({
  deliveryId: z.string().cuid(),
  planNumber: z.string().max(50).optional(),
  theme: z.string().max(300).optional(),
  format: z.string().max(100).optional(),
  product: z.string().max(100).optional(),
  postFunction: z.string().max(300).optional(),
  objective: z.string().max(5000).optional(),
  artCopy: z.string().max(5000).optional(),
  copyText: z.string().max(5000).optional(),
});

export async function updateDeliveryContent(
  raw: Record<string, unknown>,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateDeliveryContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const delivery = await prisma.delivery.findFirst({
    where: { id: parsed.data.deliveryId, project: { userId: session.user.ownerId } },
    select: { id: true, projectId: true, status: true },
  });
  if (!delivery) return { error: "Delivery not found" };

  try {
    assertDeliveryNotApproved(delivery);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Delivery bloqueada" };
  }

  const { deliveryId, ...fields } = parsed.data;
  const toNullable = (v?: string) => (v && v.trim() ? v.trim() : null);

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      planNumber: toNullable(fields.planNumber),
      theme: toNullable(fields.theme),
      format: toNullable(fields.format),
      product: toNullable(fields.product),
      postFunction: toNullable(fields.postFunction),
      objective: toNullable(fields.objective),
      artCopy: toNullable(fields.artCopy),
      copyText: toNullable(fields.copyText),
      // Content changed — the client needs to review it again, whatever the
      // previous copyStatus was (already approved or changes requested).
      copyStatus: "PENDING",
    },
  });

  revalidatePath(`/dashboard/projects/${delivery.projectId}`);
  return {};
}

const scheduleDeliverySchema = z.object({
  deliveryId: z.string().cuid(),
  scheduledAt: z.string().min(1),
});

export async function scheduleDelivery(
  raw: Record<string, unknown>,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = scheduleDeliverySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const delivery = await prisma.delivery.findFirst({
    where: { id: parsed.data.deliveryId, project: { userId: session.user.ownerId } },
    select: { id: true, projectId: true },
  });
  if (!delivery) return { error: "Delivery not found" };

  await prisma.delivery.update({
    where: { id: delivery.id },
    data: { scheduledAt: new Date(parsed.data.scheduledAt) },
  });

  revalidatePath(`/dashboard/projects/${delivery.projectId}`);
  return {};
}

