"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@/auth";
import { generateSecureToken } from "@/lib/tokens";
import { sendTeamInviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" as const };
  if (session.user.role !== "ADMIN") {
    return { error: "Only admins can manage the team" as const };
  }
  return { session };
}

export async function listTeam() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const ownerId = session.user.ownerId;

  const [owner, members, invites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, name: true, email: true },
    }),
    prisma.teamMembership.findMany({
      where: { ownerId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.teamInvite.findMany({
      where: { ownerId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    owner,
    members,
    invites,
    currentRole: session.user.role,
    currentUserId: session.user.id,
  };
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR"]),
});

export async function inviteTeamMember(
  formData: FormData,
): Promise<{ error?: string }> {
  const check = await requireAdmin();
  if ("error" in check) return check;
  const { session } = check;

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, role } = parsed.data;
  const ownerId = session.user.ownerId;

  if (email.toLowerCase() === session.user.email?.toLowerCase()) {
    return { error: "You can't invite yourself" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    if (existingUser.id === ownerId) {
      return { error: "This person already owns this account" };
    }
    const existingMembership = await prisma.teamMembership.findFirst({
      where: { ownerId, userId: existingUser.id },
      select: { id: true },
    });
    if (existingMembership) return { error: "This person is already on your team" };
  }

  const token = generateSecureToken();

  await prisma.teamInvite.upsert({
    where: { ownerId_email: { ownerId, email } },
    create: { ownerId, email, role, token },
    update: { role, token, status: "PENDING", createdAt: new Date() },
  });

  const inviter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  sendTeamInviteEmail({
    to: email,
    inviterName: inviter?.name || inviter?.email || "Sua agência",
    role,
    token,
  }).catch(console.error);

  revalidatePath("/dashboard/team");
  return {};
}

export async function revokeInvite(inviteId: string): Promise<{ error?: string }> {
  const check = await requireAdmin();
  if ("error" in check) return check;

  await prisma.teamInvite.deleteMany({
    where: { id: inviteId, ownerId: check.session.user.ownerId },
  });

  revalidatePath("/dashboard/team");
  return {};
}

export async function updateMemberRole(
  membershipId: string,
  role: "ADMIN" | "EDITOR",
): Promise<{ error?: string }> {
  const check = await requireAdmin();
  if ("error" in check) return check;

  await prisma.teamMembership.updateMany({
    where: { id: membershipId, ownerId: check.session.user.ownerId },
    data: { role },
  });

  revalidatePath("/dashboard/team");
  return {};
}

export async function removeMember(membershipId: string): Promise<{ error?: string }> {
  const check = await requireAdmin();
  if ("error" in check) return check;

  await prisma.teamMembership.deleteMany({
    where: { id: membershipId, ownerId: check.session.user.ownerId },
  });

  revalidatePath("/dashboard/team");
  return {};
}
