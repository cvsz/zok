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
- [x] PostgreSQL tenant-isolation runtime tests added using a non-superuser `NOBYPASSRLS` application role. Cross-tenant reads are filtered, writes are rejected, and absent tenant context exposes zero tenant rows. Evidence: `002_tenant_rls.*.sql`, CI `32331262316`.
- [x] Tenant-scoped relational integrity added so cross-tenant object references fail at the database foreign-key boundary. Evidence: `003_tenant_relational_integrity.*.sql`, CI `32331409295`.
- [x] Concurrent PostgreSQL write/integrity test added. Twelve competing inserts for one tenant/email key result in exactly one persisted row. Evidence: CI `32331479289`.
- [x] First local storage-boundary slice added: tested JSON adapter contract in `server/storage/json-storage.js`.
- [x] Storage abstraction is now the live Express persistence boundary rather than `server.js`-owned JSON functions. Evidence: `server.js`, `test/storage-boundary-wiring.test.js`, CI `32333372481`.
- [x] PostgreSQL transaction adapter contract implemented with an injected pool, explicit transaction boundaries, transaction-local `app.tenant_id`, rollback, guaranteed release, and pool shutdown. Evidence: `server/storage/postgres-storage.js`, `test/postgres-storage.test.js`, CI `32335166312`.
- [x] Authenticated identity objects can be fail-closed bound to their validated tenant UUID at the PostgreSQL transaction boundary via `withIdentityTransaction`. Evidence: TDD red CI `32337912124`, green CI `32337964164`.
- [ ] Production PostgreSQL Node driver/pool installed and wired with a synchronized lockfile plus real pool integration coverage.
- [ ] Live Express request path switched from JSON to PostgreSQL with equivalent API regression coverage.
- [ ] Production data migration/cutover and rollback procedure verified.
- [ ] Backup and restore procedure verified with recorded RPO/RTO.

### Identity and governance
- [ ] Tenant-aware principal model implemented in the application request path. Current partial foundation: the PostgreSQL adapter accepts an identity carrying a validated `tenantId`, but Express sessions still do not carry one.
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

## Current execution cycle — 2026-08-20 PostgreSQL identity-to-tenant transaction binding

- [x] Reused active draft PR #6; no duplicate implementation PR was created.
- [x] Confirmed the pre-cycle adapter foundation was green in CI `32335166312`.
- [x] Probed Express session tenant identity first; CI `32337797235` failed because login/me did not expose `tenantId`. The exploratory test was reverted because the current connector could not safely patch the large `server.js` file without whole-file replacement; no server capability is claimed from that probe.
- [x] Added `withIdentityTransaction` contract tests before implementation.
- [x] TDD red confirmed in CI `32337912124`: identity transaction calls failed before the method existed.
- [x] Implemented fail-closed identity validation and delegation to the existing transaction-local tenant boundary in `server/storage/postgres-storage.js`.
- [x] Green verification confirmed in CI `32337964164`: `npm ci`, tests, lint, typecheck, build, and production dependency audit passed.
- [x] Residual risks recorded: no production Node PostgreSQL driver/pool is wired; Express authenticated principals still lack tenant IDs; no request-to-transaction end-to-end tenant proof; JSON remains the live adapter; cutover/rollback and backup/restore remain incomplete.
- [x] `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` synchronized with this bounded result.

## Gold Master rule

Gold Master may be declared only when all P0 items are checked with current evidence and all external Gate D evidence is complete. UI simulations, local mock data, or documentation alone are insufficient evidence.
