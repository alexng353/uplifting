/**
 * Persistence and crypto for the OAuth 2.1 authorization server: client
 * registration, authorization codes, and access/refresh token issuance.
 *
 * Every credential is stored as a SHA-256 hash. The plaintext exists only in
 * the response that hands it to the client, so a database leak yields nothing
 * replayable.
 */
import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "../../db";
import {
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthClients,
  oauthConsents,
  oauthRefreshTokens,
} from "../../db/schema";
import {
  ACCESS_TOKEN_TTL_MS,
  AUTHORIZATION_CODE_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  type Scope,
  formatScopes,
} from "./config";

// ── Crypto helpers ─────────────────────────────────────────────────────────

export function randomSecret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Constant-time comparison of two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/** PKCE S256 verification (RFC 7636 §4.6). */
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  if (computed.length !== codeChallenge.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(codeChallenge));
}

// ── Clients ────────────────────────────────────────────────────────────────

export type OAuthClient = typeof oauthClients.$inferSelect;

export async function findClient(clientId: string): Promise<OAuthClient | null> {
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
    .limit(1);
  return client ?? null;
}

export function isPublicClient(client: OAuthClient): boolean {
  return client.tokenEndpointAuthMethod === "none" || client.clientSecretHash === null;
}

export function verifyClientSecret(client: OAuthClient, presented: string): boolean {
  if (!client.clientSecretHash) return false;
  return safeEqualHex(client.clientSecretHash, sha256(presented));
}

export interface RegisterClientInput {
  clientName?: string;
  clientUri?: string;
  logoUri?: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  scope: string;
  softwareId?: string;
  softwareVersion?: string;
}

export async function registerClient(
  input: RegisterClientInput,
): Promise<{ client: OAuthClient; clientSecret: string | null }> {
  const clientId = randomSecret(24);
  const confidential = input.tokenEndpointAuthMethod !== "none";
  const clientSecret = confidential ? randomSecret(32) : null;

  const [client] = await db
    .insert(oauthClients)
    .values({
      clientId,
      clientSecretHash: clientSecret ? sha256(clientSecret) : null,
      clientName: input.clientName,
      clientUri: input.clientUri,
      logoUri: input.logoUri,
      redirectUris: input.redirectUris,
      grantTypes: input.grantTypes,
      responseTypes: input.responseTypes,
      tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
      scope: input.scope,
      softwareId: input.softwareId,
      softwareVersion: input.softwareVersion,
    })
    .returning();

  return { client, clientSecret };
}

/**
 * Exact redirect URI match, with the one exception OAuth 2.1 carves out: a
 * native client's loopback redirect may vary in port (RFC 8252 §7.3). Claude
 * Code declares `http://localhost/callback` and `http://127.0.0.1/callback`
 * and then listens on an ephemeral port, so both hosts get port-agnostic
 * matching. Everything else — including the hosted Claude surfaces'
 * `https://claude.ai/api/mcp/auth_callback` — must match character for
 * character.
 */
export function redirectUriMatches(registered: readonly string[], presented: string): boolean {
  if (registered.includes(presented)) return true;

  let candidate: URL;
  try {
    candidate = new URL(presented);
  } catch {
    return false;
  }
  if (!isLoopbackUri(candidate)) return false;

  return registered.some((uri) => {
    let known: URL;
    try {
      known = new URL(uri);
    } catch {
      return false;
    }
    return (
      isLoopbackUri(known) &&
      known.protocol === candidate.protocol &&
      known.hostname === candidate.hostname &&
      known.pathname === candidate.pathname &&
      known.search === candidate.search
    );
  });
}

function isLoopbackUri(url: URL): boolean {
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]")
  );
}

/**
 * A redirect URI is registerable if it is HTTPS, or loopback HTTP for native
 * clients (OAuth 2.1 §3.1.2.1). Plain HTTP to any other host is rejected.
 */
export function isAllowedRedirectUri(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:") return true;
  return isLoopbackUri(url);
}

// ── Consent ────────────────────────────────────────────────────────────────

export async function findConsent(userId: string, clientId: string): Promise<string | null> {
  const [row] = await db
    .select({ scope: oauthConsents.scope })
    .from(oauthConsents)
    .where(and(eq(oauthConsents.userId, userId), eq(oauthConsents.clientId, clientId)))
    .limit(1);
  return row?.scope ?? null;
}

