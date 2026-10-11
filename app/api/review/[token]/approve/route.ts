import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const approveSchema = z.object({
  signerName: z.string().min(1).max(100),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      reviewToken: true,
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (delivery.expiresAt && delivery.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado" }, { status: 410 });
  }

  if (delivery.status === "APPROVED") {
    return NextResponse.json({ error: "Já aprovado" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: "APPROVED" },
    }),
    prisma.approval.upsert({
      where: { deliveryId: delivery.id },
      create: {
        deliveryId: delivery.id,
        signerName: parsed.data.signerName,
        ipAddress: ip,
      },
      update: {
        signerName: parsed.data.signerName,
        ipAddress: ip,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
