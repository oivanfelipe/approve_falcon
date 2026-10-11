"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deleteFile } from "@/lib/supabase/server";

const HEX_COLOR = /^#?[0-9a-fA-F]{6}$/;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  clientName: z.string().min(1).max(100),
  clientEmail: z.string().email().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  clientLogoUrl: z.string().min(1).optional(),
  primaryColor: z.string().regex(HEX_COLOR).optional().or(z.literal("")),
  secondaryColor: z.string().regex(HEX_COLOR).optional().or(z.literal("")),
});

const updateProjectSchema = createProjectSchema.partial();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.ownerId;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createProject(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const userId = await requireAuth();

  const raw = {
    name: formData.get("name"),
    clientName: formData.get("clientName"),
    clientEmail: formData.get("clientEmail") || undefined,
    description: formData.get("description") || undefined,
    clientLogoUrl: formData.get("clientLogoUrl") || undefined,
    primaryColor: formData.get("primaryColor") || undefined,
    secondaryColor: formData.get("secondaryColor") || undefined,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const project = await prisma.project.create({
    data: {
      userId,
      name: parsed.data.name,
      clientName: parsed.data.clientName,
      clientEmail: parsed.data.clientEmail || null,
      description: parsed.data.description || null,
      clientLogoUrl: parsed.data.clientLogoUrl || null,
      primaryColor: parsed.data.primaryColor || null,
      secondaryColor: parsed.data.secondaryColor || null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${project.id}`);
}

export async function updateProject(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const userId = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true, clientLogoUrl: true },
  });
  if (!project) return { error: "Project not found" };

  const raw = {
    name: formData.get("name") ?? undefined,
    clientName: formData.get("clientName") ?? undefined,
    clientEmail: formData.get("clientEmail") ?? undefined,
    description: formData.get("description") ?? undefined,
    clientLogoUrl: formData.get("clientLogoUrl") ?? undefined,
    primaryColor: formData.get("primaryColor") ?? undefined,
    secondaryColor: formData.get("secondaryColor") ?? undefined,
  };

  const parsed = updateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const nextLogoUrl =
    parsed.data.clientLogoUrl !== undefined
      ? parsed.data.clientLogoUrl || null
      : undefined;

  await prisma.project.update({
    where: { id },
    data: {
      ...parsed.data,
      clientEmail: parsed.data.clientEmail || null,
      ...(nextLogoUrl !== undefined ? { clientLogoUrl: nextLogoUrl } : {}),
      ...(parsed.data.primaryColor !== undefined
        ? { primaryColor: parsed.data.primaryColor || null }
        : {}),
      ...(parsed.data.secondaryColor !== undefined
        ? { secondaryColor: parsed.data.secondaryColor || null }
        : {}),
    },
  });

  if (
    nextLogoUrl !== undefined &&
    project.clientLogoUrl &&
    project.clientLogoUrl !== nextLogoUrl
  ) {
    deleteFile(project.clientLogoUrl).catch(() => {});
  }

  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const userId = await requireAuth();

  const project = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true, clientLogoUrl: true },
  });
  if (!project) return { error: "Project not found" };

  // Deliveries cascade via DB FK. Storage files must be cleaned up separately.
  await prisma.project.delete({ where: { id } });

  if (project.clientLogoUrl) {
    deleteFile(project.clientLogoUrl).catch(() => {});
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