export async function recordConsent(
  userId: string,
  clientId: string,
  scope: string,
): Promise<void> {
  await db
    .insert(oauthConsents)
    .values({ userId, clientId, scope })
    .onConflictDoUpdate({
      target: [oauthConsents.userId, oauthConsents.clientId],
      set: { scope, createdAt: new Date() },
    });
}

/** True if every scope in `requested` was already approved for this client. */
export function consentCovers(approved: string | null, requested: readonly Scope[]): boolean {
  if (!approved) return false;
  const granted = new Set(approved.split(" "));
  return requested.every((scope) => granted.has(scope));
}

// ── Authorization codes ────────────────────────────────────────────────────

export interface IssueCodeInput {
  clientId: string;
  userId: string;
  redirectUri: string;
  scopes: Scope[];
  codeChallenge: string;
  codeChallengeMethod: string;
  resource: string;
}

export async function issueAuthorizationCode(input: IssueCodeInput): Promise<string> {
  const code = randomSecret(32);
  await db.insert(oauthAuthorizationCodes).values({
    codeHash: sha256(code),
    clientId: input.clientId,
    userId: input.userId,
    redirectUri: input.redirectUri,
    scope: formatScopes(input.scopes),
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    resource: input.resource,
    expiresAt: new Date(Date.now() + AUTHORIZATION_CODE_TTL_MS),
  });
  return code;
}

export type ConsumeCodeResult =
  | { ok: true; code: typeof oauthAuthorizationCodes.$inferSelect }
  | { ok: false; reason: "invalid" | "expired" | "replayed" };

/**
 * Atomically mark an authorization code as consumed. The `consumed_at IS NULL`
 * predicate is the guard: two concurrent exchanges of the same code can only
 * have one winner, and the loser is reported as a replay.
 */
export async function consumeAuthorizationCode(code: string): Promise<ConsumeCodeResult> {
  const codeHash = sha256(code);

  const [claimed] = await db
    .update(oauthAuthorizationCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(oauthAuthorizationCodes.codeHash, codeHash),
        isNull(oauthAuthorizationCodes.consumedAt),
      ),
    )
    .returning();

  if (claimed) {
    if (claimed.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
    return { ok: true, code: claimed };
  }

  const [existing] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.codeHash, codeHash))
    .limit(1);

  if (!existing) return { ok: false, reason: "invalid" };

  // Already consumed: an authorization code replay. OAuth 2.1 §7.5.1 says to
  // revoke everything previously issued from it.
  await revokeTokensForUserClient(existing.userId, existing.clientId);
  return { ok: false, reason: "replayed" };
}

// ── Tokens ─────────────────────────────────────────────────────────────────

