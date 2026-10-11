import { prisma } from "@/lib/prisma/client";
import { isValidSlug } from "@/lib/freelancer-branding-shared";

// Strips accents (café → cafe) before the usual slug characters filter, so
// Portuguese client names still produce a readable slug instead of losing
// their vowels.
function slugifyClientName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");

  return base || "cliente";
}

// Deterministic collision handling — "-2", "-3"... never a random suffix —
// so the slug stays short and predictable.
export async function generateUniqueProjectSlug(
  clientName: string,
): Promise<string> {
  const base = slugifyClientName(clientName);
  let candidate = base;
  let suffix = 2;

  while (
    !isValidSlug(candidate) ||
    (await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    }))
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
