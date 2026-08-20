# Zok Implementation Checklist

**Last updated:** 2026-08-20  
**Release state:** FOUNDATION HARDENED / NOT GOLD MASTER

This checklist is the operational companion to `exec-planing.md`. Items are checked only when current repository/runtime evidence exists. A checked bounded slice does not imply its parent production capability is complete.

## Foundation already evidenced

- [x] Canonical runtime: Vite + React with Express API adapter.
- [x] Production build command, automated tests, lint, TypeScript checks, and production dependency audit.
- [x] Authenticated request path, CSRF/origin controls, security headers, request-size/rate controls, and health endpoint.
- [x] Serialized atomic JSON persistence with fail-closed corrupt-state behavior.
- [x] Unverified UI integrations are not treated as production connections.

## P0 — Gold Master blockers

### Durable data platform

- [x] PostgreSQL schema defined for tenants, users, roles, contacts, conversations, messages, campaigns, integrations, consent, sessions, and audit events. Evidence: `001_initial.up.sql`, CI `32330521144`.
- [x] Migration up/down/replay verified. Evidence: CI `32330980037`.
- [x] Tenant RLS verified with non-superuser `NOBYPASSRLS`. Evidence: CI `32331262316`.
- [x] Tenant-scoped relational integrity and concurrent integrity verified. Evidence: CI `32331409295`, `32331479289`.
- [x] Live Express persistence is behind an explicit storage boundary. Evidence: CI `32333372481`.
- [x] Real `pg.Pool` transaction adapter with BEGIN/COMMIT/ROLLBACK, transaction-local tenant context, guaranteed release, and pool shutdown. Evidence: CI `32335166312`, real pool/RLS CI `32344957870`.
- [x] Authenticated identity/request-to-transaction binding fails closed without valid tenant UUID. Evidence: `32337912124` → `32337964164`, `32345449008` → `32345518040`.
- [x] Tenant-scoped contacts and conversations/messages repositories with real PostgreSQL/RLS integration. Evidence: `32346064982`, `32346242401`, `32346343315`.
- [x] Deterministic legacy `/api/chats` compatibility mapper. Evidence: `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, `777af487395161b74fc1be472d1f5ddd448c73fb`, repair `42c1c4995de3f3a22d743f53dd6a630747a32884`, CI `32351874076`.
- [x] Request-bound legacy chat PostgreSQL runtime. Evidence: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`, CI `32357209712`, synchronized-head CI `32357391343`.
- [x] Configuration-gated Express chat message read/write path; JSON remains default/rollback mode. Evidence: `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, `7ca81445a222ba901413d95df8b5074a496b94f0`, `542bf524de74d4d87fdee978a38bf61e30fa298f`, CI `32362476402`, synchronized-head CI `32362766907`; PR #16 merged as `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- [x] Deterministic legacy chat JSON→PostgreSQL import dry-run and ordinary replay/idempotency foundation on draft PR #17. Evidence: importer `a94042d1fc5dc2b013261167c26c96c5d433fac2`, CLI `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, structural replay comparison `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, tests `abc559a7593d657a373cd645eea90295268f4ca0`, implementation-head CI `32367095289`, synchronized-head CI `32367337923`.
- [x] Chat import resumability/checkpointing verified under interruption/restart. Evidence: importer checkpoints `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, atomic checkpoint CLI `a3790630253fb095f11c27613d3796f5682d556c`, interruption/restart/source-binding tests `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`, implementation-head CI `32372290510`.
- [x] Bounded chat cutover/rollback read boundary verified against deterministic imported state. Evidence: `4376ff02ec5260c5da69cae1bd7a5792644efbf4`, implementation-head CI `32377588551`.
- [x] Same-tenant/source concurrent importer coordination verified with a PostgreSQL session advisory lock. Evidence: storage primitive `e17e7048f2664d20a2b1520635b09d1b716ac413`, importer coordination `1a9c46472dd67322cc9ad5c3681d3f041c5e168c`, service-backed regression `962e603e66e96ed454a117b05b4d23662f058c1a`, implementation-head CI `32383484862`.
- [x] Read-only operational chat cutover rehearsal verifies exact imported state and rollback JSON preservation without flipping runtime mode. Missing imported conversations, missing/extra/duplicate messages, or PostgreSQL/source drift fail closed. Evidence: preflight `b82df5aba873238fe5a02ab56360a739a229eb0a`, CLI `6169f08c132345480c02d2f0549c92052b390dad`, PostgreSQL service-backed regression `9b9fc95314b9c90190d69913037e08810c44b165`, implementation-head CI `32389535833`.
- [ ] Production chat cutover/canary and explicit operational rollback executed against a real deployment.
- [ ] Chat metadata/unread/tags migrated from JSON.
- [ ] Campaigns, integrations, AI config, and flow state migrated to PostgreSQL.
- [ ] All live Express data routes switched from JSON to PostgreSQL with equivalent API regression coverage.
- [ ] Application-wide JSON→PostgreSQL migration supports dry-run, idempotency, resumability, cutover, and verified rollback.
- [ ] Backup and restore procedure verified with recorded RPO/RTO.

### Identity and governance

- [ ] Production multi-user tenant-aware principal model implemented. Configured-admin `tenantId` is only bounded foundation evidence.
- [ ] Deny-by-default RBAC implemented.
- [ ] Field/channel-level authorization tests added where applicable.
- [ ] Session revocation implemented.
- [ ] Shared production session store implemented.
- [ ] Shared production rate-limit state implemented.
- [ ] Append-only audit events enforced for privileged/data-changing actions.
- [ ] Audit retention/export controls documented and verified.

### Channels and messaging

- [ ] Provider-neutral inbound/outbound event contracts defined.
- [ ] Webhook signature verification implemented.
- [ ] Idempotency/replay protection implemented.
- [ ] Retry/backoff and dead-letter handling implemented.
- [ ] Delivery-receipt processing implemented.
- [ ] Consent/opt-out enforcement implemented.
- [ ] At least one channel adapter passes provider sandbox contract tests.

### AI governance

- [ ] AI decisions moved behind server-side policy enforcement.
- [ ] Prompt/model versions persisted.
- [ ] Risk classification and sensitive-action approval implemented.
- [ ] PII/redaction and grounding/citation policies implemented where applicable.
- [ ] Cost and latency telemetry recorded.
- [ ] Thai, English, adversarial, and guardrail evaluation sets added.
- [ ] Human escalation/approval audit added.

### Production release evidence

- [ ] HTTPS/reverse-proxy and secure-cookie behavior verified behind real TLS.
- [ ] Penetration test completed and findings remediated/accepted.
- [ ] Load/capacity test completed against agreed SLOs.
- [ ] Backup restore drill completed with recorded RPO/RTO.
- [ ] Privacy inventory/consent/export/delete/retention evidence completed.
- [ ] Production canary and rollback evidence completed.
- [ ] Operations/support sign-off completed.

## P1 — Production capability

- [ ] Durable broadcast/campaign worker implemented.
- [ ] Publicly claimed channel adapters implemented and contract-tested.
- [ ] Migration import supports full dry-run/resumability/idempotency/rollback across resources.
- [ ] Attribution event schema and reconciliation implemented.
- [ ] POS/e-commerce provider adapters implemented with replay-safe contracts.
- [ ] Metrics, traces, structured logs, dashboards, alerts, and SLOs implemented.
- [ ] API key lifecycle and secrets-management procedures implemented and verified.
- [ ] Data export/delete/retention workflows implemented.

## P2 — Product completeness

- [ ] Onboarding/setup wizard state persisted and resumable.
- [ ] Academy enrollment/completion and certificate verification implemented.
- [ ] Marketplace ownership/licensing/moderation/versioning implemented.
- [ ] Production-backed analytics replaces static metrics.
- [ ] Remaining simulations clearly labeled sandbox/demo or backed by real services.
- [ ] Frontend code splitting and performance budgets implemented.

## P3 — Final release polish

- [ ] Accessibility audit completed.
- [ ] Cross-browser and mobile/tablet/desktop regression suites completed.
- [ ] Documentation consistency audit completed.
- [ ] Release and migration/upgrade notes prepared.
- [ ] Support/operator training material prepared.
- [ ] Gold Master evidence record signed.

## Current execution cycle — deterministic/resumable import, cutover/rollback, concurrency coordination, and operational rehearsal

- [x] Repository/PR state refreshed first: `main` baseline `29f0055d439fda5cf5ac8bab5d8755b371be1817`; draft PR #17 reused; separately scoped Dependabot updates remain outside this P0 unit.
- [x] Import validates source chats, supports dry-run, exact replay, deterministic source-bound checkpoints, resumability, and fail-closed conflict handling.
- [x] PostgreSQL service-backed interruption/restart proves checkpoint progress represents committed per-chat transaction boundaries.
- [x] Configuration-gated cutover/rollback regression proves PostgreSQL message reads do not silently mix divergent JSON history and JSON restart remains usable.
- [x] Same-tenant/source database advisory-lock coordination rejects a competing importer while preserving singular committed rows and later idempotent replay.
- [x] Added `server/storage/postgres/chat-cutover-rehearsal.js` as a read-only tenant-scoped preflight over deterministic imported conversations/messages.
- [x] Added `scripts/rehearse-chat-cutover.js`; it runs preflight against the JSON source and PostgreSQL, then requires the JSON rollback snapshot to remain byte-for-byte unchanged.
- [x] Added PostgreSQL service-backed regression proving exact imported state succeeds, missing import fails closed, PostgreSQL message drift fails closed, and rollback JSON bytes remain unchanged across success/failure.
- [x] Rehearsal implementation commits: `b82df5aba873238fe5a02ab56360a739a229eb0a`, `6169f08c132345480c02d2f0549c92052b390dad`, `9b9fc95314b9c90190d69913037e08810c44b165`.
- [x] Rehearsal implementation-head CI `32389535833` passed release documents, PostgreSQL service/client, `npm ci`, tests, lint, typecheck, build, and production dependency audit.
- [x] Residual scope is explicit: this rehearsal is read-only CI evidence, not production traffic/canary/rollback execution; JSON remains default and metadata/unread/tags remain JSON-owned.

## Next bounded unit

- [ ] Implement a bounded PostgreSQL persistence boundary for legacy chat metadata/unread/tags with deterministic mapping and service-backed tenant-isolation/API compatibility tests. Preserve `ZOK_CHAT_STORAGE=json` as default/rollback; do not migrate unrelated resources or claim production canary evidence.

## Gold Master rule

Gold Master may be declared only when all P0 items are checked with current evidence and all external Gate D evidence is complete. UI simulations, local mock data, or documentation alone are insufficient evidence.