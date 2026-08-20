# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- Tested JSON storage boundary and Express architecture regression coverage.
- Initial normalized PostgreSQL schema + rollback migrations for tenants, users/roles, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events.
- PostgreSQL 17 migration up/down/replay, forced RLS, tenant relational-integrity, and real pool verification.
- `server/storage/postgres-storage.js` with real `pg.Pool`, explicit transaction boundaries, transaction-local tenant context, rollback, guaranteed client release, and authenticated identity binding.
- Tenant-scoped contacts and conversations/messages repositories with real PostgreSQL/RLS coverage.
- Pure legacy-chat compatibility mapper with deterministic `legacy-chat:<id>` contact/thread IDs and indexed message IDs.
- `server/storage/postgres/legacy-chat-runtime.js` as an authenticated request → tenant transaction → normalized conversations repository boundary.
- `server/storage/postgres/chat-route-gate.js` with explicit `ZOK_CHAT_STORAGE=json|postgres`; JSON remains the default/rollback mode and PostgreSQL mode requires `ZOK_POSTGRES_URL`.
- PostgreSQL service-backed Express API regression coverage for the gated chat message path using a non-superuser `NOBYPASSRLS` application role.
- Draft PR #17 adds `server/storage/postgres/legacy-chat-import.js`, a deterministic legacy chat JSON→PostgreSQL importer that validates source records through the existing compatibility mapper, reuses stable external IDs on exact replay, and fails closed on duplicate, ambiguous, or conflicting replay state.
- Draft PR #17 adds `scripts/import-legacy-chats.js`; `--dry-run` validates and counts without acquiring PostgreSQL storage, while write mode requires `ZOK_POSTGRES_URL` and a valid tenant UUID.
- PostgreSQL service-backed import regression coverage verifies first import creation, exact replay without duplicate rows, and conflicting replay rejection without adding messages.
- Draft PR #17 adds source-bound resumable import checkpoints containing version, tenant, deterministic normalized-source SHA-256 digest, next chat index, and total chat count.
- `scripts/import-legacy-chats.js` supports `--checkpoint <file>` and `--resume`; checkpoint files are replaced atomically after each committed chat and resume fails closed if tenant/source/progress metadata does not match.
- PostgreSQL service-backed interruption/restart regression verifies that a checkpoint is emitted only after a per-chat transaction commits, an injected interruption leaves only committed progress, and restart resumes from the next chat without duplicating earlier rows.
- PostgreSQL service-backed cutover/rollback regression imports deterministic chat state, verifies PostgreSQL mode serves imported message state rather than divergent JSON messages, verifies an expected-but-unimported JSON chat fails with `503`, then restarts in JSON mode and verifies the rollback store remains readable and behaviorally intact.
- PostgreSQL storage exposes a bounded session advisory-lock primitive used by legacy chat import coordination. Same-tenant/source lock keys derive from tenant UUID plus deterministic normalized-source digest; competing acquisition fails closed instead of waiting silently.
- PostgreSQL service-backed concurrency regression verifies a second importer for the same tenant/source is rejected while the first importer holds the database lock, committed rows remain singular, and ordinary replay succeeds after release.
- Draft PR #17 adds `server/storage/postgres/chat-cutover-rehearsal.js`, a read-only fail-closed preflight that requires every deterministic source conversation/message to exist and structurally match tenant-scoped PostgreSQL state before a cutover can be considered ready.
- Draft PR #17 adds `scripts/rehearse-chat-cutover.js`, which runs the PostgreSQL preflight against the configured JSON source and then verifies the JSON rollback snapshot remains byte-for-byte unchanged.
- PostgreSQL service-backed rehearsal regression verifies exact imported state succeeds, missing imported state fails closed, PostgreSQL/source drift fails closed, and the rollback JSON bytes remain unchanged on both success and failure paths.

### Changed
- `server.js` delegates filesystem persistence to `createJsonStorage` rather than owning JSON write internals.
- PostgreSQL transaction callbacks expose only the already-validated tenant ID to repository code.
- Durable-data execution proceeds through bounded, reversible slices rather than a monolithic cutover.
- Legacy display-only message times are preserved as metadata rather than fabricated as database timestamps.
- When `ZOK_CHAT_STORAGE=postgres`, `/api/chats` message history and `/api/chats/:id/messages` persistence use the request-bound PostgreSQL runtime; auth, CSRF, validation, and legacy response shape remain in place.
- Chat metadata, unread state, tags, and all non-chat resources remain JSON-backed. Missing expected `legacy-chat:<id>` imports fail closed instead of silently falling back to JSON message history.
- PR #16 is recorded as merged as `dc677799cbac6ee793a612330313b1c39f5cc7ca` after synchronized-head CI `32362766907` passed.
- Legacy chat import write execution commits one validated chat per tenant-scoped transaction so durable checkpoint progress can represent a completed transaction boundary.
- Legacy chat write imports hold a database-backed same-tenant/source advisory lock across the import loop and checkpoint callbacks. This verifies same-source exclusion only; it does not claim safe operational parallelism for arbitrary different sources or tenants.
- Operational cutover readiness now has an explicit read-only preflight command. It does not change `ZOK_CHAT_STORAGE`, mutate PostgreSQL rows, modify the JSON rollback source, or constitute production canary/cutover evidence.

