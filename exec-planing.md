# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-20  
**Canonical branch:** `main`  
**Current implementation PR:** #17 (`feat/postgres-chat-import`, draft/unmerged)  
**Current main baseline:** `29f0055d439fda5cf5ac8bab5d8755b371be1817`  
**Canonical runtime:** Vite + React frontend with Express API adapter  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This is the canonical execution source for release work. Every cycle selects the highest-priority incomplete unit that can be implemented and verified safely. `IMPLEMENTATION-CHECKLIST.md` records evidence-backed completion; `CHANGELOG.md` records changes.

## 1. Execution rules

1. No item is complete without current evidence.
2. Security/release gates are never weakened to obtain a pass.
3. Code-changing cycles add/update tests and run relevant gates.
4. Completed cycles synchronize this file, `IMPLEMENTATION-CHECKLIST.md`, and `CHANGELOG.md`.
5. A bounded verified slice does not complete its parent production capability.
6. Configuration gates fail closed; JSON remains explicit rollback until cutover evidence exists.

## 2. Current architecture and durable-data baseline

```text
Browser -> Vite/React -> Express API -> authenticated principal
  -> validated tenantId -> request-bound PostgreSQL transaction
  -> transaction-local app.tenant_id -> tenant-scoped repositories

Default live path: ZOK_CHAT_STORAGE=json -> createJsonStorage
Opt-in message path: ZOK_CHAT_STORAGE=postgres + ZOK_POSTGRES_URL
```

Merged PR #6 provides schema/RLS/transactions/repositories/legacy mapping. PR #15 provides the request-bound legacy chat runtime. PR #16 provides configuration-gated PostgreSQL chat message reads/writes and merged as `dc677799cbac6ee793a612330313b1c39f5cc7ca` after synchronized-head CI `32362766907`.

Draft PR #17 now provides deterministic import dry-run/replay, resumable source-bound checkpoints, interruption/restart proof, same-tenant/source advisory-lock exclusion, bounded cutover/rollback regression, read-only exact-state rehearsal, and a PostgreSQL persistence boundary for legacy chat metadata/unread/tags. The metadata boundary stores deterministic legacy metadata in tenant-scoped contact JSONB and exposes authenticated request-bound `markRead`/`replaceTags` operations. It is not yet wired as the live Express metadata owner.

## 3. Master priority queue

### P0 — Gold-Master blockers
- [ ] Complete durable PostgreSQL application runtime storage with verified migration/cutover/rollback.
- [ ] Production tenant-aware identity and deny-by-default RBAC.
- [ ] Append-only audit enforcement for privileged/data-changing actions.
- [ ] Shared production sessions and rate-limit state.
- [ ] Provider-neutral channel contracts plus signature verification, idempotency, retries, dead letters, receipts, and consent enforcement.
- [ ] Server-side governed AI with versioning, risk/approval controls, telemetry, and evaluation suites.
- [ ] Production edge verification for HTTPS/reverse proxy/secure cookies/health/rollback.
- [ ] Independent security, load, backup/restore, privacy, canary/rollback, and operational sign-off.

### P1 — Production capability
- [ ] Real channel adapters and durable campaign workers.
- [ ] Attribution/reconciliation and replay-safe commerce adapters.
- [ ] Metrics/traces/logs/SLOs/alerts/runbooks.
- [ ] Tenant API-key lifecycle and secrets handling.
- [ ] Export/delete/retention privacy workflows.

### P2/P3 — Completion and polish
- [ ] Persistent onboarding, Academy, Marketplace, production analytics, and removal/labelling of remaining simulations.
- [ ] Frontend performance budgets, accessibility, cross-browser/device regression, release/migration/operator documentation, and signed Gold Master evidence.

## 4. Durable-data evidence

