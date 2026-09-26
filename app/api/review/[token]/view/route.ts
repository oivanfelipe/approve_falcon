import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSignedUrl } from "@/lib/supabase/server";

// Records a view and returns data needed by the review page (signed URL, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      filePath: true,
      sourceType: true,
      driveUrl: true,
      allowDownload: true,
      expiresAt: true,
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (delivery.expiresAt && delivery.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  // Record view (fire and forget)
  prisma.view
    .create({
      data: { deliveryId: delivery.id, ipAddress: ip, userAgent },
    })
    .catch(console.error);

  // Generate a fresh signed URL — Drive-link deliveries have no storage file
  const signedUrl =
    delivery.sourceType === "DRIVE_LINK" || !delivery.filePath
      ? null
      : await getSignedUrl(delivery.filePath);

  return NextResponse.json({
    signedUrl,
    driveUrl: delivery.driveUrl,
    sourceType: delivery.sourceType,
    allowDownload: delivery.allowDownload,
  });
}
