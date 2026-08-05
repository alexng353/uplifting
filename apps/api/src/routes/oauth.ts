/**
 * OAuth 2.1 authorization server + RFC 9728 protected resource metadata for
 * the MCP endpoint.
 *
 * Implements the subset the MCP authorization spec requires, which is also
 * exactly what Claude's connector infrastructure drives:
 *
 *   RFC 9728  protected resource metadata      GET  /.well-known/oauth-protected-resource[/mcp]
 *   RFC 8414  authorization server metadata    GET  /.well-known/oauth-authorization-server
 *   RFC 7591  dynamic client registration      POST /oauth/register
 *   RFC 7636  PKCE (S256, mandatory)           GET/POST /oauth/authorize
 *   RFC 8707  resource indicators              authorize + token
 *   RFC 9207  issuer in the authorization response
 *   RFC 7009  token revocation                 POST /oauth/revoke
 */
import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { verifyPassword } from "../lib/password";
import { checkRateLimit, clientIp, resetRateLimit } from "../lib/rate-limit";
import {
  ALL_SCOPES,
  DEFAULT_SCOPES,
  MCP_PATH,
  SCOPES,
  type Scope,
  formatScopes,
  isKnownScope,
  mcpResourceUrl,
  oauthEndpoints,
  parseScopeString,
  publicOrigin,
} from "../lib/oauth/config";
import { renderConsentPage, renderErrorPage } from "../lib/oauth/pages";
import { decodeAuthorizationRequest, encodeAuthorizationRequest } from "../lib/oauth/request";
import {
  consentCovers,
  findClient,
  findConsent,
  isAllowedRedirectUri,
  isPublicClient,
  issueAuthorizationCode,
  issueTokens,
  claimRefreshToken,
  consumeAuthorizationCode,
  pruneExpired,
  recordConsent,
  redirectUriMatches,
  registerClient,
  revokeToken,
  verifyClientSecret,
  verifyPkceS256,
  type OAuthClient,
} from "../lib/oauth/store";

/** Resource-server scopes. `offline_access` is an AS concern, so it is not listed here. */
const RESOURCE_SCOPES = ALL_SCOPES.filter((scope) => scope !== "offline_access");

const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
const REGISTRATION_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

// ── Response helpers ───────────────────────────────────────────────────────

/**
 * Discovery, registration and token endpoints are fetched cross-origin by
 * browser-based MCP clients (the Inspector, for one), so they answer
 * preflights and echo permissive CORS. They carry no cookies and no ambient
 * authority — every one of them authenticates by bearer token or client
 * credentials in the request itself.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Token responses must never be cached (RFC 6749 §5.1).
      "Cache-Control": "no-store",
      Pragma: "no-cache",
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function metadataJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      ...CORS_HEADERS,
    },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // The consent page is same-origin only and posts to itself.
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
    },
  });
}

function oauthError(
  error: string,
  description: string,
  status = 400,
  headers: Record<string, string> = {},
): Response {
  return json({ error, error_description: description }, status, headers);
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

/** Bounce back to the client with an OAuth error (RFC 6749 §4.1.2.1). */
function redirectWithError(
  redirectUri: string,
  error: string,
  description: string,
  state: string | undefined,
  issuer: string,
): Response {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state !== undefined) url.searchParams.set("state", state);
  url.searchParams.set("iss", issuer);
  return redirect(url.toString());
}

// ── Shared validation ──────────────────────────────────────────────────────

/**
 * Compare an RFC 8707 `resource` against this server's canonical MCP URL.
 * Scheme and host are case-insensitive and a trailing slash is not
 * significant; the path otherwise has to match, since it is what distinguishes
 * one MCP server from another on a shared origin.
 */
function resourceMatches(presented: string, canonical: string): boolean {
  const normalize = (value: string): string | null => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if (url.hash) return null;
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.protocol.toLowerCase()}//${url.host.toLowerCase()}${path}`;
  };

  const left = normalize(presented);
  return left !== null && left === normalize(canonical);
}

interface ClientCredentials {
  clientId: string;
  clientSecret?: string;
}

/**
 * Read client credentials from either `client_secret_basic` (Authorization
 * header) or `client_secret_post` / public-client form fields.
 */
