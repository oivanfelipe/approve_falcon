import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import { parseContentPlanSpreadsheet } from "@/features/calendar/server/parseContentPlanSpreadsheet";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.ownerId },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo maior que 10MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await parseContentPlanSpreadsheet(buffer);
    if (result.entries.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma linha reconhecida na planilha." },
        { status: 400 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Não foi possível ler a planilha: ${err.message}`
            : "Não foi possível ler a planilha.",
      },
      { status: 400 },
    );
  }
}
