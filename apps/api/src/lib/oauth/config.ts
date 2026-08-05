/**
 * Configuration for the OAuth 2.1 authorization server that protects the MCP
 * endpoint. The server is both the authorization server and the resource
 * server, so both metadata documents are served from this origin.
 */

/** Path of the MCP endpoint. Also the OAuth resource identifier's path. */
export const MCP_PATH = "/mcp";

export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
export const AUTHORIZATION_CODE_TTL_MS = 60 * 1000; // 1 minute (OAuth 2.1 §4.1.2)
/** How long a rendered consent form stays submittable. */
export const AUTHORIZATION_REQUEST_TTL_MS = 10 * 60 * 1000;

export const SCOPES = {
  "profile:read": "View your name, username, settings and saved gyms",
  "profile:write": "Change your app settings and manage your saved gyms",
  "workouts:read": "Read your workouts, sets, exercise history and training stats",
  "workouts:write": "Log, edit and delete workouts and sets on your behalf",
  "social:read": "See your friends list and their shared workout activity",
  offline_access: "Stay connected without asking you to sign in again",
} as const;

export type Scope = keyof typeof SCOPES;

export const ALL_SCOPES = Object.keys(SCOPES) as Scope[];

/** Scopes granted when a client requests none explicitly. */
export const DEFAULT_SCOPES: Scope[] = ["profile:read", "workouts:read", "social:read"];

export function isKnownScope(scope: string): scope is Scope {
  return scope in SCOPES;
}

export function parseScopeString(scope: string | undefined | null): Scope[] {
  if (!scope) return [];
  const seen = new Set<Scope>();
  for (const part of scope.split(/\s+/)) {
    if (part && isKnownScope(part)) seen.add(part);
  }
  return [...seen];
}

export function formatScopes(scopes: readonly Scope[]): string {
  return scopes.join(" ");
}

export function hasScope(granted: string, required: Scope): boolean {
  return granted.split(" ").includes(required);
}

/**
 * Public origin of this deployment, e.g. `https://api.uplifting.app`.
 *
 * `PUBLIC_BASE_URL` should be set in production: every OAuth URL and the token
 * audience derive from it, and pinning it means a spoofed `Host` header can't
 * shift the audience a token is minted for. When it is unset (local dev) the
 * origin is reconstructed from forwarding headers instead.
 */
export function publicOrigin(request: Request): string {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = forwardedHost ?? request.headers.get("host") ?? url.host;
  const proto =
    forwardedProto ?? (host.startsWith("localhost") ? "http" : url.protocol.slice(0, -1));
  return `${proto}://${host}`;
}

/**
 * Canonical resource identifier for the MCP server (RFC 8707 §2). This is the
 * value clients must send as `resource`, the `aud` every access token is bound
 * to, and the `resource` field of the protected resource metadata document —
 * it has to equal the URL the user typed into Claude, path included.
 */
export function mcpResourceUrl(request: Request): string {
  return `${publicOrigin(request)}${MCP_PATH}`;
}

export function oauthEndpoints(request: Request) {
  const origin = publicOrigin(request);
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    resource_metadata: `${origin}/.well-known/oauth-protected-resource${MCP_PATH}`,
  };
}
