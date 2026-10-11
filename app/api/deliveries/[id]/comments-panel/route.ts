import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadDeliveryCommentsPanelData } from "@/features/comments/server/loadCommentsInboxData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const delivery = await loadDeliveryCommentsPanelData(
    id,
    session.user.ownerId,
  );
  if (!delivery) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  return NextResponse.json(delivery);
}