export interface IssuedTokens {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface IssueTokensInput {
  clientId: string;
  userId: string;
  scope: string;
  audience: string;
  /** Reuse an existing family when refreshing so replay detection spans the chain. */
  familyId?: string;
  includeRefreshToken: boolean;
}

export async function issueTokens(input: IssueTokensInput): Promise<IssuedTokens> {
  const familyId = input.familyId ?? crypto.randomUUID();
  const accessToken = randomSecret(32);
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

  await db.insert(oauthAccessTokens).values({
    tokenHash: sha256(accessToken),
    familyId,
    clientId: input.clientId,
    userId: input.userId,
    scope: input.scope,
    audience: input.audience,
    expiresAt,
  });

  let refreshToken: string | undefined;
  if (input.includeRefreshToken) {
    refreshToken = randomSecret(32);
    await db.insert(oauthRefreshTokens).values({
      tokenHash: sha256(refreshToken),
      familyId,
      clientId: input.clientId,
      userId: input.userId,
      scope: input.scope,
      audience: input.audience,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
  }

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    ...(refreshToken ? { refresh_token: refreshToken } : {}),
    scope: input.scope,
  };
}

export type RefreshResult =
  | { ok: true; row: typeof oauthRefreshTokens.$inferSelect }
  | { ok: false; reason: "invalid" | "expired" | "reused" };

/**
 * Claim a refresh token for rotation. Like authorization codes, the revoke is
 * the claim: whoever flips `revoked_at` first wins, and a token that was
 * already revoked means the chain leaked, so the whole family burns.
 */
export async function claimRefreshToken(presented: string): Promise<RefreshResult> {
  const tokenHash = sha256(presented);

  const [claimed] = await db
    .update(oauthRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(oauthRefreshTokens.tokenHash, tokenHash), isNull(oauthRefreshTokens.revokedAt)))
    .returning();

  if (claimed) {
    if (claimed.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
    return { ok: true, row: claimed };
  }

  const [existing] = await db
    .select()
    .from(oauthRefreshTokens)
    .where(eq(oauthRefreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!existing) return { ok: false, reason: "invalid" };

  await revokeFamily(existing.familyId);
  return { ok: false, reason: "reused" };
}

export async function revokeFamily(familyId: string): Promise<void> {
  const now = new Date();
  await Promise.all([
    db
      .update(oauthAccessTokens)
      .set({ revokedAt: now })
      .where(and(eq(oauthAccessTokens.familyId, familyId), isNull(oauthAccessTokens.revokedAt))),
    db
      .update(oauthRefreshTokens)
      .set({ revokedAt: now })
      .where(and(eq(oauthRefreshTokens.familyId, familyId), isNull(oauthRefreshTokens.revokedAt))),
  ]);
}

export async function revokeTokensForUserClient(userId: string, clientId: string): Promise<void> {
  const now = new Date();
  await Promise.all([
    db
      .update(oauthAccessTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(oauthAccessTokens.userId, userId),
          eq(oauthAccessTokens.clientId, clientId),
          isNull(oauthAccessTokens.revokedAt),
        ),
      ),
    db
      .update(oauthRefreshTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(oauthRefreshTokens.userId, userId),
          eq(oauthRefreshTokens.clientId, clientId),
          isNull(oauthRefreshTokens.revokedAt),
        ),
      ),
  ]);
}

export interface VerifiedToken {
  userId: string;
  clientId: string;
  scope: string;
  audience: string;
  expiresAt: Date;
}

/**
 * Validate a bearer token presented at the MCP endpoint.
 *
 * `expectedAudience` is non-negotiable: MCP requires a resource server to
 * reject tokens that were not minted for it, which is what stops a token for
 * some other service from being replayed here.
 */
export async function verifyAccessToken(
  token: string,
  expectedAudience: string,
): Promise<VerifiedToken | null> {
  const [row] = await db
    .select()
    .from(oauthAccessTokens)
    .where(eq(oauthAccessTokens.tokenHash, sha256(token)))
    .limit(1);

  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  if (row.audience !== expectedAudience) return null;

  return {
    userId: row.userId,
    clientId: row.clientId,
    scope: row.scope,
    audience: row.audience,
    expiresAt: row.expiresAt,
  };
}

/** RFC 7009 token revocation. Accepts either token type. */
export async function revokeToken(token: string, clientId: string): Promise<void> {
  const tokenHash = sha256(token);
  const now = new Date();

  const [refresh] = await db
    .update(oauthRefreshTokens)
    .set({ revokedAt: now })
    .where(
      and(
        eq(oauthRefreshTokens.tokenHash, tokenHash),
        eq(oauthRefreshTokens.clientId, clientId),
        isNull(oauthRefreshTokens.revokedAt),
      ),
    )
    .returning({ familyId: oauthRefreshTokens.familyId });

  if (refresh) {
    await revokeFamily(refresh.familyId);
    return;
  }

  await db
    .update(oauthAccessTokens)
    .set({ revokedAt: now })
    .where(
      and(
        eq(oauthAccessTokens.tokenHash, tokenHash),
        eq(oauthAccessTokens.clientId, clientId),
        isNull(oauthAccessTokens.revokedAt),
      ),
    );
}

/**
 * Drop expired and long-revoked rows. Called opportunistically from the token
 * endpoint — there is no scheduler in this deployment, and the tables are
 * small enough that an occasional sweep is cheaper than a cron.
 */
export async function pruneExpired(): Promise<void> {
  const now = new Date();
  const staleRevoked = new Date(Date.now() - REFRESH_TOKEN_TTL_MS);
  await Promise.all([
    db.delete(oauthAuthorizationCodes).where(lt(oauthAuthorizationCodes.expiresAt, now)),
    db
      .delete(oauthAccessTokens)
      .where(
        or(lt(oauthAccessTokens.expiresAt, now), lt(oauthAccessTokens.revokedAt, staleRevoked)),
      ),
    db
      .delete(oauthRefreshTokens)
      .where(
        or(lt(oauthRefreshTokens.expiresAt, now), lt(oauthRefreshTokens.revokedAt, staleRevoked)),
      ),
  ]);
}
