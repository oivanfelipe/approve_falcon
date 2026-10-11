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
      copyStatus: true,
      expiresAt: true,
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (delivery.expiresAt && delivery.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado" }, { status: 410 });
  }

  if (delivery.copyStatus === "APPROVED") {
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

  await prisma.delivery.update({
    where: { id: delivery.id },
    data: { copyStatus: "APPROVED" },
  });

  return NextResponse.json({ ok: true });
}