### Verification evidence
- PostgreSQL schema CI `32330521144`; migration runtime `32330980037`; tenant RLS `32331262316`; relational integrity `32331409295`; concurrent integrity `32331479289`.
- Express storage boundary CI `32333372481`; identity transaction red/green `32337912124` / `32337964164`; real pool/RLS `32344957870`.
- Request-to-transaction and repository evidence: `32345518040`, `32346064982`, `32346242401`, `32346343315`.
- Legacy compatibility mapping: `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, `777af487395161b74fc1be472d1f5ddd448c73fb`, repair `42c1c4995de3f3a22d743f53dd6a630747a32884`, CI `32351874076`.
- Bounded request-bound runtime: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`, CI `32357209712`, synchronized-head CI `32357391343`.
- Configuration-gated route slice: `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, `7ca81445a222ba901413d95df8b5074a496b94f0`, `542bf524de74d4d87fdee978a38bf61e30fa298f`, implementation-head CI `32362476402`, synchronized-head CI `32362766907`, merge `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- Deterministic chat import foundation on draft PR #17: importer `a94042d1fc5dc2b013261167c26c96c5d433fac2`, CLI `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, structural replay comparison `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, service-backed tests `abc559a7593d657a373cd645eea90295268f4ca0`, implementation CI `32367095289`, synchronized-head CI `32367337923`.
- Resumable/checkpointed chat import: checkpointed importer `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, atomic checkpoint CLI `a3790630253fb095f11c27613d3796f5682d556c`, interruption/restart and source-bound checkpoint tests `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`, implementation-head CI `32372290510`.
- Chat cutover/rollback regression: `4376ff02ec5260c5da69cae1bd7a5792644efbf4`; implementation-head CI `32377588551`.
- Same-tenant/source import coordination: advisory storage primitive `e17e7048f2664d20a2b1520635b09d1b716ac413`, importer coordination `1a9c46472dd67322cc9ad5c3681d3f041c5e168c`, service-backed concurrency regression `962e603e66e96ed454a117b05b4d23662f058c1a`; implementation-head CI `32383484862`.
- Read-only operational cutover rehearsal: preflight `b82df5aba873238fe5a02ab56360a739a229eb0a`, CLI `6169f08c132345480c02d2f0549c92052b390dad`, service-backed success/missing-import/drift/rollback-snapshot regression `9b9fc95314b9c90190d69913037e08810c44b165`; implementation-head CI `32389535833` passed release-control documents, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Repository state
- PR #6 merged the PostgreSQL schema/RLS/transaction/repository/legacy-mapping foundation as `edbc8ba85a534e49fe3881b24c8a55560671421f`.
- PR #15 merged the bounded request-bound legacy chat runtime after green implementation and synchronized-head CI.
- PR #16 merged the configuration-gated chat message read/write slice as `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- Current `main` baseline for PR #17 is `29f0055d439fda5cf5ac8bab5d8755b371be1817`.
- Draft PR #17 (`feat/postgres-chat-import`) is open and intentionally unmerged.
- Remaining open dependency PRs are separately scoped Dependabot updates and remain outside this P0 durable-data slice.

### Residual risks / not claimed
- The import track proves validation, dry-run behavior, exact ordinary replay idempotency, deterministic source-bound checkpoints, interruption/restart continuation, bounded configuration-gated cutover/rollback read behavior, same-tenant/source competing-import exclusion, and a read-only exact-state operational preflight against PostgreSQL CI.
- The rehearsal is not a production cutover or canary: it never flips runtime mode, carries no production traffic, and does not execute deployment/operator rollback.
- `ZOK_CHAT_STORAGE=json` remains the default; chat metadata/unread/tags still come from JSON and no production data has been migrated by the rehearsal.
- Same-tenant/source competing importers fail closed, but operational parallel import for different sources/tenants, lock observability/timeout policy, and multi-process runbook behavior are not claimed.
- Chat metadata, unread state, tags, campaigns, integrations, AI config, and flow state remain JSON-backed.
- Application-wide JSON→PostgreSQL cutover and backup/restore RPO/RTO evidence remain incomplete.
- Production multi-user tenant identity/RBAC, append-only audit enforcement, shared session/rate-limit state, provider delivery controls, AI governance, and Gate D remain incomplete.
- Local clone/install verification is unavailable because `github.com` DNS resolution fails in this execution environment; GitHub Actions is the execution evidence for this slice.

### Release status
- **FOUNDATION HARDENED / NOT GOLD MASTER.**

## [2026-08-10]

### Security and runtime hardening
- Removed hardcoded demo credentials from the canonical login path.
- Added authenticated session handling, CSRF/origin checks, rate limiting, validation, safe error handling, and security headers.
- Added health verification and serialized atomic JSON persistence behavior.
- Established Vite + React frontend with Express adapter as the canonical runtime.
- Added test, lint, typecheck, build, and production dependency audit release gates.

### Known release blockers
- Durable PostgreSQL application-runtime cutover remains incomplete.
- Enterprise identity/RBAC/audit governance remains incomplete.
- Shared production session/rate-limit state remains incomplete.
- Real channel/POS adapters and durable queue workers remain incomplete.
- AI policy/evaluation service remains incomplete.
- Independent security, load, disaster-recovery, privacy, and production-edge evidence remain incomplete.