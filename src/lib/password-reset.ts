import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

/** How long a reset link stays valid. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Minimum gap between two reset emails for the same account. */
export const RESET_COOLDOWN_MS = 60 * 1000;

/**
 * Only the SHA-256 of the token is stored — the raw value exists solely in
 * the emailed link. A database leak therefore can't be turned into working
 * reset links.
 */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** "matteo@gmail.com" -> "m****@gmail.com" (shown after requesting a reset). */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashResetToken(token) },
  });
  return Boolean(record && !record.usedAt && record.expiresAt > new Date());
}
