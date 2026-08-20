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
  -> standalone deterministic legacy JSON chat importer
  -> stable legacy-chat:<id> contact/thread IDs
  -> stable legacy-chat:<id>:message:<index> message IDs
  -> dry-run validates/maps without acquiring PostgreSQL storage
  -> exact replay reuses matching rows; conflicts fail closed
  -> source-bound checkpoint: version + tenant + normalized-source SHA-256 + nextIndex + totalChats
  -> one committed tenant transaction per chat
  -> checkpoint emitted/persisted only after commit
  -> explicit --resume validates checkpoint before continuing
```

PR #6 merged the PostgreSQL schema/RLS/transaction/repository/compatibility foundation. PR #15 merged the request-bound legacy chat PostgreSQL runtime. PR #16 merged the configuration-gated chat message read/write path as merge commit `dc677799cbac6ee793a612330313b1c39f5cc7ca`; synchronized-head CI `32362766907` was green before merge. `main` is `29f0055d439fda5cf5ac8bab5d8755b371be1817`. Draft PR #17 now proves deterministic import dry-run, replay/idempotency, source-bound resumability checkpoints, and interruption/restart continuation; it does not perform production cutover or prove rollback.

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
- [x] Deterministic legacy chat import dry-run + replay/idempotency foundation on draft PR #17. Evidence: importer `a94042d1fc5dc2b013261167c26c96c5d433fac2`, CLI `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, structural replay comparison `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, tests `abc559a7593d657a373cd645eea90295268f4ca0`, implementation CI `32367095289`, synchronized-head CI `32367337923`.
- [x] Resumable/checkpointed chat import with interruption/restart evidence on draft PR #17. Evidence: checkpointed importer `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, atomic checkpoint CLI `a3790630253fb095f11c27613d3796f5682d556c`, interruption/restart/source-binding tests `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`, implementation-head CI `32372290510` green.

Still incomplete:

- [ ] Concurrent importer serialization/coordination policy and verification.
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

Implemented and verified bounded behavior:

- `server/storage/postgres/legacy-chat-import.js` maps every source chat through the existing validated compatibility mapper before any write.
- Duplicate source thread/message stable IDs fail before database writes.
- `--dry-run` validates and counts source records without acquiring PostgreSQL storage.
- Exact replay reuses existing source-owned contact/thread/message rows only when fields match; ambiguous or conflicting replay fails closed.
- Source-bound checkpoints record schema version, tenant UUID, deterministic SHA-256 of normalized mapped chats, next chat index, and total chat count.
- Resume validates checkpoint version, tenant, source digest, range, and total count before database work.
- Write mode processes one chat per existing tenant transaction/RLS boundary; checkpoint progress is emitted only after that transaction commits.
- `scripts/import-legacy-chats.js --checkpoint <file>` writes checkpoints by same-directory temporary file + rename; `--resume` requires an existing checkpoint and refuses mismatched/missing state.
- PostgreSQL service-backed regression injects an interruption immediately after the first durable checkpoint, verifies only the first chat committed, resumes from `nextIndex=1`, completes the second chat without replaying the first, and rejects changed source data against the checkpoint.
- Implementation commits: `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, `a3790630253fb095f11c27613d3796f5682d556c`, `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`.
- CI `32372290510` passed release-document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Residual boundary

This slice proves deterministic source-bound progress and restart continuation after a committed-chat interruption. It intentionally changes write execution from one all-chat transaction to one transaction per chat so partial progress can be durable and restartable. It does **not** prove safe concurrent importers for the same tenant/source, production cutover, explicit rollback, chat metadata/unread/tag migration, full resource migration, or backup/restore. `ZOK_CHAT_STORAGE=json` remains the default and explicit rollback runtime. The durable-data P0 parent remains incomplete.

Local clone/install verification remains unavailable because the execution environment cannot resolve `github.com`; GitHub Actions is the execution evidence.

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

1. Add explicit chat cutover + rollback verification around the configuration-gated chat path using imported state; keep JSON default/rollback until evidence is green.
2. Define and verify a same-tenant/source concurrent-import coordination policy before any operational parallel-import claim.
3. Migrate chat metadata/unread/tags, then campaigns/integrations, then AI/flow state.
4. Complete application-wide JSON→PostgreSQL cutover + rollback and backup/restore evidence.
5. Implement production tenant-aware identity, deny-by-default RBAC, append-only audit, shared sessions/rate-limit state.
6. Provider-neutral event + delivery reliability + consent enforcement.
7. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
8. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Next safe unit

Add explicit chat cutover and rollback verification using deterministic imported state and the existing `ZOK_CHAT_STORAGE` gate. Verify that PostgreSQL mode serves imported message state, JSON rollback mode remains available and behaviorally intact, and failure paths do not silently mix divergent stores. Do not migrate metadata/unread/tags or change the default storage mode in that slice.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