function readClientCredentials(
  request: Request,
  body: Record<string, string | undefined>,
): ClientCredentials | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("basic ")) {
    let decoded: string;
    try {
      decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    } catch {
      return null;
    }
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      clientId: decodeURIComponent(decoded.slice(0, separator)),
      clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
    };
  }

  if (!body.client_id) return null;
  return { clientId: body.client_id, clientSecret: body.client_secret };
}

type ClientAuthResult = { ok: true; client: OAuthClient } | { ok: false; response: Response };

async function authenticateClient(
  request: Request,
  body: Record<string, string | undefined>,
): Promise<ClientAuthResult> {
  const credentials = readClientCredentials(request, body);
  if (!credentials) {
    return {
      ok: false,
      response: oauthError("invalid_client", "Client authentication is required.", 401),
    };
  }

  const client = await findClient(credentials.clientId);
  // A 401 `invalid_client` is also how a client learns its registration is
  // gone: Claude responds by re-registering through DCR rather than failing.
  if (!client) {
    return {
      ok: false,
      response: oauthError("invalid_client", "Unknown client. Register again.", 401),
    };
  }

  if (isPublicClient(client)) return { ok: true, client };

  if (!credentials.clientSecret || !verifyClientSecret(client, credentials.clientSecret)) {
    return {
      ok: false,
      response: oauthError("invalid_client", "Invalid client credentials.", 401, {
        "WWW-Authenticate": 'Basic realm="uplifting", charset="UTF-8"',
      }),
    };
  }

  return { ok: true, client };
}

// ── Routes ─────────────────────────────────────────────────────────────────

const optionalString = t.Optional(t.String());

