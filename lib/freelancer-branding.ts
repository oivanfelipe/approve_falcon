import { prisma } from "@/lib/prisma/client";
import { getSignedUrl } from "@/lib/supabase/server";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  normalizeHexColor,
  type FreelancerBranding,
} from "@/lib/freelancer-branding-shared";

export {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  normalizeHexColor,
  normalizeSlug,
} from "@/lib/freelancer-branding-shared";
export type { FreelancerBranding } from "@/lib/freelancer-branding-shared";

type SettingsRow = {
  userId: string;
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string | null;
  slug: string;
  userName: string | null;
  userEmail: string | null;
};

async function resolveBranding(row: SettingsRow | null) {
  const primaryColor = normalizeHexColor(
    row?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    DEFAULT_PRIMARY_COLOR,
  );
  const secondaryColor = normalizeHexColor(
    row?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
    DEFAULT_SECONDARY_COLOR,
  );

  const backgroundColor = row?.backgroundColor
    ? normalizeHexColor(row.backgroundColor, DEFAULT_PRIMARY_COLOR)
    : null;

  let logoUrl: string | null = null;
  if (row?.logoUrl) {
    try {
      logoUrl = await getSignedUrl(row.logoUrl, 60 * 30);
    } catch {
      logoUrl = null;
    }
  }

  return {
    userId: row?.userId ?? "",
    displayName:
      row?.displayName?.trim() ||
      row?.userName?.trim() ||
      row?.userEmail ||
      "Approve Falcon",
    logoUrl,
    logoPath: row?.logoUrl ?? null,
    primaryColor,
    secondaryColor,
    backgroundColor,
    slug: row?.slug ?? null,
  } satisfies FreelancerBranding;
}

export async function getFreelancerBrandingByUserId(userId: string) {
  let row: SettingsRow | undefined;
  try {
    const [r] = await prisma.$queryRaw<SettingsRow[]>`
      SELECT
        fs."userId",
        fs."displayName",
        fs."logoUrl",
        fs."primaryColor",
        fs."backgroundColor",
        fs."secondaryColor",
        fs."slug",
        u."name" as "userName",
        u."email" as "userEmail"
      FROM "falcon"."FreelancerSettings" fs
      INNER JOIN "falcon"."User" u ON u."id" = fs."userId"
      WHERE fs."userId" = ${userId}
      LIMIT 1
    `;
    row = r;
  } catch (err: unknown) {
    // Fallback to a simpler query if the DB doesn't include the backgroundColor column yet.
    const [r] = await prisma.$queryRaw<SettingsRow[]>`
      SELECT
        fs."userId",
        fs."displayName",
        fs."logoUrl",
        fs."primaryColor",
        fs."secondaryColor",
        fs."slug",
        u."name" as "userName",
        u."email" as "userEmail"
      FROM "falcon"."FreelancerSettings" fs
      INNER JOIN "falcon"."User" u ON u."id" = fs."userId"
      WHERE fs."userId" = ${userId}
      LIMIT 1
    `;
    row = r as SettingsRow | undefined;
  }

  if (row) return resolveBranding(row);

  const [user] = await prisma.$queryRaw<
    Array<{ userId: string; userName: string | null; userEmail: string | null }>
  >`
    SELECT
      u."id" as "userId",
      u."name" as "userName",
      u."email" as "userEmail"
    FROM "falcon"."User" u
    WHERE u."id" = ${userId}
    LIMIT 1
  `;

  if (!user) {
    return resolveBranding(null);
  }

  return resolveBranding({
    userId: user.userId,
    displayName: null,
    logoUrl: null,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR,
    backgroundColor: null,
    slug: "",
    userName: user.userName,
    userEmail: user.userEmail,
  });
}
