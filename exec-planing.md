# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-20  
**Canonical branch:** `main`  
**Current implementation PR:** #16 (`feat/postgres-chat-route-gate`, draft/unmerged)  
**Current main baseline for this cycle:** `66142a5a98229efd6035ffacf184dfb896fbb76f`  
**Canonical runtime:** Vite + React frontend with Express API adapter  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This file is the canonical execution source for release work. Every cycle selects the highest-priority incomplete unit that can be implemented and verified safely, records exact evidence, and synchronizes this file with `IMPLEMENTATION-CHECKLIST.md` and `CHANGELOG.md`.

## 1. Release objective and execution rules

Deliver Zok as a production-ready conversational-commerce platform without treating UI simulations, mock integrations, demo AI behavior, static metrics, or local-only persistence as production capability.

1. No item is complete without current evidence.
2. Security/release gates are not weakened to make a change pass.
3. Code-changing cycles add/update tests and run relevant gates.
4. Completed cycles synchronize `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md`.
5. A bounded verified slice does not complete its broader production phase.
6. Configuration gates must fail closed for unsafe/missing prerequisites; rollback paths remain explicit until cutover evidence exists.

## 2. Current architecture baseline

```text
Browser
  -> Vite/React client
  -> Express API adapter
  -> authenticated session principal
       -> validated configured tenantId
  -> request-to-transaction binding
  -> PostgreSQL storage transaction
       -> real pg.Pool
       -> BEGIN
       -> transaction-local app.tenant_id
       -> normalized tenant-scoped repositories
       -> COMMIT / ROLLBACK
       -> guaranteed client release

Normalized PostgreSQL foundation
  -> contacts repository
  -> conversations/messages repository
  -> deterministic legacy chat compatibility mapper
  -> request-bound legacy chat runtime
  -> RLS + tenant-scoped composite FK enforcement

Live/default application data path
  -> ZOK_CHAT_STORAGE=json (default)
  -> createJsonStorage
  -> serialized atomic JSON persistence

Bounded opt-in path on draft PR #16
  -> ZOK_CHAT_STORAGE=postgres + required ZOK_POSTGRES_URL
  -> /api/chats message history read via request-bound PostgreSQL runtime
  -> /api/chats/:id/messages write via request-bound PostgreSQL runtime
  -> JSON still owns legacy chat metadata/unread/tags
  -> missing expected legacy imports fail closed
```

PR #6 merged the schema/RLS/transaction/repository/compatibility foundation. PR #15 subsequently merged the CI-verified request-bound legacy chat PostgreSQL runtime. Main then advanced through separately scoped Dependabot PR #12 to `66142a5a98229efd6035ffacf184dfb896fbb76f`. Draft PR #16 adds only an explicit opt-in PostgreSQL **message** path; JSON remains the default runtime and rollback path. This is not a full application-store cutover.

## 3. Master priority queue

### P0 — Gold-Master blockers

- [ ] Replace local JSON persistence with durable PostgreSQL application runtime storage and verified migration/cutover/rollback.
- [ ] Introduce production tenant-aware application identity and deny-by-default RBAC.
- [ ] Persist append-only audit events for privileged and data-changing actions.
- [ ] Move sessions and rate-limit state to shared production-capable storage.
- [ ] Define provider-neutral channel event contracts.
- [ ] Implement webhook signature verification, idempotency, retries, dead-letter handling, and delivery receipts.
- [ ] Implement consent/opt-out enforcement for outbound communication.
- [ ] Move AI policy decisions server-side with prompt/model versioning, risk controls, approval flows, cost/latency records, and evaluation suites.
- [ ] Complete production edge verification for HTTPS, reverse proxy, secure cookies, health, and rollback.
- [ ] Complete independent security review, load test, backup/restore drill, privacy review, and release sign-off.

### P1 — Production capability
- [ ] Real publicly claimed channel adapters and durable campaign workers.
- [ ] Multi-touch attribution and reconciliation.
- [ ] Migration import with dry-run/idempotency/resumability/rollback.
- [ ] Replay-safe POS/e-commerce adapters.
- [ ] Metrics, traces, structured logs, SLOs, alerts, incident runbooks.
- [ ] Tenant-scoped API keys, rotation, revocation, secrets handling.
- [ ] Export/delete/retention privacy workflows.

