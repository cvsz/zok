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
- [x] PostgreSQL schema defined for tenants, users, roles, contacts, conversations, messages, campaigns, integrations, consent, sessions, and audit events. Evidence: `server/storage/postgres/migrations/001_initial.up.sql`, `test/postgres-schema.test.js`, CI `32330521144`.
- [x] Migration up/down verification added against a real PostgreSQL service. Evidence: `.github/workflows/ci.yml`, `scripts/postgres-migrations.js`, `test/postgres-migration-runtime.test.js`; CI `32330980037` executed up, down, replayed up, and final rollback successfully.
- [ ] Storage abstraction introduced so JSON persistence is no longer production canonical.
- [x] First storage-boundary slice added: tested JSON adapter contract in `server/storage/json-storage.js` with initialization, serialized concurrent updates, atomic write cleanup, and corrupt-state fail-closed coverage in `test/storage.test.js`.
- [ ] Wire the Express request path to the storage adapter without behavior regressions.
- [ ] Introduce PostgreSQL runtime adapter/connection pooling/transaction boundaries and switch production persistence away from JSON.
- [ ] Tenant-isolation runtime tests added.
- [ ] Concurrent write/integrity tests added for PostgreSQL durable storage.
- [ ] Backup and restore procedure verified.

### Identity and governance
- [ ] Tenant-aware principal model implemented.
- [ ] Deny-by-default RBAC implemented.
- [ ] Field/channel-level authorization tests added where applicable.
- [ ] Session revocation implemented.
- [ ] Shared production session store implemented.
- [ ] Shared production rate-limit state implemented.
- [ ] Append-only audit events implemented.
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
- [ ] Remaining simulations are either clearly labeled sandbox/demo or backed by real services.
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

## Current execution cycle — 2026-08-20 PostgreSQL runtime migration slice

- [x] Inspected `main`, open PRs, active PR #6, and CI before selecting work.
- [x] Reused existing draft PR #6; Dependabot major-version PRs remain isolated from P0 implementation work.
- [x] Selected highest-priority safe unit: real PostgreSQL migration up/down verification in CI.
- [x] Added `test/postgres-migration-runtime.test.js` before the executor implementation.
- [x] TDD red confirmed: CI `32330868918` provisioned a healthy PostgreSQL 17 service and failed on intentionally absent `scripts/postgres-migrations.js`; all pre-existing tests remained green.
- [x] Added minimal migration executor with fail-fast `psql` invocation and single-transaction migration execution.
- [x] Corrected stdin-based invocation before completion so migrations execute from explicit repository file paths.
- [x] Green verification confirmed: CI `32330980037` passed migration up/down/replay, all tests, lint, typecheck, build, and production dependency audit.
- [x] Residual risk recorded: `server.js` still uses live JSON persistence; no PostgreSQL runtime adapter/pool/transaction cutover or tenant-isolation runtime enforcement exists yet.
- [x] `CHANGELOG.md` updated.
- [x] `exec-planing.md` updated for current cycle evidence/status.
- [x] `IMPLEMENTATION-CHECKLIST.md` updated.

## Gold Master rule

Gold Master may be declared only when all P0 items are checked with current evidence and all external Gate D evidence is complete. UI simulations, local mock data, or documentation alone are insufficient evidence.
