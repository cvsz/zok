# Zok Master Execution Plan

**Status:** Active release-control ledger
**Last updated:** 2026-08-20
**Canonical branch:** `main`
**Canonical runtime:** Vite + React frontend with Express API adapter
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This file is the canonical execution source for release work. Every implementation cycle must select the highest-priority incomplete item, produce verifiable evidence, and update this file together with `IMPLEMENTATION-CHECKLIST.md` and `CHANGELOG.md`.

---

## 1. Release Objective

Deliver Zok as a production-ready conversational-commerce platform without representing UI simulations as completed backend capability. Release claims must be backed by tests, runtime evidence, security controls, operational readiness, and current documentation.

### Non-negotiable rules

1. No unchecked implementation item may be reported as complete without evidence.
2. No mock integration, static metric, demo AI behavior, or UI-only control counts as a production capability.
3. Every code-changing execution cycle must run the relevant verification gate before marking work complete.
4. Every completed execution cycle must update:
   - `CHANGELOG.md`
   - `exec-planing.md`
   - `IMPLEMENTATION-CHECKLIST.md`
5. Any release-impacting architecture or security change must also update the relevant README/deployment/security documentation.

---

## 2. Current Architecture Baseline

```text
Browser
  -> Vite/React client
  -> src/lib/api.js
  -> Express API adapter (loopback)
  -> auth/session/origin/CSRF/rate-limit/validation middleware
  -> serialized atomic JSON storage adapter
```

Current repository evidence already supports a hardened sandbox foundation: authenticated request paths, CSRF/origin protection, security headers, rate limiting, atomic JSON writes, health checks, lint/typecheck/build/test gates, and production dependency audit.

The current architecture is not yet horizontally scalable, multi-tenant, provider-integrated, or enterprise-governed. An initial PostgreSQL schema contract now exists in the branch, but it is not wired into the runtime and has not been executed against a real PostgreSQL service in CI.

---

## 3. Master Priority Queue

Execution must proceed from P0 to P3 unless a blocking defect requires immediate priority escalation.

### P0 — Gold-Master blockers

- [ ] Replace local JSON persistence with durable PostgreSQL storage and migrations.
- [ ] Introduce tenant-aware identity and deny-by-default RBAC.
- [ ] Persist append-only audit events for privileged and data-changing actions.
- [ ] Move sessions and rate-limit state to shared production-capable storage.
- [ ] Define provider-neutral channel event contracts.
- [ ] Implement webhook signature verification, idempotency, retries, dead-letter handling, and delivery receipts.
- [ ] Implement consent/opt-out enforcement for outbound communication.
- [ ] Move AI policy decisions server-side with prompt/model versioning, risk controls, approval flows, cost/latency records, and evaluation suites.
- [ ] Complete production edge verification for HTTPS, reverse proxy, secure cookies, health, and rollback.
- [ ] Complete independent security review, load test, backup/restore drill, privacy review, and release sign-off.

### P1 — Production capability

- [ ] Implement real channel adapters for the channels that are publicly claimed.
- [ ] Implement durable campaigns/broadcast workers.
- [ ] Implement multi-touch event schema and attribution reconciliation.
- [ ] Implement migration import with dry-run, idempotency, resumability, and rollback.
- [ ] Implement POS/e-commerce provider adapters with replay-safe contracts.
- [ ] Add metrics, traces, structured logs, SLOs, alerts, and incident runbooks.
- [ ] Add tenant-scoped API keys, rotation, revocation, and secrets handling.
- [ ] Add export/delete/retention workflows for privacy obligations.

### P2 — Product completeness

- [ ] Persist onboarding/setup wizard state.
- [ ] Implement Academy enrollment/completion/certificate verification.
- [ ] Implement marketplace ownership, publishing, moderation, and versioning.
- [ ] Add production-backed analytics and operational reporting.
- [ ] Replace remaining UI-only simulations with explicit sandbox labeling or real services.
- [ ] Split oversized frontend bundles and enforce performance budgets.

### P3 — Release polish

- [ ] Accessibility audit and remediation.
- [ ] Cross-browser/device regression suite.
- [ ] Final documentation consistency audit.
- [ ] Release notes and migration notes.
- [ ] Support/operator training material.
- [ ] Signed Gold Master evidence record.

---

## 4. Execution Protocol

For each execution cycle:

1. Read `exec-planing.md`, `IMPLEMENTATION-CHECKLIST.md`, and the latest `CHANGELOG.md` entry.
2. Inspect current code and CI before choosing work.
3. Select one coherent highest-priority incomplete unit that can be completed and verified safely.
4. Implement only that bounded unit and its tests/docs.
5. Run relevant gates.
6. Record exact evidence and residual risk.
7. Update all three release-control documents in the same change set.
8. Do not mark a broader phase complete when only a subset is verified.

### Completion evidence format

Every completed checklist item should have enough information to answer:

- What changed?
- Which files/components enforce it?
- What test or runtime command verifies it?
- What remains outside the repository or environment?

---

## 5. Verification Gates

### Gate A — Dependency and repository integrity

```bash
npm ci
npm audit --omit=dev --audit-level=high
```

Required: reproducible install; no unresolved production high/critical vulnerability; no committed secrets/runtime DB/build output.

### Gate B — Static and automated verification

```bash
npm test
npm run lint
npm run typecheck
```

