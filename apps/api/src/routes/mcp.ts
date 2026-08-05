/**
 * The MCP endpoint: Streamable HTTP transport, bearer-authenticated.
 *
 * Runs stateless — a transport and server per request, JSON responses rather
 * than SSE streams. Nothing about this workload needs server-initiated
 * messages, and statelessness means any instance can serve any request.
 */
import { Elysia } from "elysia";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { MCP_PATH, mcpResourceUrl, oauthEndpoints, parseScopeString } from "../lib/oauth/config";
import { verifyAccessToken } from "../lib/oauth/store";
import { createMcpServer } from "../mcp/server";
import { RESOURCE_SCOPES } from "./oauth";

const MCP_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  // Without this a browser-based client can never read the 401 challenge, and
  // so can never discover where to authorize.
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

/**
 * Every 401 from this endpoint carries a pointer to the protected resource
 * metadata (RFC 9728 §5.1). That header is the whole bootstrap: it is how a
 * client that has never seen this server learns where to authorize. The
 * `scope` parameter tells it which scopes to ask for.
 */
function unauthorized(request: Request, error: string, description: string): Response {
  const { resource_metadata } = oauthEndpoints(request);
  const challenge =
    `Bearer error="${error}", error_description="${description}", ` +
    `resource_metadata="${resource_metadata}", scope="${RESOURCE_SCOPES.join(" ")}"`;

  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: description }, id: null }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": challenge,
        ...MCP_CORS_HEADERS,
      },
    },
  );
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(MCP_CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
    return unauthorized(
      request,
      "invalid_request",
      "Authorization header with a bearer token is required",
    );
  }

  const token = authorization.slice(7).trim();
  const verified = await verifyAccessToken(token, mcpResourceUrl(request));

  if (!verified) {
    // One message for unknown, expired, revoked and wrong-audience tokens
    // alike: the client's next move is identical in every case, and
    // distinguishing them would let a caller probe token state.
    return unauthorized(
      request,
      "invalid_token",
      "The access token is expired, revoked, or was not issued for this MCP server",
    );
  }

  const server = createMcpServer({
    userId: verified.userId,
    clientId: verified.clientId,
    scopes: new Set(parseScopeString(verified.scope)),
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    // Stateless: no session IDs, no standalone SSE stream.
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return withCors(await transport.handleRequest(request));
  } finally {
    // The server and transport belong to this request only; drop both however
    // it ends so a failure can't leak either.
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

export const mcpRoutes = new Elysia({ name: "mcp" })
  .options(MCP_PATH, () => new Response(null, { status: 204, headers: MCP_CORS_HEADERS }))
  .post(MCP_PATH, ({ request }) => handleMcpRequest(request), {
    // The transport reads and parses the body from the Request itself, so
    // Elysia must leave the stream alone.
    parse: "none",
  })
  .get(MCP_PATH, ({ request }) => handleMcpRequest(request))
  .delete(MCP_PATH, ({ request }) => handleMcpRequest(request));
