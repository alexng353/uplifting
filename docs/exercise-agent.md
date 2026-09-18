# Admin exercise drafts

Admins open **Settings → Exercise drafts**, enter a name, and leave the screen while the server generates a proposal. Drafts show the name, equipment, description, movement pattern, muscle group, and primary/secondary muscle names. Approval publishes the reviewed revision. Follow-ups preserve the conversation and replace the draft with a new revision; cancellation fences out late worker responses.

## Setup

1. Apply generated migrations with `bun api db:migrate`.
2. Supply `OPENROUTER_API_KEY` to the API environment; never put it in Expo public variables or the mobile bundle.
3. Set `EXERCISE_AGENT_MODEL` to the evaluated model ID (default `openai/gpt-5.6-luna`).
4. Start the API. Its worker leases Postgres jobs, so no additional broker is required.
5. Build a new native app with the `expo-notifications` plugin and configure APNs/FCM through the existing Expo project. Native push requires a physical-device verification after installing the build. If Expo enhanced push security is enabled, set server-only `EXPO_ACCESS_TOKEN`.
6. Configure the local [MCP adapter](../apps/mcp/README.md) with an existing admin login token and the API origin.

No production migrations, deployments, credential configuration, or app submissions are performed merely by applying this branch.

## Boundaries

All endpoints require authentication and current admin membership. Sessions belong to the initiating admin. Both the app and MCP use these same routes. MCP uses a local stdio transport, not a hosted unauthenticated endpoint. Its existing access JWT expires normally; it does not mint or refresh tokens.

The model has no database mutation tools. Responses are checked against the schema and exact muscle vocabulary. Ambiguous requests become clarification questions. Search is disabled. Approval revalidates the proposal, rejects an existing official name, and inserts the exercise and muscle relations in one transaction. Concurrent approval of the same revision returns the same exercise.

Each user can have three active jobs and create thirty sessions per day. Each session permits twenty revisions. Generation has a 90-second timeout, a two-minute worker lease, a 4,000-token output cap, and at most three attempts per revision. A crashed worker's lease can be recovered. Cancellation and follow-up revisions invalidate stale results. API shutdown closes HTTP/database resources with a bounded deadline.

Notifications use an independent durable outbox with five delivery attempts. They contain generic text and a session ID, not exercise details. Push-ticket acceptance is not delivery confirmation; OS permission, Expo/APNs/FCM, and device connectivity can prevent delivery. The persisted session list remains available without push. An offline logout can leave a generic queued notification, but opening it still requires the current owner/admin account. Dead Expo device tokens are removed when reported by the send endpoint.

## Validation

`bun run test:api` uses disposable real Postgres databases and isolates each suite's module mocks. It covers signed HTTP auth, revoked admin access, ownership, revision conflicts, cancellation, stale leases, retry exhaustion, duplicate publication, queue limits, outbox submission, and actual API process shutdown.

`bun test apps/mcp/src/server.test.ts` tests the SDK stdio protocol and forwarding against a local fake HTTP server, including credential-safe errors and redirect rejection.

`bun test apps/mobile/lib/exercise-agent.test.ts` tests action eligibility and notification route validation. Typechecking and an iOS Metro/Hermes export validate integration, but do not prove physical-device delivery.

See [the evaluation harness](../scripts/exercise-eval/README.md) for reproducible held-out model comparisons and their limits.

A September 18, 2026 live smoke test used the actual OpenRouter provider and durable worker with a disposable local database seeded from the official catalog. Luna generated an Incline Smith Machine Bench Press draft, publication was absent before approval, and approval inserted the exercise with five muscle relations in approximately 3.5 seconds. This was not a production mutation or physical-device notification test.

Final verification after rebasing onto main: 40 automated tests passed across API, mobile, MCP, and eval suites; all three workspace typechecks and formatting passed. Lint returned no errors and eleven pre-existing warnings. The iOS bundle exported successfully; native installation and push delivery still require device verification.