Completed bounded foundations:
- [x] Atomic/fail-closed JSON storage boundary.
- [x] PostgreSQL schema, migration replay/rollback, forced RLS, tenant relational integrity, and real pool transaction boundary.
- [x] Authenticated request-to-tenant transaction binding.
- [x] Tenant-scoped contacts and conversations/messages repositories.
- [x] Deterministic legacy mapper and request-bound chat runtime.
- [x] Configuration-gated PostgreSQL message path merged in PR #16.
- [x] Deterministic import dry-run/replay: CI `32367095289`, synchronized head `32367337923`.
- [x] Resumable checkpoint/interruption-restart import: CI `32372290510`, synchronized head `32372489874`.
- [x] Bounded message cutover/rollback regression: CI `32377588551`, synchronized head `32377881739`.
- [x] Same-tenant/source concurrent-import exclusion: CI `32383484862`, synchronized head `32383857094`.
- [x] Read-only operational cutover rehearsal: CI `32389535833`, synchronized head `32389896928`.
- [x] PostgreSQL legacy metadata/unread/tags persistence boundary on draft PR #17. Evidence: test-first `7a7b8c8c56c960b405ab63738b9f1a0648ac5021`; mapping `191bdd028502382f52894c8a8cb5c592686c1bf4`; contact metadata repository `b474ad078147d510a49b5bc65c314cd6c7aba259`; runtime `357c58128dce60370e61be1e1a40acaf479f61c5`; compatibility tests `285696cdc33f8f43a137fa76620fcbca7c863285`, `bd7fefb4d410afdd01eb0cd41a05cfdd0a28808f`; PostgreSQL service-backed tenant-isolation regression `19852412c602756af826a10c8541265cea10620d`; implementation-head CI `32393891922` green.

Still incomplete:
- [ ] Wire PostgreSQL metadata/unread/tags into the existing configuration-gated Express chat routes with API compatibility and rollback tests.
- [ ] Production chat canary/cutover/operator rollback in an authorized deployment environment.
- [ ] Campaigns/integrations, then AI config/flow-state PostgreSQL migration.
- [ ] Application-wide PostgreSQL cutover/rollback and backup/restore RPO/RTO.
- [ ] Production identity/RBAC/audit/shared state and remaining P0 controls.

## 5. Verification gates

**Gate A:** `npm ci`; `npm audit --omit=dev --audit-level=high`.  
**Gate B:** `npm test`; `npm run lint`; `npm run typecheck`.  
**Gate C:** `npm run build`, production start/health, deployment TLS/secure-cookie checks.  
**Gate D:** tenant/RBAC review, provider replay/contract evidence, AI evaluations, penetration/remediation, load/capacity, backup restore/RPO/RTO, privacy lifecycle, canary/rollback, operational sign-off.

Implementation-head CI `32393891922` passed release-document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

## 6. Current cycle residual boundary

The metadata slice persists deterministic legacy chat metadata (`legacyChatId`, avatar, assignment, tags, orders, unread count, display-only time) in the existing tenant-scoped contact metadata JSONB. Runtime reads and metadata mutations execute inside the authenticated tenant transaction; service-backed coverage proves cross-tenant invisibility and mutation persistence.

This does **not** switch the Express `/api/chats/:id/read`, `/api/chats/:id/tags`, message-side unread/time updates, or GET metadata overlay to PostgreSQL. JSON remains the default and live metadata owner. No production traffic, deployment canary, operator rollback, campaigns/integrations/AI/flow migration, application-wide cutover, backup/restore RPO/RTO, production RBAC, or Gate D completion is claimed.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Wire the verified PostgreSQL metadata boundary into the existing `ZOK_CHAT_STORAGE=postgres` chat read/read-state/tag paths, preserving auth/CSRF/input validation/legacy response shape and JSON default/rollback; add PostgreSQL service-backed API compatibility and rollback regression.
2. Add production canary/cutover/operator rollback evidence only in an explicitly authorized deployment environment.
3. Migrate campaigns/integrations, then AI config/flow state.
4. Complete application-wide JSON→PostgreSQL cutover + rollback and backup/restore evidence.
5. Implement production tenant identity, deny-by-default RBAC, append-only audit, shared sessions/rate-limit state.
6. Provider delivery reliability/consent, governed AI, privacy/observability/load/DR/security exercises.
7. Product completeness and Gold Master polish.

Dependabot major-version PRs remain separate until independently compatibility-tested.

## 8. Next safe unit

Wire only legacy chat metadata/unread/tags through the already verified PostgreSQL runtime when `ZOK_CHAT_STORAGE=postgres`, with service-backed API compatibility and rollback tests. Keep `ZOK_CHAT_STORAGE=json` as default and explicit rollback; do not migrate unrelated resources or claim production canary/cutover evidence.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.
