import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  _request: NextRequest,
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

  await prisma.delivery.update({
    where: { id: delivery.id },
    data: { status: "CHANGES_REQUESTED" },
  });

  return NextResponse.json({ ok: true });
}

