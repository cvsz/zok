# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-20  
**Canonical branch:** `main`  
**Active implementation branch:** `feat/postgres-storage-foundation` / PR #6  
**Canonical runtime:** Vite + React frontend with Express API adapter  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This file is the canonical execution source for release work. Every cycle selects the highest-priority incomplete unit that can be implemented and verified safely, records exact evidence, and synchronizes this file with `IMPLEMENTATION-CHECKLIST.md` and `CHANGELOG.md`.

## 1. Release objective and rules

Deliver Zok as a production-ready conversational-commerce platform without treating UI simulations, mock integrations, demo AI behavior, static metrics, or local-only persistence as production capability.

1. No item is complete without current evidence.
2. Security/release gates are not weakened to make a change pass.
3. Code-changing cycles add/update tests and run relevant gates.
4. Completed cycles synchronize `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md`.
5. Broader phases remain incomplete when only a bounded subset is verified.

## 2. Current architecture baseline

```text
Browser
  -> Vite/React client
  -> src/lib/api.js
  -> Express API adapter
  -> auth/session/origin/CSRF/rate-limit/validation middleware
  -> explicit storage boundary (`createJsonStorage` today)
  -> serialized atomic JSON persistence

PostgreSQL adapter contract
  -> injected pool contract
  -> explicit transaction boundary
  -> validated tenant UUID / authenticated identity tenantId
  -> transaction-local `app.tenant_id`
  -> parameterized `set_config`
  -> commit/rollback + guaranteed client release

CI durable-data path
  -> PostgreSQL 17 service
  -> 001 initial schema
  -> 002 forced tenant RLS
  -> 003 tenant-scoped relational integrity
  -> runtime negative/concurrency assertions
  -> rollback/replay verification
```

The Express request path no longer owns filesystem persistence logic directly: `readDB()`/`updateDB()` delegate through the tested storage adapter boundary. The active Express adapter remains JSON-backed. The PostgreSQL foundation now includes a pool-injected transaction adapter contract with fail-closed tenant validation and an authenticated-identity binding entry point, but no production Node PostgreSQL pool driver is installed/wired and Express sessions do not yet carry tenant IDs. PostgreSQL is therefore not yet the application runtime store.

## 3. Master priority queue

### P0 — Gold-Master blockers

- [ ] Replace local JSON persistence with durable PostgreSQL application runtime storage and verified cutover/rollback.
- [ ] Introduce tenant-aware application identity and deny-by-default RBAC.
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

Completed with current repository/CI evidence:

- [x] JSON storage adapter contract with serialized atomic writes and corrupt-state fail-closed behavior.
- [x] Express request path wired through the storage abstraction without API regressions.
- [x] Initial PostgreSQL multi-tenant schema and explicit rollback DDL.
- [x] Real PostgreSQL migration up/down/replay verification.
- [x] Forced RLS on tenant-owned tables using fail-closed `app.tenant_id` policies.
- [x] RLS negative tests through a non-superuser `NOBYPASSRLS` application role.
- [x] Tenant-scoped composite foreign keys preventing cross-tenant object references.
- [x] Concurrent PostgreSQL uniqueness/integrity verification.
- [x] Pool-injected PostgreSQL transaction boundary with explicit begin/commit/rollback, transaction-local tenant context, guaranteed release, and pool shutdown.
- [x] Authenticated identity object can be fail-closed bound to its validated `tenantId` before entering the tenant transaction boundary.

Still incomplete:

- [ ] Production PostgreSQL Node driver/pool installed with a synchronized lockfile and real pool integration coverage.
- [ ] Express-authenticated session/principal carries a validated tenant ID.
- [ ] Application-authenticated tenant context proven end-to-end from request principal through every PostgreSQL transaction.
- [ ] Live Express persistence switched from JSON adapter to PostgreSQL adapter with equivalent regression coverage.
- [ ] Production cutover from JSON to PostgreSQL with data migration and rollback evidence.
- [ ] Backup/restore drill and recorded RPO/RTO.

## 5. Verification gates

### Gate A
`npm ci` and `npm audit --omit=dev --audit-level=high` — reproducible install and no unresolved production high/critical vulnerability.

### Gate B
`npm test`, `npm run lint`, `npm run typecheck` — security-sensitive negative cases fail closed and static gates remain green.

### Gate C
`npm run build`, production start/health, and deployment-environment TLS/secure-cookie checks.

### Gate D
Tenant/RBAC security review, provider replay/contract evidence, AI evaluations, penetration test/remediation, load/capacity evidence, backup restore drill/RPO/RTO, privacy lifecycle evidence, canary/rollback proof, operational sign-off.

## 6. Current CI target state

CI currently enforces release-document presence, PostgreSQL 17 service health, real database tests, `npm ci`, tests, lint, typecheck, build, production dependency audit, least-privilege permissions, and concurrency cancellation. Workflow failures are release blockers until triaged.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Install/wire a real PostgreSQL Node pool driver with a synchronized lockfile and exercise the transaction adapter against the PostgreSQL CI service.
2. Add a validated tenant ID to the authenticated application principal/session and use `withIdentityTransaction` at the database boundary.
3. Switch the Express storage boundary from JSON to PostgreSQL with equivalent API regression coverage.
4. Cut over production persistence with migration/rollback and backup/restore evidence.
5. Implement deny-by-default RBAC + append-only audit foundation.
6. Shared session/rate-limit state.
7. Provider-neutral event + queue/retry/idempotency base and first channel adapter/consent enforcement.
8. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
9. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Current execution evidence — 2026-08-20 PostgreSQL identity-to-tenant transaction binding

**Branch:** `feat/postgres-storage-foundation`  
**PR:** #6 (draft)

- Reused the existing durable-data PR; no duplicate PR was created.
- Confirmed the current branch was green at CI `32335166312` before this cycle.
- Explored direct Express-session tenant propagation with a failing regression probe; CI `32337797235` failed exactly because login/me responses lacked `tenantId`. That exploratory test was reverted because the current connector could not safely patch the large `server.js` file without whole-file replacement. No server-side tenant-principal capability is claimed from that probe.
- Added TDD coverage in `test/postgres-storage.test.js` for an authenticated identity object carrying `tenantId` and for fail-closed rejection before pool acquisition when the identity lacks a valid tenant ID.
- TDD red: CI `32337912124` failed because `withIdentityTransaction` did not exist.
- Implemented `withIdentityTransaction(identity, operation)` in `server/storage/postgres-storage.js`; it validates identity shape and tenant UUID, then delegates to the existing transaction-local tenant boundary.
- Green: CI `32337964164` passed `npm ci`, all tests, lint, typecheck, production build, and production dependency audit.

### Residual boundary

The parent durable-data and tenant-aware identity P0 items stay unchecked. The live Express adapter remains JSON-backed; no production PostgreSQL Node pool driver is installed, Express sessions still do not carry tenant IDs, and no end-to-end request-principal-to-PostgreSQL-transaction path has been proven. Production migration/cutover/rollback and backup/restore evidence also remain absent.

### Next safe unit

Generate and commit a synchronized lockfile for the selected PostgreSQL Node driver in a normal npm-enabled checkout, wire its pool into the verified adapter, and add real PostgreSQL pool integration tests. After that is green, propagate a validated tenant ID into the Express authenticated principal and bind request-driven database operations through `withIdentityTransaction`.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