Required: tests pass; no lint errors; typecheck passes; security-sensitive negative cases fail closed.

### Gate C — Build and production-shaped smoke

```bash
npm run build
NODE_ENV=production npm start
curl -fsS http://127.0.0.1:3005/api/health
```

Required: successful build/start/health; API remains loopback-only when deployed behind the edge; HTTPS and secure-cookie behavior verified in the deployment environment.

### Gate D — Enterprise release evidence

Required before Gold Master:

- tenant-isolation and RBAC security review;
- provider contract/replay tests for each claimed integration;
- AI evaluation and guardrail evidence;
- penetration test and remediation record;
- load/capacity test against agreed SLOs;
- backup restore drill and documented RPO/RTO;
- privacy/data lifecycle evidence;
- monitored canary, rollback proof, and operational sign-off.

---

## 6. CI / Workflow Target State

GitHub Actions should enforce, at minimum:

- clean dependency installation;
- test, lint, typecheck, production build;
- production dependency audit;
- documentation/release-control presence checks;
- dependency updates through GitHub-native automation where appropriate;
- least-privilege permissions and concurrency cancellation;
- workflow versions pinned to supported major releases.

Workflow failures are release blockers until triaged and recorded.

---

## 7. GitHub Documentation and Template Target State

Repository collaboration metadata must remain aligned with the release process:

- PR template requires verification and release-document synchronization.
- Bug template captures reproducibility, severity, regression, environment, and security impact.
- Feature template captures problem, scope, acceptance criteria, architecture/security/data impacts, and evidence expectations.
- Security-sensitive findings must not be pasted into public issue bodies when disclosure should be private.
- Contributor docs must point to the canonical execution/checklist/release gates.

---

## 8. Current Release Decision

The current codebase has a hardened sandbox/developer foundation, but enterprise platform requirements remain incomplete. Gold Master promotion is forbidden until every P0 blocker is completed with current evidence and Gate D is signed off.

**Current verdict:** FOUNDATION HARDENED / NOT GOLD MASTER.

---

## 9. Next Execution Order

Unless a failing CI/security defect supersedes it, execute in this order:

1. Durable PostgreSQL data model + migrations + storage abstraction.
2. Tenant identity/RBAC + audit event foundation.
3. Shared session/rate-limit state.
4. Provider-neutral event contract + queue/retry/idempotency base.
5. First verified channel adapter.
6. AI policy/evaluation service.
7. Privacy lifecycle + migration/attribution/POS capability.
8. Observability, load/DR/security exercises.
9. Product-completeness features and Gold Master polish.

At the end of every cycle, synchronize `CHANGELOG.md`, this file, and `IMPLEMENTATION-CHECKLIST.md` before considering the cycle complete.

---

## 10. Active execution cycle — 2026-08-20 PostgreSQL schema slice

**Branch:** `feat/postgres-storage-foundation`
**PR:** #6 (draft)
**Selected bounded unit:** define the initial PostgreSQL schema contract required by the P0 durable-data platform without claiming runtime migration execution, PostgreSQL adapter wiring, tenant isolation, or production cutover.

### Evidence

1. Inspected `main`, all open PRs, PR #6, and CI before selecting work. PR #6 was already the active durable-storage branch and its previous head CI run `32329765447` was green, so this run reused that PR instead of creating another.
2. Added `test/postgres-schema.test.js` before the migration files. The contract requires tables for tenants, roles, users, user-role membership, contacts, conversations, messages, campaigns, integrations, consent records, sessions, and audit events; tenant ownership foreign keys; scoped uniqueness; constrained message direction/campaign status; and explicit down-migration teardown coverage.
3. TDD red was confirmed in CI run `32330472344`: the new tests failed with `ENOENT` for the intentionally absent `001_initial.up.sql` and `001_initial.down.sql`, while the existing API hardening and JSON storage tests passed.
4. Added `server/storage/postgres/migrations/001_initial.up.sql` with UUID primary keys, tenant-scoped foreign keys, scoped uniqueness constraints, domain checks, timestamps, and supporting indexes for the required initial data model.
5. Added `server/storage/postgres/migrations/001_initial.down.sql` with explicit reverse-order table teardown.
6. Green verification was confirmed by CI run `32330521144`, which passed release-control document checks, `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm audit --omit=dev --audit-level=high`.

### Status recorded this cycle

- PostgreSQL schema definition is complete at the repository-contract level and is marked complete in `IMPLEMENTATION-CHECKLIST.md`.
- The parent P0 item "Replace local JSON persistence with durable PostgreSQL storage and migrations" remains unchecked.
- `Migration up/down verification added` remains unchecked because the SQL has not been executed and rolled back against a real PostgreSQL server in CI.

### Residual risk / incomplete scope

- `server.js` still owns and uses the live JSON persistence path; the storage adapter is not wired into the Express request path.
- The PostgreSQL migration pair has structural regression coverage only; no real PostgreSQL service has executed the up/down migration in this repository's CI evidence.
- No PostgreSQL runtime adapter, transaction implementation, connection pooling, tenant-isolation runtime tests, backup/restore evidence, or production cutover exists yet.
- Dependabot major-version PRs remain separate and were not merged or mixed into this P0 storage work.
- The next safe durable-data unit is runtime migration up/down verification against PostgreSQL if CI infrastructure can support it; otherwise wire `server.js` to the existing storage abstraction without changing API behavior.
