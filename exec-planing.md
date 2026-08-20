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
  -> Express API adapter
  -> authenticated session principal
       -> validated configured tenantId
  -> request-to-transaction binding helper
  -> PostgreSQL storage transaction boundary
       -> real pg.Pool
       -> BEGIN
       -> transaction-local app.tenant_id
       -> parameterized set_config
       -> COMMIT / ROLLBACK
       -> guaranteed client release

Live application data path today
  -> explicit storage boundary
  -> createJsonStorage
  -> serialized atomic JSON persistence

CI durable-data path
  -> PostgreSQL 17 service
  -> 001 initial schema
  -> 002 forced tenant RLS
  -> 003 tenant-scoped relational integrity
  -> real Node pg.Pool isolation assertions
  -> concurrency / rollback / replay verification
```

The PostgreSQL driver, synchronized npm lockfile, real pool, transaction-local tenant context, configured-admin tenant principal, and fail-closed request-to-transaction binding are now verified. The live Express data routes still use the JSON adapter because the existing JSON-shaped API state has not yet been safely mapped to the normalized relational model. PostgreSQL is therefore not yet the live application data store.

## 3. Master priority queue

### P0 — Gold-Master blockers

- [ ] Replace local JSON persistence with durable PostgreSQL application runtime storage and verified cutover/rollback.
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

Completed with current repository/CI evidence:

- [x] JSON adapter with serialized atomic writes and corrupt-state fail-closed behavior.
- [x] Express request path wired through an explicit storage boundary.
- [x] Initial PostgreSQL multi-tenant schema and rollback DDL.
- [x] Real PostgreSQL migration up/down/replay verification.
- [x] Forced RLS and non-superuser/NOBYPASSRLS negative tests.
- [x] Tenant-scoped composite foreign keys.
- [x] Concurrent uniqueness/integrity verification.
- [x] PostgreSQL transaction adapter with explicit transaction boundaries and transaction-local tenant context.
- [x] `withIdentityTransaction` fail-closed identity binding.
- [x] npm-generated synchronized `pg` dependency + lockfile.
- [x] Real `pg.Pool` integration against PostgreSQL 17 with RLS isolation.
- [x] Express configured-admin principal can carry validated `tenantId`.
- [x] Request-to-transaction binding helper rejects missing tenant identity before delegation.

Still incomplete:

- [ ] Define explicit normalized repository contracts for live Express resources instead of translating the entire JSON object implicitly.
- [ ] Switch live Express routes from JSON repositories to PostgreSQL repositories with equivalent behavior/negative regression coverage.
- [ ] Verify data import/cutover from existing JSON state and rollback.
- [ ] Verify backup/restore with recorded RPO/RTO.
- [ ] Replace the bounded configured-admin tenant model with production user/tenant/role resolution and deny-by-default RBAC.

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

CI enforces release-document presence, PostgreSQL 17 service health, real database migrations and pool/RLS tests, `npm ci`, tests, lint, typecheck, build, production dependency audit, least-privilege permissions, and concurrency cancellation. Workflow failures remain release blockers until triaged.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Define narrow PostgreSQL repository contracts for the highest-value live resources (contacts/conversations/messages first) with relational read/write semantics and tenant transaction enforcement.
2. Wire those Express routes through request identity → PostgreSQL transaction → repository, preserving current API regression behavior.
3. Migrate remaining live resources (campaigns, integrations, AI/flow state) without introducing a monolithic JSON-in-PostgreSQL compatibility shortcut.
4. Build and verify JSON→PostgreSQL import/cutover + rollback and backup/restore evidence.
5. Implement production tenant-aware user identity, deny-by-default RBAC, and append-only audit foundation.
6. Move sessions and rate-limit state to shared production storage.
7. Provider-neutral event + queue/retry/idempotency base and first channel adapter/consent enforcement.
8. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
9. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Current execution evidence — 2026-08-20 real PostgreSQL pool + request tenant binding

**Branch:** `feat/postgres-storage-foundation`  
**PR:** #6 (draft)

- Generated `pg` dependency + lockfile through npm in a temporary branch workflow and removed the temporary write-enabled workflow immediately after synchronization.
- Real pool integration TDD red: `32344793562` failed because `createPostgresPool` did not exist.
- `32344862826` exposed a test-isolation race when migration tests created `pgcrypto` concurrently on one database. The production migration was not weakened; the new integration test was isolated to its own database.
- Real `pg.Pool` + RLS integration green: `32344957870`.
- Express tenant-principal red: `32345044007` returned `{email, role}` without tenant context.
- Added validated `ZOK_ADMIN_TENANT_ID`; malformed configured tenant IDs fail startup validation and configured tenant context is included in login/session principal. Green: `32345360432`.
- Request-to-transaction binding red: `32345449008` because the helper did not exist.
- Added `withRequestTransaction`, which requires an authenticated valid tenant identity before delegating to `withIdentityTransaction`. Green: `32345518040`.

### Residual boundary

The parent durable-data P0 item stays unchecked. The verified PostgreSQL boundary is ready for relational repositories, but all live Express data routes still call the JSON adapter. There is no verified JSON→relational import/cutover/rollback or backup/restore drill. The configured-admin `tenantId` is a bounded transitional principal, not a complete production multi-user identity/RBAC model.

### Next safe unit

Define a tenant-scoped PostgreSQL repository for contacts/conversations/messages and contract-test it against PostgreSQL 17. Then wire a bounded Express read/write route through `withRequestTransaction` without changing unrelated JSON-backed routes. Expand only after equivalent API/security behavior is green.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
