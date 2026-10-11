import { getSignedUrl } from "@/lib/supabase/server";

interface AssetRow {
  id: string;
  sourceType: string;
  filePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  driveUrl: string | null;
}

export interface SignedDeliveryAsset {
  id: string;
  sourceType: "FILE" | "DRIVE_LINK";
  fileName: string | null;
  mimeType: string | null;
  driveUrl: string | null;
  signedUrl: string | null;
}

// Extra carousel slides store only a storage path, not a browsable URL —
// sign each FILE-backed one so the review/calendar pages can render it.
export async function signDeliveryAssets(
  assets: AssetRow[],
): Promise<SignedDeliveryAsset[]> {
  return Promise.all(
    assets.map(async (a) => ({
      id: a.id,
      sourceType: a.sourceType as "FILE" | "DRIVE_LINK",
      fileName: a.fileName,
      mimeType: a.mimeType,
      driveUrl: a.driveUrl,
      signedUrl:
        a.sourceType === "FILE" && a.filePath
          ? await getSignedUrl(a.filePath, 60 * 60 * 2).catch(() => null)
          : null,
    })),
  );
}