### P2 — Product completeness
- [ ] Persist onboarding/setup state.
- [ ] Academy enrollment/completion/certificate verification.
- [ ] Marketplace ownership/publishing/moderation/versioning.
- [ ] Production-backed analytics/reporting.
- [ ] Replace or explicitly label remaining UI simulations.
- [ ] Frontend code splitting/performance budgets.

### P3 — Release polish
- [ ] Accessibility and cross-browser/device regression.
- [ ] Documentation consistency audit.
- [ ] Release/migration notes and operator training.
- [ ] Signed Gold Master evidence record.

## 4. Durable-data progress

Completed with current repository evidence:

- [x] JSON adapter with serialized atomic writes and corrupt-state fail-closed behavior.
- [x] Express request path wired through an explicit storage boundary.
- [x] Initial PostgreSQL multi-tenant schema and rollback DDL.
- [x] Real PostgreSQL migration up/down/replay verification.
- [x] Forced RLS and non-superuser/NOBYPASSRLS negative tests.
- [x] Tenant-scoped composite foreign keys and concurrent integrity verification.
- [x] Real `pg.Pool` transaction adapter with transaction-local tenant context.
- [x] Authenticated identity/request-to-transaction fail-closed binding.
- [x] Tenant-scoped contacts and conversations/messages repositories.
- [x] Contact → conversation → message integration under PostgreSQL RLS and tenant-scoped relational integrity.
- [x] Deterministic legacy `/api/chats` compatibility mapper. Evidence: `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, `777af487395161b74fc1be472d1f5ddd448c73fb`, repair `42c1c4995de3f3a22d743f53dd6a630747a32884`, CI `32351874076`.
- [x] Request-bound legacy chat PostgreSQL runtime. Evidence: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`, CI `32357209712`, synchronized-head CI `32357391343`; merged via PR #15 on 2026-08-20.
- [x] Bounded configuration-gated Express chat message path on draft PR #16. `ZOK_CHAT_STORAGE=json|postgres` defaults to JSON; PostgreSQL mode requires `ZOK_POSTGRES_URL`, uses the request-bound runtime for message reads/writes, and fails closed for missing expected imports. Evidence: gate `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, route integration `7ca81445a222ba901413d95df8b5074a496b94f0`, service-backed API test `542bf524de74d4d87fdee978a38bf61e30fa298f`, CI `32362476402`.

Still incomplete:

- [ ] Deterministic JSON→PostgreSQL chat import with dry-run, idempotency/replay, resumability, and explicit rollback proof.
- [ ] Move chat metadata/unread/tags from JSON only after import/cutover evidence is green.
- [ ] Migrate remaining live resources: campaigns, integrations, AI config, flow state.
- [ ] Verify complete JSON→PostgreSQL application cutover and rollback.
- [ ] Verify backup/restore with recorded RPO/RTO.
- [ ] Replace the configured-admin tenant model with production user/tenant/role resolution and deny-by-default RBAC.

## 5. Verification gates

### Gate A
`npm ci` and `npm audit --omit=dev --audit-level=high` — reproducible install and no unresolved production high/critical vulnerability.

### Gate B
`npm test`, `npm run lint`, `npm run typecheck` — security-sensitive negative cases fail closed and static gates remain green.

### Gate C
`npm run build`, production start/health, and deployment-environment TLS/secure-cookie checks.

### Gate D
Tenant/RBAC security review, provider replay/contract evidence, AI evaluations, penetration test/remediation, load/capacity evidence, backup restore drill/RPO/RTO, privacy lifecycle evidence, canary/rollback proof, operational sign-off.

## 6. CI target state

CI enforces release-document presence, PostgreSQL 17 service/client availability, real migrations/RLS/repository integration, `npm ci`, tests, lint, typecheck, build, production dependency audit, least-privilege permissions, and concurrency cancellation. Workflow failures remain release blockers until triaged.

