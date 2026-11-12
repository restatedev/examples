import { createHmac, timingSafeEqual } from "node:crypto";

type SignedContent = (string | Uint8Array)[];

function hmacSha256(secret: string, content: SignedContent): Buffer {
  const hmac = createHmac("sha256", secret);
  for (const part of content) hmac.update(part);
  return hmac.digest();
}

/** The HMAC-SHA256 of `content` (its parts concatenated) under `secret`, in lower-case hex. */
export function hmacSha256Hex(secret: string, content: SignedContent): string {
  return hmacSha256(secret, content).toString("hex");
}

/**
 * Whether `givenHex` is the HMAC-SHA256 of `content` under `secret`. GitHub, Linear and Slack all
 * sign this way; they differ only in what they sign and which header carries the signature.
 * Compares in constant time, so response timing does not reveal how much of a guess was right.
 */
export function hmacMatches(
  secret: string,
  content: SignedContent,
  givenHex: string | undefined
): boolean {
  const expected = hmacSha256(secret, content);
  const given = Buffer.from(givenHex ?? "", "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