export const oauthRoutes = new Elysia({ name: "oauth" })
  // ── Discovery ────────────────────────────────────────────────────────────

  /**
   * RFC 9728. Served at both the bare path and the MCP-path-suffixed variant,
   * because clients probe `/.well-known/oauth-protected-resource/<mcp path>`
   * before falling back to the bare path.
   */
  .get("/.well-known/oauth-protected-resource", ({ request }) =>
    metadataJson(protectedResourceMetadata(request)),
  )
  .get(`/.well-known/oauth-protected-resource${MCP_PATH}`, ({ request }) =>
    metadataJson(protectedResourceMetadata(request)),
  )

  /** RFC 8414. The suffixed variant covers clients that treat the MCP path as an issuer path. */
  .get("/.well-known/oauth-authorization-server", ({ request }) =>
    metadataJson(authorizationServerMetadata(request)),
  )
  .get(`/.well-known/oauth-authorization-server${MCP_PATH}`, ({ request }) =>
    metadataJson(authorizationServerMetadata(request)),
  )

  .options(
    "/.well-known/oauth-protected-resource",
    () => new Response(null, { status: 204, headers: CORS_HEADERS }),
  )
  .options(
    `/.well-known/oauth-protected-resource${MCP_PATH}`,
    () => new Response(null, { status: 204, headers: CORS_HEADERS }),
  )
  .options(
    "/.well-known/oauth-authorization-server",
    () => new Response(null, { status: 204, headers: CORS_HEADERS }),
  )
  .options("/oauth/register", () => new Response(null, { status: 204, headers: CORS_HEADERS }))
  .options("/oauth/token", () => new Response(null, { status: 204, headers: CORS_HEADERS }))
  .options("/oauth/revoke", () => new Response(null, { status: 204, headers: CORS_HEADERS }))

  // ── Dynamic client registration (RFC 7591) ───────────────────────────────

  .post(
    "/oauth/register",
    async ({ request, body }) => {
      const limit = checkRateLimit(`register:${clientIp(request)}`, REGISTRATION_RATE_LIMIT);
      if (!limit.allowed) {
        return oauthError(
          "temporarily_unavailable",
          "Too many registration attempts. Try again later.",
          429,
          { "Retry-After": String(limit.retryAfter) },
        );
      }

      const metadata = (body ?? {}) as Record<string, unknown>;

      const redirectUris = metadata.redirect_uris;
      if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
        return oauthError(
          "invalid_redirect_uri",
          "redirect_uris is required and must be a non-empty array.",
        );
      }
      if (redirectUris.length > 10) {
        return oauthError("invalid_redirect_uri", "At most 10 redirect_uris may be registered.");
      }
      for (const uri of redirectUris) {
        if (typeof uri !== "string" || !isAllowedRedirectUri(uri)) {
          return oauthError(
            "invalid_redirect_uri",
            `"${String(uri)}" is not a usable redirect URI. Use an https:// URL, or http:// on localhost for a native app.`,
          );
        }
      }

      const grantTypes = asStringArray(metadata.grant_types) ?? [
        "authorization_code",
        "refresh_token",
      ];
      const unsupportedGrant = grantTypes.find(
        (grant) => grant !== "authorization_code" && grant !== "refresh_token",
      );
      if (unsupportedGrant) {
        return oauthError(
          "invalid_client_metadata",
          `Unsupported grant_type "${unsupportedGrant}". This server supports authorization_code and refresh_token.`,
        );
      }

      const responseTypes = asStringArray(metadata.response_types) ?? ["code"];
      const unsupportedResponse = responseTypes.find((type) => type !== "code");
      if (unsupportedResponse) {
        return oauthError(
          "invalid_client_metadata",
          `Unsupported response_type "${unsupportedResponse}". This server supports the authorization code flow only.`,
        );
      }

      const authMethod =
        typeof metadata.token_endpoint_auth_method === "string"
          ? metadata.token_endpoint_auth_method
          : "none";
      if (!["none", "client_secret_basic", "client_secret_post"].includes(authMethod)) {
        return oauthError(
          "invalid_client_metadata",
          `Unsupported token_endpoint_auth_method "${authMethod}". Supported: none, client_secret_basic, client_secret_post.`,
        );
      }

      // Unknown scopes are dropped rather than rejected, so a client asking for
      // more than this server offers still registers and simply gets less.
      const requestedScopes =
        typeof metadata.scope === "string" ? parseScopeString(metadata.scope) : ALL_SCOPES;
      const grantedScopes = requestedScopes.length > 0 ? requestedScopes : DEFAULT_SCOPES;

      const { client, clientSecret } = await registerClient({
        clientName: asString(metadata.client_name)?.slice(0, 255),
        clientUri: asString(metadata.client_uri),
        logoUri: asString(metadata.logo_uri),
        redirectUris: redirectUris as string[],
        grantTypes,
        responseTypes,
        tokenEndpointAuthMethod: authMethod,
        scope: formatScopes(grantedScopes),
        softwareId: asString(metadata.software_id)?.slice(0, 255),
        softwareVersion: asString(metadata.software_version)?.slice(0, 255),
      });

      return json(
        {
          client_id: client.clientId,
          ...(clientSecret ? { client_secret: clientSecret } : {}),
          client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
          // 0 means the secret does not expire (RFC 7591 §3.2.1).
          ...(clientSecret ? { client_secret_expires_at: 0 } : {}),
          client_name: client.clientName ?? undefined,
          client_uri: client.clientUri ?? undefined,
          logo_uri: client.logoUri ?? undefined,
          redirect_uris: client.redirectUris,
          grant_types: client.grantTypes,
          response_types: client.responseTypes,
          token_endpoint_auth_method: client.tokenEndpointAuthMethod,
          scope: client.scope,
        },
        201,
      );
    },
    { body: t.Optional(t.Any()) },
  )

  // ── Authorization endpoint ───────────────────────────────────────────────

  .get(
    "/oauth/authorize",
    async ({ request, query }) => {
      const issuer = publicOrigin(request);
      const canonicalResource = mcpResourceUrl(request);

      const client = query.client_id ? await findClient(query.client_id) : null;
      if (!client) {
        return html(
          renderErrorPage(
            "Unknown application",
            "The application that sent you here is not registered with Uplifting, so the sign-in cannot continue.",
          ),
          400,
        );
      }

      // Until the redirect URI is known-good, errors have to be shown here
      // rather than sent to it — otherwise this endpoint becomes an open
      // redirector.
      const redirectUri = query.redirect_uri;
      if (!redirectUri || !redirectUriMatches(client.redirectUris, redirectUri)) {
        return html(
          renderErrorPage(
            "Invalid redirect URI",
            "The application asked to be returned to an address it has not registered. Nothing was shared.",
          ),
          400,
        );
      }

      const state = query.state;

      if (query.response_type !== "code") {
        return redirectWithError(
          redirectUri,
          "unsupported_response_type",
          "Only response_type=code is supported.",
          state,
          issuer,
        );
      }

      const codeChallenge = query.code_challenge;
      if (!codeChallenge) {
        return redirectWithError(
          redirectUri,
          "invalid_request",
          "PKCE is required: send code_challenge with code_challenge_method=S256.",
          state,
          issuer,
        );
      }
      if ((query.code_challenge_method ?? "plain") !== "S256") {
        return redirectWithError(
          redirectUri,
          "invalid_request",
          "Unsupported code_challenge_method. Only S256 is accepted.",
          state,
          issuer,
        );
      }

      if (query.resource && !resourceMatches(query.resource, canonicalResource)) {
        return redirectWithError(
          redirectUri,
          "invalid_target",
          `Unknown resource. This authorization server only issues tokens for ${canonicalResource}.`,
          state,
          issuer,
        );
      }

      const scopeResult = resolveScopes(query.scope, client);
      if (!scopeResult.ok) {
        return redirectWithError(redirectUri, "invalid_scope", scopeResult.message, state, issuer);
      }

      const requestToken = encodeAuthorizationRequest({
        client_id: client.clientId,
        redirect_uri: redirectUri,
        scopes: scopeResult.scopes,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        resource: canonicalResource,
      });

      return html(
        renderConsentPage({
          clientName: client.clientName ?? "An application",
          redirectUri,
          scopes: scopeResult.scopes,
          requestToken,
        }),
      );
    },
    {
      query: t.Object({
        response_type: optionalString,
        client_id: optionalString,
        redirect_uri: optionalString,
        scope: optionalString,
        state: optionalString,
        code_challenge: optionalString,
        code_challenge_method: optionalString,
        resource: optionalString,
      }),
    },
  )

  .post(
    "/oauth/authorize",
    async ({ request, body }) => {
      const issuer = publicOrigin(request);
      const form = (body ?? {}) as Record<string, string | undefined>;

      const authorizationRequest = form.request ? decodeAuthorizationRequest(form.request) : null;
      if (!authorizationRequest) {
        return html(
          renderErrorPage(
            "Sign-in request expired",
            "This sign-in page is no longer valid. Start the connection again from the application.",
          ),
          400,
        );
      }

      const client = await findClient(authorizationRequest.client_id);
      if (!client) {
        return html(
          renderErrorPage(
            "Unknown application",
            "The application that sent you here is no longer registered.",
          ),
          400,
        );
      }

      if (form.action !== "approve") {
        return redirectWithError(
          authorizationRequest.redirect_uri,
          "access_denied",
          "The user declined the request.",
          authorizationRequest.state,
          issuer,
        );
      }

      const username = (form.username ?? "").trim();
      const password = form.password ?? "";

      const rateLimitKey = `login:${clientIp(request)}:${username.toLowerCase()}`;
      const limit = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
      if (!limit.allowed) {
        return html(
          renderConsentPage({
            clientName: client.clientName ?? "An application",
            redirectUri: authorizationRequest.redirect_uri,
            scopes: authorizationRequest.scopes,
            requestToken: form.request!,
            username,
            error: "Too many sign-in attempts. Wait a few minutes and try again.",
          }),
          429,
        );
      }

      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      const valid = user ? await verifyPassword(password, user.passwordHash) : false;

      if (!user || !valid) {
        return html(
          renderConsentPage({
            clientName: client.clientName ?? "An application",
            redirectUri: authorizationRequest.redirect_uri,
            scopes: authorizationRequest.scopes,
            requestToken: form.request!,
            username,
            error: "Incorrect username or password.",
          }),
          401,
        );
      }

      resetRateLimit(rateLimitKey);

      const scope = formatScopes(authorizationRequest.scopes);
      const previousConsent = await findConsent(user.id, client.clientId);
      if (!consentCovers(previousConsent, authorizationRequest.scopes)) {
        await recordConsent(user.id, client.clientId, scope);
      }

      const code = await issueAuthorizationCode({
        clientId: client.clientId,
        userId: user.id,
        redirectUri: authorizationRequest.redirect_uri,
        scopes: authorizationRequest.scopes,
        codeChallenge: authorizationRequest.code_challenge,
        codeChallengeMethod: authorizationRequest.code_challenge_method,
        resource: authorizationRequest.resource,
      });

      const location = new URL(authorizationRequest.redirect_uri);
      location.searchParams.set("code", code);
      if (authorizationRequest.state !== undefined) {
        location.searchParams.set("state", authorizationRequest.state);
      }
      // RFC 9207 — lets the client confirm which AS answered.
      location.searchParams.set("iss", issuer);
      return redirect(location.toString());
    },
    {
      body: t.Object({
        request: optionalString,
        action: optionalString,
        username: optionalString,
        password: optionalString,
      }),
    },
  )

  // ── Token endpoint ───────────────────────────────────────────────────────

  .post(
    "/oauth/token",
    async ({ request, body }) => {
      const form = (body ?? {}) as Record<string, string | undefined>;
      const canonicalResource = mcpResourceUrl(request);

      const auth = await authenticateClient(request, form);
      if (!auth.ok) return auth.response;
      const client = auth.client;

      // Cheap opportunistic GC; failures here must never fail the exchange.
      void pruneExpired().catch(() => {});

      if (form.grant_type === "authorization_code") {
        return handleAuthorizationCodeGrant(form, client, canonicalResource);
      }
      if (form.grant_type === "refresh_token") {
        return handleRefreshTokenGrant(form, client, canonicalResource);
      }

      return oauthError(
        "unsupported_grant_type",
        `Unsupported grant_type "${form.grant_type ?? ""}". Supported: authorization_code, refresh_token.`,
      );
    },
    {
      body: t.Object({
        grant_type: optionalString,
        code: optionalString,
        redirect_uri: optionalString,
        code_verifier: optionalString,
        refresh_token: optionalString,
        scope: optionalString,
        resource: optionalString,
        client_id: optionalString,
        client_secret: optionalString,
      }),
    },
  )

  // ── Token revocation (RFC 7009) ──────────────────────────────────────────

  .post(
    "/oauth/revoke",
    async ({ request, body }) => {
      const form = (body ?? {}) as Record<string, string | undefined>;

      const auth = await authenticateClient(request, form);
      if (!auth.ok) return auth.response;

      // RFC 7009 §2.2: revoking an unknown token is a success, so callers
      // can't probe token validity here.
      if (form.token) await revokeToken(form.token, auth.client.clientId);
      return json({}, 200);
    },
    {
      body: t.Object({
        token: optionalString,
        token_type_hint: optionalString,
        client_id: optionalString,
        client_secret: optionalString,
      }),
    },
  );

