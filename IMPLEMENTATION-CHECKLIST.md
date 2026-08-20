# Zok Implementation Checklist

**Last updated:** 2026-08-20
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This checklist is the operational companion to `exec-planing.md`. Items may be checked only when current repository/runtime evidence exists.

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
- [x] UI integrations that are not verified are not treated as production connections.

## P0 — Gold Master blockers

### Durable data platform
- [x] PostgreSQL schema defined for tenants, users, roles, contacts, conversations, messages, campaigns, integrations, consent, sessions, and audit events. Evidence: `001_initial.up.sql`, CI `32330521144`.
- [x] Migration up/down/replay verified against PostgreSQL. Evidence: CI `32330980037`.
- [x] PostgreSQL tenant isolation verified using non-superuser `NOBYPASSRLS`. Evidence: CI `32331262316`.
- [x] Tenant-scoped relational integrity rejects cross-tenant object references. Evidence: CI `32331409295`.
- [x] Concurrent PostgreSQL uniqueness/integrity verified. Evidence: CI `32331479289`.
- [x] JSON storage adapter contract implemented and tested.
- [x] Storage abstraction is the live Express persistence boundary. Evidence: CI `32333372481`.
- [x] PostgreSQL transaction adapter provides explicit BEGIN/COMMIT/ROLLBACK, transaction-local tenant context, rollback, guaranteed release, and pool shutdown. Evidence: CI `32335166312`.
- [x] Authenticated identities fail closed without a valid tenant UUID before PostgreSQL transaction acquisition. Evidence: red `32337912124`, green `32337964164`.
- [x] `pg ^8.23.0` is installed with an npm-generated synchronized lockfile and real PostgreSQL 17 pool/RLS integration. Evidence: red `32344793562`, isolated green `32344957870`.
- [x] Express configured-admin principal can carry a validated tenant UUID. Evidence: red `32345044007`, green `32345360432`.
- [x] Request-to-transaction helper fails closed without authenticated tenant identity. Evidence: red `32345449008`, green `32345518040`.
- [x] PostgreSQL transaction context exposes only the already-validated tenant ID to repository code. Evidence: red `32345984084`, green `32346064982`.
- [x] Tenant-scoped normalized contacts repository implemented with validation and real PostgreSQL/RLS coverage. Evidence: repository red `32345736541`; test-harness defect isolated in `32345808587`; transaction/runtime green `32346064982`.
- [x] Tenant-scoped conversations/messages repository implemented with validated channels/directions/sender types. Evidence: red `32346149065`, green `32346242401`.
- [x] Real PostgreSQL 17 integration verifies contact → conversation → message writes for tenant A, no conversation visibility for tenant B, and database rejection of cross-tenant contact references. Evidence: CI `32346343315`.
- [ ] Live Express data routes switched from JSON to PostgreSQL with equivalent API regression coverage.
- [ ] Production JSON→PostgreSQL data migration/cutover and rollback procedure verified.
- [ ] Backup and restore procedure verified with recorded RPO/RTO.

### Identity and governance
- [ ] Tenant-aware principal model fully implemented for production multi-user identity. Current bounded evidence: configured admin sessions expose validated `tenantId`, request-to-PostgreSQL transaction binding is fail-closed; production user/role resolution remains incomplete.
- [ ] Deny-by-default RBAC implemented.
- [ ] Field/channel-level authorization tests added where applicable.
- [ ] Session revocation implemented.
- [ ] Shared production session store implemented.
- [ ] Shared production rate-limit state implemented.
- [ ] Append-only audit events implemented for privileged/data-changing actions.
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
- [ ] Privacy data inventory/consent/export/delete/retention evidence completed.
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

## Current execution cycle — 2026-08-20 normalized relational repositories

- [x] Reused draft PR #6; no duplicate implementation PR created.
- [x] Corrected whitespace-sensitive contacts repository test fake after `32345808587`; production SQL was not changed to satisfy the defective stub.
- [x] Real transaction context test red `32345984084` proved repositories were not receiving tenant context; transaction object now exposes the validated tenant ID and greened in `32346064982`.
- [x] Contacts repository validation/list/create contract verified.
- [x] Conversations/messages repository added test-first: red `32346149065`, green `32346242401`.
- [x] Real relational repository integration green `32346343315` with RLS and tenant-scoped composite FK enforcement.
- [x] Parent durable-data P0 remains incomplete because all live Express data routes still use the JSON adapter and production migration/cutover/rollback plus backup/restore evidence do not exist.
- [x] `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` synchronized.

## Gold Master rule

Gold Master may be declared only when all P0 items are checked with current evidence and all external Gate D evidence is complete. UI simulations, local mock data, or documentation alone are insufficient evidence.
