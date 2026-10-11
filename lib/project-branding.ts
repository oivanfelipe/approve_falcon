import { getSignedUrl } from "@/lib/supabase/server";
import {
  normalizeHexColor,
  type FreelancerBranding,
} from "@/lib/freelancer-branding-shared";

interface ProjectBrandingInput {
  clientName: string;
  clientLogoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

// Merges a project's own client branding (logo + colors, set when creating
// or editing the project) over the freelancer's account-level branding, so
// each client's review/calendar pages and post mockups reflect their own
// identity instead of the agency's.
export async function resolveEffectiveBranding(
  project: ProjectBrandingInput,
  freelancerBranding: FreelancerBranding,
): Promise<FreelancerBranding> {
  const primaryColor = project.primaryColor
    ? normalizeHexColor(project.primaryColor, freelancerBranding.primaryColor)
    : freelancerBranding.primaryColor;

  const secondaryColor = project.secondaryColor
    ? normalizeHexColor(project.secondaryColor, freelancerBranding.secondaryColor)
    : freelancerBranding.secondaryColor;

  let logoUrl = freelancerBranding.logoUrl;
  if (project.clientLogoUrl) {
    try {
      logoUrl = await getSignedUrl(project.clientLogoUrl, 60 * 30);
    } catch {
      // keep the freelancer's logo as fallback
    }
  }

  return {
    ...freelancerBranding,
    displayName: project.clientName,
    logoUrl,
    primaryColor,
    secondaryColor,
  };
}
