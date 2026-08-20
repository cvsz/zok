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
- [x] PostgreSQL schema defined for tenants, users, roles, contacts, conversations, messages, campaigns, integrations, consent, sessions, and audit events. Evidence: `001_initial.up.sql`, `test/postgres-schema.test.js`, CI `32330521144`.
- [x] Migration up/down/replay verification against a real PostgreSQL service. Evidence: CI `32330980037`.
- [x] PostgreSQL tenant-isolation runtime tests using a non-superuser `NOBYPASSRLS` role. Evidence: CI `32331262316`.
- [x] Tenant-scoped relational integrity prevents cross-tenant object references. Evidence: CI `32331409295`.
- [x] Concurrent PostgreSQL uniqueness/integrity verified. Evidence: CI `32331479289`.
- [x] JSON storage adapter contract implemented and tested.
- [x] Storage abstraction is the live Express persistence boundary. Evidence: CI `32333372481`.
- [x] PostgreSQL transaction adapter provides explicit BEGIN/COMMIT/ROLLBACK, transaction-local tenant context, rollback, guaranteed release, and pool shutdown. Evidence: CI `32335166312`.
- [x] Authenticated identity objects fail closed unless they carry a validated tenant UUID before entering a PostgreSQL transaction. Evidence: red `32337912124`, green `32337964164`.
- [x] Production Node PostgreSQL driver/pool is installed with a synchronized npm-generated lockfile and real PostgreSQL 17 pool/RLS integration coverage. Evidence: `pg ^8.23.0`, `createPostgresPool`, red `32344793562`, isolated green `32344957870`.
- [x] Express authenticated principal can carry a validated configured tenant UUID. Evidence: red `32345044007`, green `32345360432`.
- [x] Request-to-transaction binding helper fails closed without authenticated tenant identity and delegates only through `withIdentityTransaction`. Evidence: red `32345449008`, green `32345518040`.
- [ ] Live Express data routes switched from JSON to PostgreSQL with equivalent API regression coverage.
- [ ] Production data migration/cutover and rollback procedure verified.
- [ ] Backup and restore procedure verified with recorded RPO/RTO.

### Identity and governance
- [ ] Tenant-aware principal model fully implemented for production multi-user identity. Current bounded evidence: configured admin sessions expose validated `tenantId`, and request-to-PostgreSQL transaction binding is fail-closed; production user/role resolution is not complete.
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

## Current execution cycle — 2026-08-20 real PostgreSQL pool + request tenant binding

- [x] Reused draft PR #6; no duplicate implementation PR created.
- [x] Generated `pg` manifest + lockfile via npm in a temporary write-enabled workflow, verified `npm ci`, then removed that temporary workflow.
- [x] Real pool integration was test-first: red `32344793562` because `createPostgresPool` did not exist.
- [x] Initial implementation run `32344862826` exposed a test-isolation race around concurrent `pgcrypto` setup; production migration was not weakened. Integration test was isolated to its own database.
- [x] Real PostgreSQL pool/RLS integration green in `32344957870`.
- [x] Express tenant principal test red `32345044007`; validated `ZOK_ADMIN_TENANT_ID` propagation green in `32345360432`.
- [x] Request-to-transaction binding helper red `32345449008`; green in `32345518040`.
- [x] Parent durable-data P0 remains incomplete because live Express data routes are still JSON-backed and production migration/cutover/rollback plus backup/restore evidence do not exist.
- [x] `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` synchronized.

## Gold Master rule

Gold Master may be declared only when all P0 items are checked with current evidence and all external Gate D evidence is complete. UI simulations, local mock data, or documentation alone are insufficient evidence.
