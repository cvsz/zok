# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-20  
**Canonical branch:** `main`  
**Active implementation branch:** `feat/postgres-storage-foundation` / PR #6  
**Canonical runtime:** Vite + React frontend with Express API adapter  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This file is the canonical execution source for release work. Every cycle selects the highest-priority incomplete unit that can be implemented and verified safely, records exact evidence, and synchronizes this file with `IMPLEMENTATION-CHECKLIST.md` and `CHANGELOG.md`.

## 1. Release objective

Deliver Zok as a production-ready conversational-commerce platform without treating UI simulations, mock integrations, demo AI behavior, static metrics, or local-only persistence as production capability.

### Non-negotiable rules

1. No item is complete without current evidence.
2. Security/release gates are not weakened to make a change pass.
3. Code-changing cycles must add or update tests and run relevant gates.
4. Every completed cycle updates `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` together.
5. Architecture/security behavior changes also update relevant operational documentation.
6. Broader phases remain incomplete when only a bounded subset is verified.

## 2. Current architecture baseline

```text
Browser
  -> Vite/React client
  -> src/lib/api.js
  -> Express API adapter
  -> auth/session/origin/CSRF/rate-limit/validation middleware
  -> live serialized atomic JSON persistence

CI durable-data verification
  -> PostgreSQL 17 service
  -> 001_initial.up.sql
  -> runtime assertions
  -> 001_initial.down.sql
  -> replayed up/down verification
```

Evidence now includes a tested JSON storage adapter boundary, an initial tenant-scoped PostgreSQL schema, explicit rollback DDL, and real PostgreSQL migration up/down/replay execution in GitHub Actions. The live Express request path still uses JSON; PostgreSQL is not yet the production runtime store.

## 3. Master priority queue

### P0 — Gold-Master blockers

- [ ] Replace local JSON persistence with durable PostgreSQL runtime storage and migrations.
- [ ] Introduce tenant-aware identity and deny-by-default RBAC.
- [ ] Persist append-only audit events for privileged and data-changing actions.
- [ ] Move sessions and rate-limit state to shared production-capable storage.
- [ ] Define provider-neutral channel event contracts.
- [ ] Implement webhook signature verification, idempotency, retries, dead-letter handling, and delivery receipts.
- [ ] Implement consent/opt-out enforcement for outbound communication.
- [ ] Move AI policy decisions server-side with prompt/model versioning, risk controls, approval flows, cost/latency records, and evaluation suites.
- [ ] Complete production edge verification for HTTPS, reverse proxy, secure cookies, health, and rollback.
- [ ] Complete independent security review, load test, backup/restore drill, privacy review, and release sign-off.

### P1 — Production capability

- [ ] Implement real channel adapters for publicly claimed channels.
- [ ] Implement durable campaigns/broadcast workers.
- [ ] Implement multi-touch event schema and attribution reconciliation.
- [ ] Implement migration import with dry-run, idempotency, resumability, and rollback.
- [ ] Implement POS/e-commerce provider adapters with replay-safe contracts.
- [ ] Add metrics, traces, structured logs, SLOs, alerts, and incident runbooks.
- [ ] Add tenant-scoped API keys, rotation, revocation, and secrets handling.
- [ ] Add export/delete/retention workflows for privacy obligations.

### P2 — Product completeness

- [ ] Persist onboarding/setup wizard state.
- [ ] Implement Academy enrollment/completion/certificate verification.
- [ ] Implement marketplace ownership, publishing, moderation, and versioning.
- [ ] Add production-backed analytics and operational reporting.
- [ ] Replace remaining UI-only simulations with explicit sandbox labeling or real services.
- [ ] Split oversized frontend bundles and enforce performance budgets.

### P3 — Release polish

- [ ] Accessibility audit/remediation.
- [ ] Cross-browser/device regression suite.
- [ ] Final documentation consistency audit.
- [ ] Release/migration notes.
- [ ] Support/operator training material.
- [ ] Signed Gold Master evidence record.

## 4. Durable-data progress

Completed evidence-backed subunits:

- [x] JSON storage adapter contract with serialized atomic writes and corrupt-state fail-closed behavior.
- [x] Initial PostgreSQL schema for tenants, roles/users, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events.
- [x] Structural schema regression coverage.
- [x] PostgreSQL migration up/down verification against a real PostgreSQL 17 service.
- [x] Migration replay after complete rollback.