// ── Grant handlers ─────────────────────────────────────────────────────────

async function handleAuthorizationCodeGrant(
  form: Record<string, string | undefined>,
  client: OAuthClient,
  canonicalResource: string,
): Promise<Response> {
  if (!form.code) {
    return oauthError("invalid_request", "code is required for the authorization_code grant.");
  }
  if (!form.code_verifier) {
    return oauthError("invalid_request", "code_verifier is required (PKCE).");
  }

  const consumed = await consumeAuthorizationCode(form.code);
  if (!consumed.ok) {
    const description =
      consumed.reason === "replayed"
        ? "This authorization code was already used. All tokens issued from it have been revoked; start a new authorization."
        : consumed.reason === "expired"
          ? "The authorization code has expired. Start a new authorization."
          : "Invalid authorization code.";
    return oauthError("invalid_grant", description);
  }

  const code = consumed.code;

  if (code.clientId !== client.clientId) {
    return oauthError("invalid_grant", "This authorization code was issued to a different client.");
  }
  if (!form.redirect_uri || form.redirect_uri !== code.redirectUri) {
    return oauthError(
      "invalid_grant",
      "redirect_uri does not match the one used in the authorization request.",
    );
  }
  if (!verifyPkceS256(form.code_verifier, code.codeChallenge)) {
    return oauthError(
      "invalid_grant",
      "PKCE verification failed: code_verifier does not match code_challenge.",
    );
  }
  if (form.resource && !resourceMatches(form.resource, canonicalResource)) {
    return oauthError(
      "invalid_target",
      `Unknown resource. This authorization server only issues tokens for ${canonicalResource}.`,
    );
  }
  if (code.resource !== canonicalResource) {
    return oauthError(
      "invalid_target",
      "The authorization was granted for a different resource than this token request targets.",
    );
  }

  const scopes = parseScopeString(code.scope);
  const tokens = await issueTokens({
    clientId: client.clientId,
    userId: code.userId,
    scope: code.scope,
    audience: code.resource,
    includeRefreshToken: scopes.includes("offline_access"),
  });

  return json(tokens);
}

