# Zok Implementation Checklist

**Last updated:** 2026-08-20  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

Operational companion to `exec-planing.md`. Checkboxes require current evidence; a checked bounded slice does not imply its parent production capability is complete.

## Foundation already evidenced

- [x] Vite + React frontend with Express API adapter; production build, tests, lint, typecheck, and production dependency audit.
- [x] Authentication, CSRF/origin controls, security headers, request-size/rate controls, health endpoint.
- [x] Serialized atomic JSON persistence and explicit Express storage boundary.
- [x] PostgreSQL schema, migration rollback/replay, forced RLS, tenant relational integrity, real `pg.Pool`, and transaction-local tenant context.
- [x] Authenticated request-to-transaction binding fails closed without valid tenant identity.
- [x] Tenant-scoped contacts and conversations/messages repositories.

## P0 — Durable data platform

- [x] Deterministic legacy chat compatibility mapper. Evidence: CI `32351874076`.
- [x] Request-bound legacy chat PostgreSQL runtime. Evidence: CI `32357209712`, synchronized head `32357391343`.
- [x] Configuration-gated PostgreSQL chat message read/write path; JSON remains default/rollback. Evidence: CI `32362476402`, synchronized head `32362766907`; PR #16 merge `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- [x] Deterministic JSON→PostgreSQL chat import dry-run and replay/idempotency. Evidence: `a94042d1fc5dc2b013261167c26c96c5d433fac2`, `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, `abc559a7593d657a373cd645eea90295268f4ca0`; CI `32367095289`, synchronized head `32367337923`.
- [x] Source-bound resumable checkpoints and interruption/restart continuation. Evidence: `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, `a3790630253fb095f11c27613d3796f5682d556c`, `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`; CI `32372290510`, synchronized head `32372489874`.
- [x] Bounded cutover/rollback message regression. Evidence: `4376ff02ec5260c5da69cae1bd7a5792644efbf4`; CI `32377588551`, synchronized head `32377881739`.
- [x] Same-tenant/source competing import exclusion via PostgreSQL advisory lock. Evidence: `e17e7048f2664d20a2b1520635b09d1b716ac413`, `1a9c46472dd67322cc9ad5c3681d3f041c5e168c`, `962e603e66e96ed454a117b05b4d23662f058c1a`; CI `32383484862`, synchronized head `32383857094`.
- [x] Read-only exact-state cutover rehearsal and byte-preserved JSON rollback snapshot. Evidence: `b82df5aba873238fe5a02ab56360a739a229eb0a`, `6169f08c132345480c02d2f0549c92052b390dad`, `9b9fc95314b9c90190d69913037e08810c44b165`; CI `32389535833`, synchronized head `32389896928`.
- [x] PostgreSQL persistence boundary for legacy chat metadata/unread/tags. Evidence: `7a7b8c8c56c960b405ab63738b9f1a0648ac5021`, `191bdd028502382f52894c8a8cb5c592686c1bf4`, `b474ad078147d510a49b5bc65c314cd6c7aba259`, `357c58128dce60370e61be1e1a40acaf479f61c5`, service-backed `19852412c602756af826a10c8541265cea10620d`; CI `32393891922`.
- [x] PostgreSQL-mode `/api/chats` GET metadata overlay preserves the legacy response shape and projects persisted avatar/unread/display-time/assignment/tags/orders. Evidence: initial regression CI `32395298787` from strict overlay `4361b376c2c480e6c82a45a7e787496cbffefbfa`; compatibility repair `b162f4753dd450c92ef0056fe52a3a032e7d06e2`; explicit overlay test `a8b2aab893f9e12b2dbaeae80055dae8f842843a`; green CI `32395415647` with 39/39 tests plus lint/typecheck/build/audit.
- [ ] `/api/chats/:id/read` and `/api/chats/:id/tags` mutations use PostgreSQL metadata in PostgreSQL mode with API compatibility + rollback evidence.
- [ ] Message-side unread/display-time ownership migrated and verified without mixed-store side effects.
- [ ] Production chat cutover/canary and operator rollback in a real authorized deployment.
- [ ] Campaigns/integrations/AI config/flow state migrated to PostgreSQL.
- [ ] Application-wide JSON→PostgreSQL cutover and rollback verified.
- [ ] Backup/restore drill with recorded RPO/RTO.

## P0 — Identity and governance

- [ ] Production multi-user tenant-aware identity and membership resolution.
- [ ] Deny-by-default RBAC plus applicable field/channel authorization tests.
- [ ] Session revocation and shared production session store.
- [ ] Shared production rate-limit state.
- [ ] Append-only audit enforcement plus retention/export controls.

## P0 — Channels and messaging

- [ ] Provider-neutral inbound/outbound event contracts.
- [ ] Webhook signature verification and replay/idempotency protection.
- [ ] Retry/backoff, dead-letter handling, delivery receipts, reconciliation.
- [ ] Consent/opt-out enforcement.
- [ ] At least one real provider sandbox contract suite.

## P0 — AI governance

- [ ] Server-side AI policy enforcement with prompt/model/policy versions.
- [ ] Risk classification, sensitive-action approval, human escalation, PII/redaction and grounding policy.
- [ ] Cost/latency telemetry and Thai/English/adversarial/guardrail evaluation suites.

## P0 — Production release evidence

- [ ] HTTPS/reverse-proxy and secure-cookie behavior verified in deployment.
- [ ] Penetration test/remediation, load/capacity evidence, backup restore/RPO/RTO.
- [ ] Privacy inventory/consent/export/delete/retention evidence.
- [ ] Production canary/rollback and operations/support sign-off.

## P1 — Production capability

- [ ] Durable campaign workers and real channel adapters.
- [ ] Attribution/reconciliation and replay-safe POS/e-commerce adapters.
- [ ] Metrics, traces, structured logs, dashboards, alerts, SLOs, runbooks.
- [ ] Tenant API-key create/rotate/revoke and secrets management.
- [ ] Data export/delete/retention workflows.

## P2/P3 — Product completeness and release polish

- [ ] Persistent onboarding, Academy completion/certificates, Marketplace ownership/moderation/versioning.
- [ ] Production-backed analytics and explicit labeling/removal of remaining simulations.
- [ ] Frontend code splitting/performance budgets.
- [ ] Accessibility, cross-browser/device regression, release/migration/operator documentation.
- [ ] Signed Gold Master evidence record.

## Current PR #17 boundary

PR #17 remains draft/open/unmerged on `feat/postgres-chat-import`, based on main `29f0055d439fda5cf5ac8bab5d8755b371be1817`. PostgreSQL-mode chat GET now consumes persisted metadata through the request-bound runtime; JSON remains default/rollback. Read/tag mutation routes and message-side metadata effects remain JSON-backed.

## Next bounded unit

- [ ] Wire only `/api/chats/:id/read` and `/api/chats/:id/tags` through the verified PostgreSQL metadata runtime when `ZOK_CHAT_STORAGE=postgres`; preserve auth/CSRF/validation/API shape and JSON rollback, and add service-backed API compatibility + rollback tests. Do not change message-side metadata semantics or migrate unrelated resources in the same slice.

## Gold Master rule

Gold Master requires every P0 item to have current evidence and all Gate D evidence to be complete. UI simulations, local mock data, or documentation alone are insufficient.