Current route-gate implementation-head evidence: CI `32362476402` completed successfully with every release-verification step green.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Build a deterministic legacy chat JSON→PostgreSQL import command with dry-run and idempotency/replay tests; keep `ZOK_CHAT_STORAGE=json` as default.
2. Add resumability/cutover and explicit rollback verification for chat import, then widen the gated chat surface only after API/security/migration evidence is green.
3. Migrate chat metadata/unread/tags, then add PostgreSQL repositories for campaigns and integrations, followed by AI/flow state.
4. Complete application-wide JSON→PostgreSQL cutover + rollback and backup/restore evidence.
5. Implement production tenant-aware user identity, deny-by-default RBAC, append-only audit enforcement, then shared sessions/rate-limit state.
6. Provider-neutral event + queue/retry/idempotency base and first channel adapter/consent enforcement.
7. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
8. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Prior merged durable-data cycles

### PR #6 — foundation

- Merged PostgreSQL schema/migrations, RLS, transaction-local tenant context, authenticated request binding, normalized repositories, and pure legacy chat mapping.
- Green synchronized-head CI before merge: `32352025017`.
- Merge foundation commit recorded as `edbc8ba85a534e49fe3881b24c8a55560671421f`.

### PR #15 — bounded request runtime

- Added exact external-thread lookup and ordered message reads (`d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`).
- Added authenticated request → `withRequestTransaction` → normalized conversations runtime (`e95d2751804bed7c7a3b9ff055b5108829de8a54`).
- Added tenant/input/read/write regression coverage (`81abadeb91261ebeb232ca71d3fed88069f40223`).
- CI `32357209712` passed release docs, PostgreSQL service/client, `npm ci`, tests, lint, typecheck, build, and production audit; synchronized head also passed `32357391343`.
- PR #15 merged on 2026-08-20. It did not switch `server.js` to PostgreSQL.

## 9. Current execution cycle — draft PR #16

**Branch:** `feat/postgres-chat-route-gate`  
**PR:** #16 (draft, open, unmerged)  
**Base at branch creation:** `66142a5a98229efd6035ffacf184dfb896fbb76f`

Repository state was refreshed before changes. PR #15 was already merged and main had subsequently advanced via separately scoped Dependabot PR #12. Existing open dependency PRs were left outside this P0 implementation track.

Implementation evidence:

- `6eb110c4008b8fd8646fbd07a9c37d981e639da1` adds the explicit chat storage gate. Unsupported modes and PostgreSQL mode without a connection string fail at startup; JSON remains default.
- `7ca81445a222ba901413d95df8b5074a496b94f0` wires GET `/api/chats` message history and POST `/api/chats/:id/messages` message persistence through the request-bound PostgreSQL runtime when enabled, while preserving authentication, CSRF, validation, legacy response shape, and JSON metadata/unread/tags behavior.
- Missing expected imported `legacy-chat:<id>` state produces `503` rather than silently falling back to potentially divergent JSON message history.
- `542bf524de74d4d87fdee978a38bf61e30fa298f` adds a PostgreSQL 17 service-backed API regression using an isolated database and a non-superuser/NOBYPASSRLS application role. It verifies authenticated PostgreSQL reads, CSRF-protected writes, persistence on reread, and the simulated reply path.
- CI `32362476402` passed release-document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Residual boundary

The durable-data P0 parent remains unchecked. This is not a production migration or complete live-data cutover. Chat metadata/unread/tags and all non-chat resources remain JSON-backed. PostgreSQL mode assumes required legacy thread data was imported beforehand; deterministic import/dry-run/idempotency/resume/rollback evidence does not yet exist. Backup/restore, production multi-user tenant identity/RBAC, append-only audit enforcement, shared sessions/rate-limit state, provider delivery controls, AI governance, and Gate D are still incomplete.

Local clone/install verification was not available because the automation environment could not resolve `github.com`; no local-pass claim is made. GitHub Actions is the execution evidence for this cycle.

## 10. Next safe unit

Implement deterministic chat JSON→PostgreSQL import as a standalone bounded command with dry-run and idempotency/replay verification against PostgreSQL CI. Do not flip the default storage mode, remove JSON rollback, or widen the live PostgreSQL surface until import and rollback evidence is green.

## 11. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
