import React from "react";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import { loadReviewPageData } from "@/features/review/server/loadReviewPageData";
import ReviewClientShell from "@/features/review/components/ReviewClientShell";
import PasswordGate from "@/features/review/components/PasswordGate";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string; token: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { token } = await params;
  const delivery = await prisma.delivery.findUnique({
    where: { reviewToken: token },
    select: { project: { select: { name: true } } },
  });

  return {
    title: delivery
      ? `Review: ${delivery.project?.name ?? "Review"} - Approve Falcon`
      : "Review - Approve Falcon",
    robots: { index: false },
  };
}

export default async function BrandedReviewPage({
  params,
  searchParams,
}: PageProps) {
  const { slug, token } = await params;
  const { preview } = await searchParams;
  const isFreelancerPreview = preview === "1";

  const pageData = await loadReviewPageData(token);
  if (!pageData) notFound();

  const session = await auth();
  // Logged-in member of the agency that owns this delivery — gets edit and
  // comment capabilities directly on the client's own link, no preview
  // param needed.
  const isTeamMember = Boolean(
    session?.user?.ownerId &&
      pageData.delivery.project.user?.id === session.user.ownerId,
  );
  const freelancerName =
    isFreelancerPreview || isTeamMember
      ? (session?.user?.name ?? session?.user?.email ?? "Equipe")
      : null;

  const {
    delivery,
    signedUrl,
    initialComments,
    allDeliveries,
    branding,
    assets,
    projectSlug,
    calendarToken,
  } = pageData;

  if (!projectSlug || projectSlug !== slug) {
    notFound();
  }

  if (delivery.expiresAt && delivery.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-white border-2 border-black flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold uppercase text-black mb-2">
            Link expirado
          </h1>
          <p className="text-sm text-black/50">
            Este link de revisão expirou. Fale com quem enviou para pedir um
            novo link.
          </p>
        </div>
      </div>
    );
  }

  if (delivery.password && !isFreelancerPreview && !isTeamMember) {
    const cookieStore = await cookies();
    const unlocked = cookieStore.get(`review_pw_${token}`)?.value === "1";
    if (!unlocked) {
      return (
        <PasswordGate
          token={token}
          projectName={delivery.project?.name ?? ""}
          branding={branding}
        />
      );
    }
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headersList.get("user-agent") ?? null;

  if (!isTeamMember) {
    prisma.view
      .create({ data: { deliveryId: delivery.id, ipAddress: ip, userAgent } })
      .catch(() => {});
  }

  return (
    <ReviewClientShell
      token={token}
      deliveryId={delivery.id}
      projectId={delivery.projectId}
      rawFileName={delivery.fileName}
      deliveryAssets={assets}
      isTeamMember={isTeamMember}
      signedUrl={signedUrl}
      fileName={delivery.fileName ?? "Arte"}
      mimeType={delivery.mimeType}
      sourceType={delivery.sourceType}
      driveUrl={delivery.driveUrl}
      allowDownload={delivery.allowDownload}
      initialStatus={
        delivery.status as "PENDING" | "APPROVED" | "CHANGES_REQUESTED"
      }
      copyText={delivery.copyText}
      planNumber={delivery.planNumber}
      theme={delivery.theme}
      format={delivery.format}
      product={delivery.product}
      objective={delivery.objective}
      postFunction={delivery.postFunction}
      artCopy={delivery.artCopy}
      initialCopyStatus={
        delivery.copyStatus as "PENDING" | "APPROVED" | "CHANGES_REQUESTED"
      }
      scheduledAt={delivery.scheduledAt}
      versionNumber={delivery.versionNumber}
      label={delivery.label}
      projectName={delivery.project.name}
      clientName={delivery.project.clientName}
      initialComments={initialComments}
      allDeliveries={allDeliveries}
      extraAssets={assets}
      isFreelancerPreview={isFreelancerPreview}
      freelancerName={freelancerName}
      freelancerDisplayName={delivery.project.user?.name ?? null}
      branding={branding}
      reviewPathSlug={slug}
      calendarToken={calendarToken}
    />
  );
}
