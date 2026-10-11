import crypto from "crypto";

// No 0/O/1/l/I — avoids transcription mistakes when a link is read aloud or
// retyped. 32 symbols divides 256 evenly, so sampling via modulo is unbiased.
const SHARE_TOKEN_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const SHARE_TOKEN_LENGTH = 10;

/**
 * Short, URL-friendly token for client-facing content links (review pages,
 * shareable calendar links) — meant to be readable and easy to share, not
 * the sole access control. Pair with a link password for sensitive
 * content. 10 chars from a 32-symbol alphabet ≈ 50 bits of entropy.
 */
export function generateShareToken(): string {
  const bytes = crypto.randomBytes(SHARE_TOKEN_LENGTH);
  let token = "";
  for (let i = 0; i < SHARE_TOKEN_LENGTH; i++) {
    token += SHARE_TOKEN_ALPHABET[bytes[i] % SHARE_TOKEN_ALPHABET.length];
  }
  return token;
}

/**
 * Long, cryptographically secure token for account-access flows (team
 * invites) where guessability must stay negligible.
 * 24 random bytes → 48 hex chars → 192 bits of entropy.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Generate a shorter token (e.g. for email OTP verification).
 * 4 bytes → 8-char uppercase hex code.
 */
export function generateOtpCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