async function handleRefreshTokenGrant(
  form: Record<string, string | undefined>,
  client: OAuthClient,
  canonicalResource: string,
): Promise<Response> {
  if (!form.refresh_token) {
    return oauthError("invalid_request", "refresh_token is required for the refresh_token grant.");
  }

  const claimed = await claimRefreshToken(form.refresh_token);
  if (!claimed.ok) {
    const description =
      claimed.reason === "reused"
        ? "This refresh token was already used. The whole token chain has been revoked; the user must authorize again."
        : claimed.reason === "expired"
          ? "The refresh token has expired. The user must authorize again."
          : "Invalid refresh token.";
    return oauthError("invalid_grant", description);
  }

  const row = claimed.row;

  if (row.clientId !== client.clientId) {
    return oauthError("invalid_grant", "This refresh token was issued to a different client.");
  }
  if (form.resource && !resourceMatches(form.resource, canonicalResource)) {
    return oauthError(
      "invalid_target",
      `Unknown resource. This authorization server only issues tokens for ${canonicalResource}.`,
    );
  }

  // A refresh may narrow scope but never widen it (RFC 6749 §6).
  const originalScopes = parseScopeString(row.scope);
  let scopes = originalScopes;
  if (form.scope) {
    const requested = parseScopeString(form.scope);
    const widened = requested.find((scope) => !originalScopes.includes(scope));
    if (widened) {
      return oauthError(
        "invalid_scope",
        `Cannot widen scope on refresh: "${widened}" was not part of the original grant.`,
      );
    }
    scopes = requested;
  }

  const tokens = await issueTokens({
    clientId: client.clientId,
    userId: row.userId,
    scope: formatScopes(scopes),
    audience: row.audience,
    familyId: row.familyId,
    // Rotation is mandatory for public clients; the freshly issued token
    // arrives in the same response that invalidated the old one.
    includeRefreshToken: scopes.includes("offline_access"),
  });

  return json(tokens);
}

