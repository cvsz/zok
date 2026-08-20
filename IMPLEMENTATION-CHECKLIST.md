# Zok Implementation Checklist

**Last updated:** 2026-08-20  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This checklist is the operational companion to `exec-planing.md`. Items may be checked only when current repository/runtime evidence exists. A checked bounded slice does not imply its parent production capability is complete.

## Foundation already evidenced

- [x] Canonical runtime documented as Vite + React with Express API adapter.
- [x] Production build command exists.
- [x] Automated tests exist.
- [x] Lint and TypeScript checks exist.
- [x] Production dependency audit is part of CI/release verification.
- [x] Authenticated request path exists.
- [x] CSRF/origin controls exist for mutations.
- [x] Security headers and request-size/rate controls exist.
- [x] Health endpoint exists.
- [x] Local JSON writes are serialized and atomic.
- [x] Unverified UI integrations are not treated as production connections.

## P0 — Gold Master blockers

### Durable data platform
- [x] PostgreSQL schema defined for tenants, users, roles, contacts, conversations, messages, campaigns, integrations, consent, sessions, and audit events. Evidence: `001_initial.up.sql`, CI `32330521144`.
- [x] Migration up/down/replay verified against PostgreSQL. Evidence: CI `32330980037`.
- [x] PostgreSQL tenant isolation verified using non-superuser `NOBYPASSRLS`. Evidence: CI `32331262316`.
- [x] Tenant-scoped relational integrity rejects cross-tenant object references. Evidence: CI `32331409295`.
- [x] Concurrent PostgreSQL uniqueness/integrity verified. Evidence: CI `32331479289`.
- [x] JSON storage adapter contract implemented and tested.
- [x] Storage abstraction is the live Express persistence boundary. Evidence: CI `32333372481`.
- [x] PostgreSQL transaction adapter provides explicit BEGIN/COMMIT/ROLLBACK, transaction-local tenant context, guaranteed release, and pool shutdown. Evidence: CI `32335166312`.
- [x] Authenticated identities fail closed without a valid tenant UUID before PostgreSQL transaction acquisition. Evidence: red `32337912124`, green `32337964164`.
- [x] `pg ^8.23.0` has an npm-generated synchronized lockfile and real PostgreSQL 17 pool/RLS integration. Evidence: isolated green `32344957870`.
- [x] Express configured-admin principal can carry a validated tenant UUID. Evidence: red `32345044007`, green `32345360432`.
- [x] Request-to-transaction helper fails closed without authenticated tenant identity. Evidence: red `32345449008`, green `32345518040`.
- [x] PostgreSQL transaction context exposes only the already-validated tenant ID to repository code. Evidence: red `32345984084`, green `32346064982`.
- [x] Tenant-scoped normalized contacts repository implemented with validation and real PostgreSQL/RLS coverage. Evidence: CI `32346064982`.
- [x] Tenant-scoped conversations/messages repository implemented with validated channels/directions/sender types. Evidence: red `32346149065`, green `32346242401`.
- [x] Real PostgreSQL integration verifies contact → conversation → message writes, tenant isolation, and cross-tenant relationship rejection. Evidence: CI `32346343315`.
- [x] Legacy `/api/chats` compatibility mapping is deterministic and fail closed. Evidence: `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, `777af487395161b74fc1be472d1f5ddd448c73fb`, `42c1c4995de3f3a22d743f53dd6a630747a32884`, CI `32351874076`.
- [x] Bounded request-bound legacy chat PostgreSQL runtime verified. Evidence: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`, CI `32357209712` and synchronized-head CI `32357391343`.
- [x] Configuration-gated Express chat message read/write path can use PostgreSQL while JSON remains the default/rollback mode. Evidence: gate `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, route integration `7ca81445a222ba901413d95df8b5074a496b94f0`, PostgreSQL service-backed API regression `542bf524de74d4d87fdee978a38bf61e30fa298f`, CI `32362476402`.
- [ ] All live Express data routes switched from JSON to PostgreSQL with equivalent API regression coverage.
- [ ] Production JSON→PostgreSQL migration/import supports dry-run, idempotency, resumability, cutover, and verified rollback.
- [ ] Backup and restore procedure verified with recorded RPO/RTO.

### Identity and governance
- [ ] Tenant-aware principal model fully implemented for production multi-user identity. Current bounded evidence: configured admin sessions expose validated `tenantId`; production user/role resolution remains incomplete.
- [ ] Deny-by-default RBAC implemented.
- [ ] Field/channel-level authorization tests added where applicable.
- [ ] Session revocation implemented.
- [ ] Shared production session store implemented.
- [ ] Shared production rate-limit state implemented.
- [ ] Append-only audit events enforced for privileged/data-changing actions.
- [ ] Audit retention/export controls documented and verified.

### Channels and messaging
- [ ] Provider-neutral inbound event contract defined.
- [ ] Provider-neutral outbound event contract defined.
- [ ] Webhook signature verification implemented.
- [ ] Idempotency/replay protection implemented.
- [ ] Retry/backoff policy implemented.
- [ ] Dead-letter handling implemented.
- [ ] Delivery-receipt processing implemented.
- [ ] Consent/opt-out enforcement implemented.
- [ ] At least one channel adapter passes provider sandbox contract tests.

### AI governance
- [ ] AI decisions moved behind server-side policy enforcement.
- [ ] Prompt/model versions persisted.
- [ ] Risk classification and sensitive-action approval implemented.
- [ ] PII/redaction policy implemented.
- [ ] Knowledge-source/citation policy implemented where claims require grounding.
- [ ] Cost and latency telemetry recorded.
- [ ] Thai evaluation set added.
- [ ] English evaluation set added.
- [ ] Adversarial/guardrail evaluation added.
- [ ] Human escalation/approval audit added.

### Production release evidence
- [ ] HTTPS/reverse-proxy production edge verified.
- [ ] Secure-cookie behavior verified behind real TLS.
- [ ] Penetration test completed and findings remediated/accepted.
- [ ] Load/capacity test completed against agreed SLOs.
- [ ] Backup restore drill completed with recorded RPO/RTO.
- [ ] Privacy inventory/consent/export/delete/retention evidence completed.
- [ ] Production canary and rollback evidence completed.
- [ ] Operations/support sign-off completed.

## P1 — Production capability

- [ ] Durable broadcast/campaign worker implemented.
- [ ] Publicly claimed channel adapters implemented and contract-tested.
- [ ] Migration import supports dry-run, resumability, idempotency, and rollback.
- [ ] Attribution event schema and reconciliation implemented.
- [ ] POS/e-commerce provider adapters implemented with replay-safe contracts.
- [ ] Metrics, traces, structured logs, dashboards, alerts, and SLOs implemented.
- [ ] API key lifecycle (create/rotate/revoke) implemented.
- [ ] Secrets-management procedure documented and verified.
- [ ] Data export/delete/retention workflows implemented.

## P2 — Product completeness

- [ ] Onboarding/setup wizard state persisted and resumable.
- [ ] Academy enrollment/completion implemented.
- [ ] Certificate verification implemented.
- [ ] Marketplace ownership/licensing implemented.
- [ ] Marketplace moderation/versioning implemented.
- [ ] Production-backed analytics replaces static metrics.
- [ ] Remaining simulations are clearly labeled sandbox/demo or backed by real services.
- [ ] Frontend code splitting and performance budgets implemented.

## P3 — Final release polish

- [ ] Accessibility audit completed.
- [ ] Cross-browser regression suite completed.
- [ ] Mobile/tablet/desktop regression suite completed.
- [ ] Documentation consistency audit completed.
- [ ] Release notes prepared.
- [ ] Migration/upgrade notes prepared.
- [ ] Support/operator training material prepared.
- [ ] Gold Master evidence record signed.

## Merged durable-data baseline — 2026-08-20

- [x] PR #6 merged the PostgreSQL schema/RLS/transaction/repository/legacy-mapping foundation after green CI.
- [x] PR #15 merged the bounded authenticated request → PostgreSQL legacy chat runtime after green implementation and synchronized-head CI.
- [x] Main subsequently advanced through separately scoped Dependabot PR #12 to `66142a5a98229efd6035ffacf184dfb896fbb76f` before the current route-gate branch was created.
- [x] Parent durable-data P0 remains incomplete; merged foundations do not constitute production cutover, import/rollback, or backup/restore evidence.

## Current execution cycle — configuration-gated PostgreSQL chat message path

- [x] Repository and PR inventory refreshed first. PR #15 is merged; remaining pre-existing open PRs are separate Dependabot dependency updates.
- [x] Created `feat/postgres-chat-route-gate` from main `66142a5a98229efd6035ffacf184dfb896fbb76f`; created draft PR #16 and did not merge it.
- [x] Added explicit `ZOK_CHAT_STORAGE=json|postgres` gate in `6eb110c4008b8fd8646fbd07a9c37d981e639da1`; PostgreSQL mode requires `ZOK_POSTGRES_URL`, JSON is the default and rollback path.
- [x] Wired `/api/chats` message reads and `/api/chats/:id/messages` writes through the existing authenticated request-bound PostgreSQL runtime when the gate is enabled in `7ca81445a222ba901413d95df8b5074a496b94f0`.
- [x] Preserved existing auth/CSRF/input validation and legacy response shape; expected missing imports fail closed instead of silently reading stale JSON messages.
- [x] Added PostgreSQL service-backed Express API coverage with a non-superuser/NOBYPASSRLS application role in `542bf524de74d4d87fdee978a38bf61e30fa298f`.
- [x] CI `32362476402` passed release-control document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.
- [x] Residual scope is explicit: chat metadata/unread/tags and all non-chat resources remain JSON-backed; no production import/cutover/rollback or backup/restore proof exists.
- [x] `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` synchronized with implementation evidence, residual risks, and release status.

## Next bounded unit

- [ ] Implement a deterministic chat JSON→PostgreSQL import command with dry-run and idempotency/replay tests first; verify rollback/cutover prerequisites before widening the gated live-data surface. Keep `ZOK_CHAT_STORAGE=json` as the default until migration evidence is green.

## Gold Master rule

Gold Master may be declared only when all P0 items are checked with current evidence and all external Gate D evidence is complete. UI simulations, local mock data, or documentation alone are insufficient evidence.
