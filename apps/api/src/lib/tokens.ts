import { randomBytes, createHash } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db";
import { refreshTokens, users } from "../db/schema";

const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function generateRefreshTokenSecret(): string {
  return randomBytes(32).toString("hex");
}

export function hashRefreshToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export interface JwtSigner {
  // Loose payload type — matches @elysiajs/jwt's `sign` without coupling to its
  // internal `AllowClaimValue` union, which changes between versions.
  sign: (payload: any) => Promise<string>;
}

async function buildJwtPayload(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("user not found while issuing token");
  return {
    sub: user.id,
    username: user.username,
    real_name: user.realName,
    email: user.email,
  };
}

/**
 * Issue a fresh access + refresh token pair, starting a new rotation family.
 * Use on login/signup.
 */
export async function issueTokenPair(jwt: JwtSigner, userId: string) {
  const accessToken = await jwt.sign(await buildJwtPayload(userId));
  const refreshSecret = generateRefreshTokenSecret();
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashRefreshToken(refreshSecret),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return { access_token: accessToken, refresh_token: refreshSecret };
}

export type RotateResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; reason: "invalid" | "expired" | "reused" };

/**
 * Verify a refresh token, revoke it, and issue a new pair in the same family.
 * If the presented token is already revoked, the entire family is burned
 * (reuse detection).
 */
export async function rotateRefreshToken(jwt: JwtSigner, presented: string): Promise<RotateResult> {
  const hash = hashRefreshToken(presented);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash))
    .limit(1);

  if (!row) return { ok: false, reason: "invalid" };

  if (row.revokedAt) {
    // reuse detected — burn the family
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.familyId, row.familyId), isNull(refreshTokens.revokedAt)));
    return { ok: false, reason: "reused" };
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const now = new Date();
  await db.update(refreshTokens).set({ revokedAt: now }).where(eq(refreshTokens.id, row.id));

  const newSecret = generateRefreshTokenSecret();
  await db.insert(refreshTokens).values({
    userId: row.userId,
    familyId: row.familyId,
    tokenHash: hashRefreshToken(newSecret),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  const accessToken = await jwt.sign(await buildJwtPayload(row.userId));
  return { ok: true, access_token: accessToken, refresh_token: newSecret };
}

/**
 * Revoke a single refresh token (best-effort logout).
 */
export async function revokeRefreshToken(presented: string): Promise<void> {
  const hash = hashRefreshToken(presented);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)));
}
