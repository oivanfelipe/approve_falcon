import "server-only";
import { createClient } from "@supabase/supabase-js";

const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "deliveries";

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

// Service-role client — server-side only (bypass RLS). Instantiated lazily so
// a missing env var only breaks the request that needs it, not the entire
// build (createClient throws immediately if the URL/key are undefined).
export function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return supabaseAdminClient;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the storage path on success.
 */
export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await getSupabaseAdmin().storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return path;
}

/**
 * Generate a short-lived signed URL for reading a file.
 * Default expiry: 2 hours.
 */
export async function getSignedUrl(
  path: string,
  expiresIn = 60 * 60 * 2,
): Promise<string> {
  const { data, error } = await getSupabaseAdmin().storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);

  return data.signedUrl;
}

/**
 * Create a signed upload URL so the client can upload directly to Supabase
 * without routing the bytes through Next.js.
 */
export async function getSignedUploadUrl(path: string) {
  const { data, error } = await getSupabaseAdmin().storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data)
    throw new Error(`Signed upload URL failed: ${error?.message}`);

  return data; // { signedUrl, token, path }
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await getSupabaseAdmin().storage.from(bucket).remove([path]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
