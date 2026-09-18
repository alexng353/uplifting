# Exercise Agent Implementation Plan

Goal: durable admin exercise draft generation and review from mobile and MCP.
Architecture: one Postgres-backed service owns state transitions; HTTP and MCP are adapters; provider returns validated draft or clarification; notification delivery is retried independently.
Tech stack: Bun, Elysia, Drizzle/Postgres, Expo, OpenRouter, MCP SDK.
Spec: ../specs/2026-09-18-exercise-agent.md

## Constraints

- No model write access to exercises; explicit revision-checked approval only.
- Scope every operation to the authenticated admin who created it.
- Respect cancellation, stale workers, duplicate approvals and existing catalog duplicates.
- Keep credentials out of source and artifacts.
- Generate migrations with drizzle-kit.
- Work only in the exercise-agent worktree.

## Tasks

- [x] Backend: write real-Postgres tests for approval/idempotency, ownership, cancellation, follow-up and expired leases; implement schema, validation, OpenRouter adapter, service, worker and routes; generate migration and run tests.
- [x] Mobile: implement authenticated admin entry, session list/detail, name submission, draft preview, follow-up, approval/cancel and Expo notifications. Verify typecheck and notification registration/error handling.
- [x] MCP: stdio SDK adapter forwarding authenticated HTTP operations; tool approval requires revision. Test protocol and denied access.
- [x] Eval: reproducible catalog holdout and cheap-model comparison; structured validity, fields, muscles, ambiguity, costs, latency. No gold-answer leakage. Run with user credential when available.
- [x] Integration: formatter, lint, typecheck and API tests; independent review; fix findings; commit and push feature branch. Report unexercised live push/model boundaries accurately.
