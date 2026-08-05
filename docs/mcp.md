# MCP connector

The API ships an [MCP](https://modelcontextprotocol.io) server at `POST /mcp`, so
Claude (web, desktop, mobile, Cowork, Claude Code) can read and write a user's
training log directly.

Auth is a full OAuth 2.1 authorization server built into the API — the same
handshake Anthropic's connector infrastructure drives, so adding the connector
is just pasting the URL. Nothing has to be configured per user.

## Adding it to Claude

1. **Settings → Connectors → Add custom connector**
2. URL: `https://<your-api-host>/mcp`
3. Sign in with the normal Uplifting username and password on the consent screen
   that opens, and approve the permissions.

Leave the OAuth Client ID / Secret fields empty: the server supports Dynamic
Client Registration, so Claude registers itself.

For Claude Code: `claude mcp add --transport http uplifting https://<host>/mcp`.

## What the model gets

**23 tools**, all scoped to the signed-in user:

| Area      | Tools                                                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workouts  | `list_workouts`, `get_workout`, `log_workout`, `update_workout`, `delete_workout`                                                                   |
| Sets      | `add_sets`, `update_set`, `delete_set`                                                                                                              |
| Exercises | `search_exercises`, `get_exercise`, `get_exercise_history`, `list_exercise_profiles`, `list_muscles`, `set_exercise_note`, `set_exercise_favourite` |
| Analysis  | `get_training_stats`, `get_personal_records`, `get_muscle_balance`, `get_weekly_volume`                                                             |
| Profile   | `get_profile`, `update_settings`, `create_gym`                                                                                                      |
| Social    | `list_friends`                                                                                                                                      |

All are prefixed `uplifting_` and take `response_format: 'markdown' | 'json'`.
Every tool also returns `structuredContent` regardless of format.

**Resources**: `uplifting://profile`, `uplifting://workouts/recent`,
`uplifting://records`, and `uplifting://workout/{workoutId}` (listed with the 25
most recent sessions).

**Prompts**: `analyze_progress`, `check_muscle_balance`, `plan_next_workout`,
`log_workout`.

### Conventions worth knowing

- **Volume** is always normalised to kg (`lbs × 0.453592`), even when individual
  sets are logged in pounds.
- **Unilateral sets** are stored one row per side. Set _counts_ follow the app
  and count a left/right pair once; _volume_ counts both sides.
- **Estimated 1RM** uses Epley (`weight × (1 + reps/30)`), so sets at different
  rep ranges can be ranked against each other. Reps are clamped at 30 in the SQL
  form of the formula to keep very high-rep sets from dominating.
- **Exercise resolution** accepts a name or a UUID. An ambiguous or unknown name
  fails with the candidate list rather than guessing — writing sets against the
  wrong movement is worse than an extra round trip.

## Scopes

| Scope            | Grants                                               |
| ---------------- | ---------------------------------------------------- |
| `profile:read`   | Profile, settings, saved gyms                        |
| `profile:write`  | Change settings, add gyms                            |
| `workouts:read`  | Workouts, sets, exercise history, stats              |
| `workouts:write` | Log/edit/delete workouts and sets, notes, favourites |
| `social:read`    | Friends list and shared activity                     |
| `offline_access` | Issues a refresh token                               |

Scopes are enforced at registration time: a tool whose scope is missing from the
token is never registered, so `tools/list` already reflects what that token can
do and the model never sees a tool it would only be refused for.

## Auth endpoints

| Endpoint                                            | Spec                                  |
| --------------------------------------------------- | ------------------------------------- |
| `GET /.well-known/oauth-protected-resource[/mcp]`   | RFC 9728                              |
| `GET /.well-known/oauth-authorization-server[/mcp]` | RFC 8414                              |
| `POST /oauth/register`                              | RFC 7591 dynamic client registration  |
| `GET/POST /oauth/authorize`                         | OAuth 2.1 + RFC 7636 PKCE (S256 only) |
| `POST /oauth/token`                                 | `authorization_code`, `refresh_token` |
| `POST /oauth/revoke`                                | RFC 7009                              |

The flow: an unauthenticated call to `/mcp` returns `401` with

```
WWW-Authenticate: Bearer error="invalid_token", error_description="…",
  resource_metadata="https://host/.well-known/oauth-protected-resource/mcp",
  scope="profile:read profile:write workouts:read workouts:write social:read"
```

which is the entire bootstrap — the client follows it to the resource metadata,
then to the authorization server metadata, registers, and runs the code flow.

### Security properties

- **PKCE S256 is mandatory.** `plain` is refused, and an authorize request with
  no `code_challenge` is rejected.
- **Tokens are audience-bound** (RFC 8707). Access tokens carry the canonical
  MCP resource URL and `/mcp` rejects anything minted for a different audience.
  This is also why MCP uses opaque tokens rather than the app's JWTs: a mobile
  session token can never be replayed against the connector, or vice versa.
- **Opaque and hashed at rest.** Only SHA-256 digests are stored, so a database
  leak yields nothing replayable.
- **Replay burns the grant.** Reusing an authorization code revokes every token
  issued from it (OAuth 2.1 §7.5.1); reusing a rotated refresh token revokes the
  entire token family. Both claims are atomic `UPDATE … WHERE … IS NULL`, so
  concurrent attempts can only have one winner.
- **Refresh tokens rotate** on every use — required for public clients, which is
  what DCR registers Claude as.
- **Redirect URIs match exactly**, with the single RFC 8252 §7.3 exception that
  loopback redirects ignore the port (so Claude Code's ephemeral port works).
  Plain HTTP is only registerable for loopback hosts.
- **Consent form parameters are HMAC-signed**, so the scopes and redirect URI
  that were validated when the page rendered are the ones used on submit.
- **Sign-in and registration are rate limited** (10 sign-ins per 15 min per
  IP+username; 20 registrations per hour per IP).

## Deployment

Set `PUBLIC_BASE_URL` to the API's public origin (e.g.
`https://api.uplifting.app`). Every OAuth URL and the token audience derive from
it, and pinning it means a spoofed `Host` header cannot shift the audience a
token is minted for. When unset, the origin is reconstructed from
`X-Forwarded-Proto` / `X-Forwarded-Host` — fine for local development, not for
production.

`JWT_SECRET` is reused to sign consent-form request tokens, so it must be set.

`MCP_DOCS_URL` is optional: when set, it is advertised as
`resource_documentation` / `service_documentation` in the metadata documents.

Notes:

- Everything must be served over HTTPS in production; Claude will not run the
  flow over plain HTTP to a non-loopback host.
- Do not put the MCP URL behind a redirect. A `301`/`302` drops the
  `Authorization` header; register the final URL.
- Anthropic's egress comes from `160.79.104.0/21` if you allowlist.
- The rate limiter is per process. Running more than one API instance multiplies
  the effective limits — move the counters to Postgres or Redis if that happens.

### Housekeeping

Expired authorization codes and expired/long-revoked tokens are pruned
opportunistically from the token endpoint. There is no scheduler in this
deployment and the tables stay small, so an occasional sweep is cheaper than a
cron job.

## Local development

```bash
docker-compose up -d
bun api db:migrate
PUBLIC_BASE_URL=http://localhost:8080 bun api dev
```

Then point the [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
at `http://localhost:8080/mcp` and let it run the OAuth flow:

```bash
npx @modelcontextprotocol/inspector
```

The transport is stateless Streamable HTTP with JSON responses — no session IDs
and no SSE, so any instance can serve any request and `curl` works for poking at
it directly.
