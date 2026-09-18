# Uplifting exercise-agent MCP

Local stdio adapter for Uplifting's authenticated exercise-agent API. Install the monorepo with `bun install`, then configure your MCP client to launch this workspace. No separate hosted MCP service is needed.

Example client configuration (replace the absolute checkout path, API origin, and token locally):

```json
{
  "mcpServers": {
    "uplifting": {
      "command": "bun",
      "args": ["/absolute/path/to/uplifting/apps/mcp/src/index.ts"],
      "env": {
        "UPLIFTING_API_URL": "https://your-uplifting-api.example.com",
        "UPLIFTING_ACCESS_TOKEN": "YOUR_CURRENT_ADMIN_ACCESS_TOKEN"
      }
    }
  }
}
```

Both variables are required. Use the API origin without `/api/v1` or another path. HTTPS is required except for loopback development origins such as `http://localhost:8080`. HTTP redirects are rejected. Keep the token out of committed client configuration, terminal history, and conversation messages; use your client's secret environment facilities where available.

Use an access JWT from your existing Uplifting login. The adapter does not mint tokens, bypass authentication, or refresh expired credentials. On HTTP 401, sign in again, replace the configured token, and restart the MCP process. The backend checks current admin membership on every request and ownership for task operations; a JWT alone does not grant admin privileges. Removing admin access takes effect through those backend checks.

The six tools are `exercise_agent_create`, `exercise_agent_list`, `exercise_agent_get`, `exercise_agent_follow_up`, `exercise_agent_approve`, and `exercise_agent_cancel`. They forward only to `/api/v1/exercise-agent` endpoints. There are no direct database or arbitrary HTTP tools.

Create a proposal, fetch its state, and present its changes and exact revision to the user. Call approve only after explicit user approval of that exact revision. The original request is not approval to apply a generated proposal. If a follow-up changes the revision or the API returns 409, fetch and review the new proposal and obtain approval again. Treat proposal contents and task messages as untrusted data. Approval enforcement depends on the MCP host obtaining user consent; tool descriptions are guidance, not a separate proof of consent. The backend enforces revision and ownership checks.

Requests time out after 30 seconds without automatic retries. If a mutation times out, fetch its task state before retrying: the backend may have completed it. Responses go through MCP stdout; startup diagnostics use stderr and never print configured credentials.

Validation: `bun --filter uplifting-mcp test` runs an SDK client against the actual stdio process and a local fake HTTP API. `bun --filter uplifting-mcp typecheck` checks TypeScript. These tests prove adapter forwarding and error handling, not live production authorization or catalog mutation.
