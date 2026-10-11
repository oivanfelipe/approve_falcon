import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadCommentsInboxData } from "@/features/comments/server/loadCommentsInboxData";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const deliveries = await loadCommentsInboxData(session.user.ownerId);
  return NextResponse.json(deliveries);
}