// ── Metadata documents ─────────────────────────────────────────────────────

/**
 * Optional link to human-readable connector docs. Omitted when unset rather
 * than pointing at a URL this API doesn't serve.
 */
const DOCS_URL = process.env.MCP_DOCS_URL;

function protectedResourceMetadata(request: Request) {
  const origin = publicOrigin(request);
  return {
    resource: mcpResourceUrl(request),
    authorization_servers: [origin],
    scopes_supported: RESOURCE_SCOPES,
    bearer_methods_supported: ["header"],
    resource_name: "Uplifting",
    ...(DOCS_URL ? { resource_documentation: DOCS_URL } : {}),
  };
}

function authorizationServerMetadata(request: Request) {
  const endpoints = oauthEndpoints(request);
  return {
    issuer: endpoints.issuer,
    authorization_endpoint: endpoints.authorization_endpoint,
    token_endpoint: endpoints.token_endpoint,
    registration_endpoint: endpoints.registration_endpoint,
    revocation_endpoint: endpoints.revocation_endpoint,
    scopes_supported: ALL_SCOPES,
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic", "client_secret_post"],
    revocation_endpoint_auth_methods_supported: [
      "none",
      "client_secret_basic",
      "client_secret_post",
    ],
    code_challenge_methods_supported: ["S256"],
    resource_indicators_supported: true,
    authorization_response_iss_parameter_supported: true,
    ...(DOCS_URL ? { service_documentation: DOCS_URL } : {}),
  };
}

// ── Small helpers ──────────────────────────────────────────────────────────

type ScopeResolution = { ok: true; scopes: Scope[] } | { ok: false; message: string };

function resolveScopes(requested: string | undefined, client: OAuthClient): ScopeResolution {
  const allowed = client.scope ? parseScopeString(client.scope) : ALL_SCOPES;

  if (!requested) {
    const fallback = DEFAULT_SCOPES.filter((scope) => allowed.includes(scope));
    return { ok: true, scopes: fallback.length > 0 ? fallback : allowed };
  }

  const parts = requested.split(/\s+/).filter(Boolean);
  const unknown = parts.find((part) => !isKnownScope(part));
  if (unknown) {
    return {
      ok: false,
      message: `Unknown scope "${unknown}". Supported scopes: ${ALL_SCOPES.join(", ")}.`,
    };
  }

  const scopes = parts.filter(isKnownScope);
  const forbidden = scopes.find((scope) => !allowed.includes(scope));
  if (forbidden) {
    return {
      ok: false,
      message: `Scope "${forbidden}" was not granted to this client at registration.`,
    };
  }

  return { ok: true, scopes: [...new Set(scopes)] };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length > 0 ? strings : undefined;
}

export { CORS_HEADERS, RESOURCE_SCOPES, SCOPES };
