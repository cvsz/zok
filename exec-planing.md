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

CI durable-data path
  -> PostgreSQL 17 service
  -> 001 initial schema
  -> 002 forced tenant RLS
  -> 003 tenant-scoped relational integrity
  -> runtime negative/concurrency assertions
  -> rollback/replay verification
```

The Express request path no longer owns filesystem persistence logic directly: `readDB()`/`updateDB()` delegate through the tested storage adapter boundary. The active adapter remains JSON-backed. The PostgreSQL foundation has real-service migration execution, fail-closed tenant row isolation, tenant-scoped relational keys, and concurrent uniqueness evidence, but PostgreSQL is not yet the application runtime store.

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

Still incomplete:

- [ ] PostgreSQL application adapter with connection pooling and explicit transaction boundaries.
- [ ] Application-authenticated tenant context safely bound to every PostgreSQL transaction.
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

1. Implement PostgreSQL application adapter/pool/transactions and bind authenticated tenant context per transaction.
2. Switch the Express storage boundary from JSON to PostgreSQL with equivalent API regression coverage.
3. Cut over production persistence with migration/rollback and backup/restore evidence.
4. Implement tenant-aware identity/RBAC + append-only audit foundation.
5. Shared session/rate-limit state.
6. Provider-neutral event + queue/retry/idempotency base and first channel adapter/consent enforcement.
7. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
8. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Current execution evidence — 2026-08-20 Express storage-boundary wiring

**Branch:** `feat/postgres-storage-foundation`  
**PR:** #6 (draft)

- Added `test/storage-boundary-wiring.test.js` before implementation.
- TDD red: CI `32333253897` failed on the new architecture requirement while the PostgreSQL service, release-control checks, and dependency installation remained healthy.
- Refactored `server.js` to import and instantiate `createJsonStorage`, preserving the existing default data and validation contract.
- Removed `server.js`-owned filesystem persistence internals (`atomicWrite`, `ensureDB`, local mutation queue) and made `readDB()`/`updateDB()` delegate to the adapter.
- Green: CI `32333372481` passed the storage-boundary test, existing API regression suite, PostgreSQL migration/isolation/integrity tests, lint, typecheck, production build, and production dependency audit.

### Residual boundary

The parent durable-data P0 item stays unchecked. The active adapter is still JSON-backed; no PostgreSQL application connection pool/transaction adapter is wired, authenticated tenant context is not yet bound to application DB transactions, and production migration/cutover/rollback plus backup/restore evidence do not exist.

### Next safe unit

Implement a PostgreSQL application adapter contract with pooled connections and explicit transaction-scoped tenant context, test it against the existing PostgreSQL CI service, then switch the Express boundary only after equivalent API behavior is proven.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
