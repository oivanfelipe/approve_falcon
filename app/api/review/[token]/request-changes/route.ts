import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const requestChangesSchema = z.object({
  signerName: z.string().min(1).max(100),
  note: z.string().max(2000).optional(),
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
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (delivery.expiresAt && delivery.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado" }, { status: 410 });
  }

  if (delivery.status === "APPROVED") {
    return NextResponse.json(
      { error: "Esta versão já foi aprovada e não pode ser modificada." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = requestChangesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  await prisma.delivery.update({
    where: { id: delivery.id },
    data: { status: "CHANGES_REQUESTED" },
  });

  if (parsed.data.note?.trim()) {
    await prisma.comment.create({
      data: {
        deliveryId: delivery.id,
        authorType: "CLIENT",
        authorName: parsed.data.signerName,
        content: parsed.data.note.trim(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}

