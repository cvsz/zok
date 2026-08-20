# Zok Master Execution Plan

**Status:** Active release-control ledger  
**Last updated:** 2026-08-21  
**Canonical branch:** `main`  
**Current implementation PR:** #18 (`feat/postgres-message-metadata`, draft/unmerged)  
**Current main baseline:** `63976dc9d381b7e37f75db275835924df6da4c24`  
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
Opt-in chat path: ZOK_CHAT_STORAGE=postgres + ZOK_POSTGRES_URL
```

Merged PR #6 provides schema/RLS/transactions/repositories/legacy mapping. PR #15 provides the request-bound legacy chat runtime. PR #16 provides configuration-gated PostgreSQL chat message reads/writes and merged as `dc677799cbac6ee793a612330313b1c39f5cc7ca` after synchronized-head CI `32362766907`.

PR #17 merged as `e9414b83def9539e0b09c1a8a8419aadbac6b62e` and provides deterministic import dry-run/replay, resumable source-bound checkpoints, interruption/restart proof, same-tenant/source advisory-lock exclusion, bounded cutover/rollback regression, read-only exact-state rehearsal, PostgreSQL persistence for legacy chat metadata/unread/tags, PostgreSQL GET metadata projection, and PostgreSQL ownership for explicit read/tag mutation routes.

Draft PR #18 advances the remaining message-side metadata boundary. PostgreSQL-mode message writes now persist display-time through the request-bound PostgreSQL metadata transaction; inbound customer activity applies active/inactive unread semantics there. The JSON storage boundary preserves PostgreSQL-owned `time`/`unread` fields in PostgreSQL mode so delayed legacy callbacks cannot modify the rollback snapshot.

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
- [x] PostgreSQL legacy metadata/unread/tags persistence boundary: `7a7b8c8c56c960b405ab63738b9f1a0648ac5021`, `191bdd028502382f52894c8a8cb5c592686c1bf4`, `b474ad078147d510a49b5bc65c314cd6c7aba259`, `357c58128dce60370e61be1e1a40acaf479f61c5`, service-backed `19852412c602756af826a10c8541265cea10620d`; CI `32393891922`.
- [x] PostgreSQL-mode chat GET metadata overlay preserving legacy API shape. Strict overlay `4361b376c2c480e6c82a45a7e787496cbffefbfa` exposed compatibility regression CI `32395298787`; repair `b162f4753dd450c92ef0056fe52a3a032e7d06e2` and test `a8b2aab893f9e12b2dbaeae80055dae8f842843a` passed CI `32395415647`.
- [x] PostgreSQL-mode `/api/chats/:id/read` and `/api/chats/:id/tags` route ownership with rollback-source preservation. Test-first `515cc33c228dcae498d03e52a440ac5af3e2d0e7` failed as expected in CI `32400607666`; implementation `085e024914953e0dd08e336593c8dc5aa07586eb` passed CI `32400811542`; synchronized-head CI `32401134450`.
- [x] PostgreSQL-mode message-side display-time/unread ownership. Test-first `0fc6c0c7952b533cd694780a5edec0ff6c6bb328` failed as expected in CI `32408703635`; runtime metadata implementation `fbc160bdad6da092844cdb36ff90e3abe6ae3fe3`, JSON rollback ownership guard `d9d7eeae1047778904938b371e1d26bbe5f6722d`, and unit coverage `8e49a56c0daf77b8ecb0bc25783b75e9c8157342` passed implementation-head CI `32408937061`. Service-backed API coverage proves inactive inbound reply increments unread, active reply leaves unread zero, both project `Just now`, and PostgreSQL-mode message activity leaves the JSON rollback bytes unchanged.

Still incomplete:
- [ ] Production chat canary/cutover/operator rollback in an authorized deployment environment.
- [ ] Campaigns/integrations, then AI config/flow-state PostgreSQL migration.
- [ ] Application-wide PostgreSQL cutover/rollback and backup/restore RPO/RTO.
- [ ] Production identity/RBAC/audit/shared state and remaining P0 controls.

## 5. Verification gates

**Gate A:** `npm ci`; `npm audit --omit=dev --audit-level=high`.  
**Gate B:** `npm test`; `npm run lint`; `npm run typecheck`.  
**Gate C:** `npm run build`, production start/health, deployment TLS/secure-cookie checks.  
**Gate D:** tenant/RBAC review, provider replay/contract evidence, AI evaluations, penetration/remediation, load/capacity, backup restore/RPO/RTO, privacy lifecycle, canary/rollback, operational sign-off.

Implementation-head CI `32408937061` passed release-document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

## 6. Current cycle residual boundary

When `ZOK_CHAT_STORAGE=postgres`, message writes now persist `displayTime` in PostgreSQL metadata. Inbound customer activity uses the request's validated active-chat context: inactive chat unread increments from PostgreSQL metadata while active chat unread is reset/kept at zero. The JSON storage boundary restores the rollback copy of `time` and `unread` before persistence so the existing delayed callback cannot create a mixed-store write. JSON mode retains its previous behavior.

This remains application/CI evidence, not a production canary or production cutover. Campaigns, integrations, AI config, flow state, shared session/rate-limit state, production RBAC/audit, application-wide cutover, backup/restore RPO/RTO, and Gate D remain incomplete.

## 7. Execution order from current head

Unless a security/CI defect supersedes it:

1. Execute production chat canary/cutover/operator rollback evidence only in an explicitly authorized deployment environment with preflight, observation window, rollback trigger, and post-rollback verification.
2. Migrate campaigns/integrations, then AI config/flow state.
3. Complete application-wide JSON→PostgreSQL cutover + rollback and backup/restore evidence.
4. Implement production tenant identity, deny-by-default RBAC, append-only audit, shared sessions/rate-limit state.
5. Provider delivery reliability/consent, governed AI, privacy/observability/load/DR/security exercises, product completeness, and Gold Master polish.

Dependabot major-version work remains separate unless independently compatibility-tested and merged through the normal gates.

## 8. Next safe unit

The next priority is a controlled production chat canary/cutover/operator rollback rehearsal against an explicitly authorized deployment environment. Required evidence must include exact preflight/import state, `ZOK_CHAT_STORAGE` transition, health/API checks, tenant-isolation checks, observation criteria, explicit rollback trigger and execution, and post-rollback verification. Do **not** execute this against an environment that has not been explicitly authorized for deployment mutation; if no such environment is available, report that blocker rather than fabricating canary evidence or skipping ahead silently.

## 9. Release decision

**FOUNDATION HARDENED / NOT GOLD MASTER.**

Gold Master promotion remains forbidden until every P0 blocker has current evidence and Gate D is signed off.