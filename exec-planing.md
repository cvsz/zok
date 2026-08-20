# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-20  
**Canonical branch:** `main`  
**Current implementation PR:** #17 (`feat/postgres-chat-import`, draft/unmerged)  
**Current main baseline for this cycle:** `29f0055d439fda5cf5ac8bab5d8755b371be1817`  
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
       -> transaction-local app.tenant_id
       -> normalized tenant-scoped repositories

Live/default application data path
  -> ZOK_CHAT_STORAGE=json (default)
  -> createJsonStorage

Merged bounded PostgreSQL message path (PR #16)
  -> ZOK_CHAT_STORAGE=postgres + required ZOK_POSTGRES_URL
  -> /api/chats message reads through request-bound PostgreSQL runtime
  -> /api/chats/:id/messages writes through request-bound PostgreSQL runtime
  -> JSON still owns chat metadata/unread/tags

Draft PR #17 import foundation
  -> standalone legacy JSON chat importer
  -> stable legacy-chat:<id> contact/thread IDs
  -> stable legacy-chat:<id>:message:<index> message IDs
  -> dry-run validates/maps without acquiring PostgreSQL storage
  -> replay reuses exact matching rows
  -> conflicting or ambiguous replay fails closed
```

PR #6 merged the PostgreSQL schema/RLS/transaction/repository/compatibility foundation. PR #15 merged the request-bound legacy chat PostgreSQL runtime. PR #16 merged the configuration-gated chat message read/write path as merge commit `dc677799cbac6ee793a612330313b1c39f5cc7ca`; synchronized-head CI `32362766907` was green before merge. `main` is now `29f0055d439fda5cf5ac8bab5d8755b371be1817`. Draft PR #17 implements only deterministic chat import dry-run and replay/idempotency foundation; it does not perform production cutover or rollback.

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
- [x] Deterministic legacy `/api/chats` compatibility mapper. Evidence: `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, `777af487395161b74fc1be472d1f5ddd448c73fb`, repair `42c1c4995de3f3a22d743f53dd6a630747a32884`, CI `32351874076`.
- [x] Request-bound legacy chat PostgreSQL runtime. Evidence: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`, CI `32357209712`, synchronized-head CI `32357391343`.
- [x] Configuration-gated Express chat message path merged via PR #16. Evidence: `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, `7ca81445a222ba901413d95df8b5074a496b94f0`, `542bf524de74d4d87fdee978a38bf61e30fa298f`, implementation CI `32362476402`, synchronized-head CI `32362766907`, merge `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- [x] Bounded deterministic legacy chat import dry-run + replay/idempotency implementation on draft PR #17. Evidence: importer `a94042d1fc5dc2b013261167c26c96c5d433fac2`, CLI `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, structural replay comparison `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, tests `abc559a7593d657a373cd645eea90295268f4ca0`, implementation-head CI `32367095289` green.

Still incomplete:

- [ ] Import resumability/checkpoint evidence.
- [ ] Explicit cutover and rollback verification for imported chat state.
- [ ] Move chat metadata/unread/tags from JSON only after cutover evidence is green.
- [ ] Migrate campaigns, integrations, AI config, and flow state.
- [ ] Verify complete application-wide JSON→PostgreSQL cutover and rollback.
- [ ] Verify backup/restore with recorded RPO/RTO.
- [ ] Replace configured-admin tenant identity with production user/tenant/role resolution and deny-by-default RBAC.

## 5. Current execution cycle — draft PR #17

**Branch:** `feat/postgres-chat-import`  
**PR:** #17 (draft, open, unmerged)  
**Base:** `29f0055d439fda5cf5ac8bab5d8755b371be1817`

Implemented bounded behavior:

- `server/storage/postgres/legacy-chat-import.js` maps every source chat through the existing validated compatibility mapper before any write.
- Duplicate source thread/message stable IDs fail before database writes.
- `--dry-run` validates and counts source records without acquiring PostgreSQL storage.
- Import runs inside the existing tenant transaction boundary and RLS context.
- Existing contact/thread/message rows are reused only when their source-owned fields match exactly.
- Ambiguous duplicate existing rows or changed replay data fail closed rather than silently diverging.
- `scripts/import-legacy-chats.js` reads a legacy JSON file containing `chats`, uses `ZOK_ADMIN_TENANT_ID`/`--tenant-id`, and requires `ZOK_POSTGRES_URL` only for actual writes.
- PostgreSQL service-backed regression verifies first import creates one contact/thread/two messages, exact replay creates no duplicates, and conflicting replay is rejected without adding rows.
- CI `32367095289` passed release-document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Residual boundary

This slice proves deterministic dry-run and ordinary replay idempotency for exact matching legacy chat data. It does **not** prove concurrent import serialization, resumability/checkpointing, production cutover, rollback, chat metadata/unread/tag migration, full resource migration, or backup/restore. `ZOK_CHAT_STORAGE=json` remains the default and explicit rollback runtime. The durable-data P0 parent remains incomplete.

Local clone/install verification is unavailable because the execution environment cannot resolve `github.com`; GitHub Actions is the execution evidence.

## 6. Verification gates

### Gate A
`npm ci` and `npm audit --omit=dev --audit-level=high`.

### Gate B
`npm test`, `npm run lint`, `npm run typecheck`.

### Gate C
`npm run build`, production start/health, deployment-environment TLS/secure-cookie checks.

### Gate D
Tenant/RBAC security review, provider replay/contract evidence, AI evaluations, penetration test/remediation, load/capacity evidence, backup restore drill/RPO/RTO, privacy lifecycle evidence, canary/rollback proof, operational sign-off.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Add resumable/checkpointed chat import execution and interruption/restart verification.
2. Add explicit chat cutover + rollback verification before widening the live PostgreSQL surface.
3. Migrate chat metadata/unread/tags, then campaigns/integrations, then AI/flow state.
4. Complete application-wide JSON→PostgreSQL cutover + rollback and backup/restore evidence.
5. Implement production tenant-aware identity, deny-by-default RBAC, append-only audit, shared sessions/rate-limit state.
6. Provider-neutral event + delivery reliability + consent enforcement.
7. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
8. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Next safe unit

Implement resumable/checkpointed chat import with interruption/restart tests and a deterministic progress record. Do not change the default storage mode or remove the JSON rollback path. Production cutover remains blocked until resumability and explicit rollback evidence are green.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
