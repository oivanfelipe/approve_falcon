import { prisma } from "@/lib/prisma/client";
import { getSignedUrl } from "@/lib/supabase/server";
import { getFreelancerBrandingByUserId } from "@/lib/freelancer-branding";

export async function loadCalendarPageData(token: string) {
  const project = await prisma.project.findUnique({
    where: { calendarToken: token },
    select: {
      id: true,
      name: true,
      clientName: true,
      userId: true,
      deliveries: {
        where: { scheduledAt: { not: null } },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          reviewToken: true,
          versionNumber: true,
          label: true,
          status: true,
          copyText: true,
          copyStatus: true,
          scheduledAt: true,
          sourceType: true,
          filePath: true,
          fileName: true,
          mimeType: true,
          driveUrl: true,
          allowDownload: true,
        },
      },
    },
  });

  if (!project) return null;

  const branding = await getFreelancerBrandingByUserId(project.userId);

  const deliveries = await Promise.all(
    project.deliveries.map(async (d) => ({
      ...d,
      signedUrl:
        d.sourceType === "FILE" && d.filePath
          ? await getSignedUrl(d.filePath, 60 * 60 * 2).catch(() => null)
          : null,
    })),
  );

  return {
    project: {
      id: project.id,
      name: project.name,
      clientName: project.clientName,
    },
    deliveries,
    branding,
  };
}

export type CalendarPageData = NonNullable<
  Awaited<ReturnType<typeof loadCalendarPageData>>
>;
export type CalendarDelivery = CalendarPageData["deliveries"][number];
