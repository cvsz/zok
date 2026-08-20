# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-20  
**Canonical branch:** `main`  
**Merged implementation:** PR #6 (`edbc8ba85a534e49fe3881b24c8a55560671421f`)  
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
       -> normalized repositories receive verified tx.tenantId
       -> COMMIT / ROLLBACK
       -> guaranteed client release

Normalized PostgreSQL repository foundation
  -> contacts repository
  -> conversations/messages repository
  -> legacy chat compatibility mapper
  -> bounded legacy chat request/runtime boundary
  -> RLS + tenant-scoped composite FK enforcement

Live application data path today
  -> explicit storage boundary
  -> createJsonStorage
  -> serialized atomic JSON persistence
```

PR #6 is merged to `main` with PostgreSQL schema/migrations, RLS, transaction-local tenant context, request binding, contacts/conversations repositories, and the pure legacy-chat compatibility mapping. Branch `feat/postgres-chat-runtime-boundary` now adds the smallest request-bound PostgreSQL read/write runtime over already-imported legacy thread IDs, but the live Express data routes remain JSON-backed. PostgreSQL is not yet the live application store.

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

Completed with current repository evidence:

- [x] JSON adapter with serialized atomic writes and corrupt-state fail-closed behavior.
- [x] Express request path wired through an explicit storage boundary.
- [x] Initial PostgreSQL multi-tenant schema and rollback DDL.
- [x] Real PostgreSQL migration up/down/replay verification.
- [x] Forced RLS and non-superuser/NOBYPASSRLS negative tests.
- [x] Tenant-scoped composite foreign keys.
- [x] Concurrent uniqueness/integrity verification.
- [x] PostgreSQL transaction adapter with real `pg.Pool`, explicit transactions, and transaction-local tenant context.
- [x] Authenticated identity and request-to-transaction fail-closed binding.
- [x] Transaction context exposes the verified tenant ID to repository code rather than accepting repository-level tenant overrides.
- [x] Tenant-scoped contacts repository with validation and real PostgreSQL coverage.
- [x] Tenant-scoped conversations/messages repository with validated channel/direction/sender semantics.
- [x] Real contact → conversation → message integration under PostgreSQL RLS and tenant-scoped relational integrity.
- [x] Explicit pure compatibility mapping from legacy `/api/chats` aggregates to normalized repository inputs, with stable legacy IDs and fail-closed contract tests. Source evidence: test-first commit `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, implementation `777af487395161b74fc1be472d1f5ddd448c73fb`; synchronized mapper verification is green in CI `32351874076` after lint-fix commit `42c1c4995de3f3a22d743f53dd6a630747a32884`.
- [ ] Bounded request-bound legacy chat PostgreSQL runtime is implemented on branch `feat/postgres-chat-runtime-boundary` but remains unchecked until branch CI is green. Source commits: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`.

Still incomplete:

- [ ] Wire the bounded runtime into a configuration-gated Express chat read/write route with equivalent auth/CSRF/validation/API behavior and JSON rollback switch.
- [ ] Add PostgreSQL service-backed API coverage for that Express route before widening cutover.
- [ ] Migrate remaining live resources: campaigns, integrations, AI config, flow state.
- [ ] Verify JSON→PostgreSQL import/cutover and rollback.
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

CI enforces release-document presence, PostgreSQL 17 service health, real migrations, pool/RLS and normalized repository integration, `npm ci`, tests, lint, typecheck, build, production dependency audit, least-privilege permissions, and concurrency cancellation. Workflow failures remain release blockers until triaged.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Verify the request-bound legacy chat PostgreSQL runtime branch in CI, then wire it behind one explicit configuration gate in the existing chat read/write route while preserving JSON rollback and current API/security behavior.
2. Add PostgreSQL service-backed API tests for the gated route and expand chat/message cutover only after green evidence; retain the rollback switch until import/cutover evidence exists.
3. Add PostgreSQL repositories for campaigns and integrations, then AI/flow state.
4. Build and verify JSON→PostgreSQL import/cutover + rollback and backup/restore evidence.
5. Implement production tenant-aware user identity, deny-by-default RBAC, append-only audit foundation, then shared sessions/rate-limit state.
6. Provider-neutral event + queue/retry/idempotency base and first channel adapter/consent enforcement.
7. AI policy/evaluation service, privacy lifecycle, observability/load/DR/security exercises.
8. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Current execution evidence — 2026-08-20 legacy chat compatibility mapping CI repair

**Branch:** `feat/postgres-storage-foundation`  
**PR:** #6 (merged to `main` as `edbc8ba85a534e49fe3881b24c8a55560671421f`)

- Existing PR #6 was reused; no duplicate implementation PR was created. It was marked ready and squash-merged to `main` after green CI.
- Test-first commit `26906f28c34d74077c3e496d0ddbf1ab21a080fb` defines the compatibility contract before any live route change.
- Implementation commit `777af487395161b74fc1be472d1f5ddd448c73fb` adds a pure mapper only; it does not alter Express persistence.
- Stable compatibility keys are `legacy-chat:<id>` for contact/thread identity and `legacy-chat:<id>:message:<index>` for legacy messages.
- Customer→inbound and agent→outbound semantics are explicit. Unsupported channels/senders and malformed IDs/text/tags fail closed.
- Display-only legacy time strings are retained as metadata rather than converted into fabricated timestamps.
- CI `32346860728` reached the new mapper slice and passed PostgreSQL service health, release-document checks, `npm ci`, and all 24 tests, then failed at lint because `test/legacy-chat-mapping.test.js` referenced `structuredClone` while the repository ESLint environment did not declare that global.
- Fix commit `42c1c4995de3f3a22d743f53dd6a630747a32884` replaced only the test-fixture clone with JSON round-trip cloning; production mapper behavior and route boundaries were unchanged.
- CI `32351874076` then passed release-document checks, PostgreSQL service health, `npm ci`, all 24 tests, lint, typecheck, build, and production dependency audit.
- Local clone verification was attempted but the execution container could not resolve `github.com`; this did not replace CI evidence and no local-pass claim is made.

### Residual boundary

The parent durable-data P0 item stays unchecked. Live Express data routes still use the JSON adapter. The compatibility mapper and lint repair are not a production cutover, import, rollback, backup/restore, or multi-user identity/RBAC implementation.

## 9. Post-merge bounded runtime cycle

**Branch:** `feat/postgres-chat-runtime-boundary`

- Repository/PR inventory was refreshed first: PR #6 is merged; remaining open PRs are separate Dependabot updates and are not part of the durable-data execution track.
- Main head at cycle start: `1f3ca916757c736fe541193eed5d5acef4aae98d`.
- `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af` extends the normalized conversations repository with validated exact external-thread lookup and ordered message reads; tenant scope still comes exclusively from the transaction/RLS boundary.
- `e95d2751804bed7c7a3b9ff055b5108829de8a54` adds a bounded legacy chat runtime that accepts an authenticated request, delegates through `withRequestTransaction`, resolves deterministic `legacy-chat:<id>` thread IDs, and reads/writes only through the normalized conversations repository.
- `81abadeb91261ebeb232ca71d3fed88069f40223` adds regression coverage for tenant binding, deterministic thread lookup, read/write behavior, sender normalization, missing imports, invalid IDs/text/senders, and fail-closed missing tenant identity.
- This slice intentionally does **not** modify `server.js`, choose PostgreSQL as the live store, import JSON data, or claim route/API parity. JSON remains the canonical live persistence and rollback path.
- Local verification is unavailable because the execution environment cannot resolve `github.com`; branch CI is therefore the required execution evidence. Until it is green, this slice remains incomplete.

### Next safe unit

After branch CI is green, wire this runtime behind a single explicit configuration gate in the existing chat read/write route and add PostgreSQL service-backed API regression coverage before any wider cutover.

## 10. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.