Still incomplete:

- [ ] Express request path wired to a storage abstraction.
- [ ] PostgreSQL runtime adapter with connection pooling and explicit transaction boundaries.
- [ ] Production cutover from JSON to PostgreSQL.
- [ ] Runtime tenant-isolation enforcement and negative tests.
- [ ] PostgreSQL concurrent-write/integrity tests.
- [ ] Backup/restore drill and recorded RPO/RTO.

## 5. Verification gates

### Gate A — dependency/repository integrity

```bash
npm ci
npm audit --omit=dev --audit-level=high
```

Required: reproducible install, no unresolved production high/critical vulnerability, no committed secrets/runtime DB/build output.

### Gate B — automated verification

```bash
npm test
npm run lint
npm run typecheck
```

Required: tests pass, no lint errors, typecheck passes, security-sensitive negative cases fail closed.

### Gate C — build/runtime smoke

```bash
npm run build
NODE_ENV=production npm start
curl -fsS http://127.0.0.1:3005/api/health
```

Required: successful build/start/health plus deployment-environment HTTPS/secure-cookie verification.

### Gate D — enterprise evidence

Required before Gold Master: tenant/RBAC security review, provider replay/contract evidence, AI evaluations, penetration test/remediation, load/capacity test against SLOs, backup restore drill, privacy lifecycle evidence, monitored canary/rollback proof, and operational sign-off.

## 6. CI target state

Current CI enforces release-document presence, `npm ci`, tests, lint, typecheck, build, production dependency audit, least-privilege permissions, concurrency cancellation, and a health-checked PostgreSQL 17 service for migration execution. Workflow failures remain release blockers until triaged and recorded.

## 7. Execution order

Unless a security/CI blocker supersedes it:

1. Finish durable PostgreSQL runtime foundation: tenant-isolation enforcement/tests, storage wiring, PostgreSQL adapter/pool/transactions, production cutover, concurrent integrity, backup/restore.
2. Tenant identity/RBAC + append-only audit foundation.
3. Shared session/rate-limit state.
4. Provider-neutral events + queue/retry/idempotency base.
5. First verified channel adapter + consent enforcement.
6. AI policy/evaluation service.
7. Privacy lifecycle + migration/attribution/POS.
8. Observability, load/DR/security exercises.
9. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate from this P0 implementation branch until their compatibility is independently verified.

## 8. Current execution evidence — PostgreSQL runtime migration slice

**Branch:** `feat/postgres-storage-foundation`  
**PR:** #6 (draft)

1. Inspected current plan, open PRs, and CI; reused PR #6.
2. Added `test/postgres-migration-runtime.test.js` before implementation.
3. Added PostgreSQL 17 service configuration to `.github/workflows/ci.yml` with a health check and dedicated test database URL.
4. TDD red: CI `32330868918` reached a healthy PostgreSQL service, confirmed `psql`, and failed only on intentionally absent `scripts/postgres-migrations.js`; pre-existing tests passed.
5. Added `scripts/postgres-migrations.js` with fail-fast `psql`, `ON_ERROR_STOP=1`, explicit migration paths, and single-transaction execution.
6. Corrected an initial stdin invocation before completion so migration files are executed deterministically from repository paths.
7. Green: CI `32330980037` successfully executed initial migration up, verified all expected tables, rolled down, verified teardown, replayed up, rolled down again, then passed all tests, lint, typecheck, production build, and dependency audit.

### Status after this slice

- `Migration up/down verification added` is complete and checked in `IMPLEMENTATION-CHECKLIST.md`.
- The parent P0 durable PostgreSQL item remains incomplete because the live Express runtime still uses JSON.
- No claim is made for production PostgreSQL cutover, runtime tenant isolation, connection pooling, backup/restore, or horizontal scaling.

### Next safe unit

Add runtime tenant-isolation enforcement/negative tests on PostgreSQL, then continue toward wiring the Express storage boundary and a production PostgreSQL adapter without changing current API behavior until equivalent coverage is green.

## 9. Release decision

**Current verdict: FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion is forbidden until every P0 blocker has current evidence and Gate D is signed off.
