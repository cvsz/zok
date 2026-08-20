# Changelog

All notable release-control and implementation changes to Zok are documented here. The project remains pre-Gold-Master; evidence is recorded by bounded release slice.

## [Unreleased]

### Added
- Evidence-based release controls in `exec-planing.md` and `IMPLEMENTATION-CHECKLIST.md`.
- PostgreSQL schema/migrations, forced tenant RLS, tenant relational integrity, real `pg.Pool` transactions, authenticated tenant binding, and tenant-scoped contacts/conversations/messages repositories.
- Deterministic legacy chat mapping and request-bound PostgreSQL runtime.
- Configuration-gated PostgreSQL chat message reads/writes while `ZOK_CHAT_STORAGE=json` remains the default/rollback mode.
- PR #17 deterministic JSON→PostgreSQL legacy-chat import with dry-run, exact replay/idempotency, source-bound checkpoints, interruption/restart continuation, same-tenant/source advisory-lock exclusion, cutover/rollback regression, and read-only cutover rehearsal.
- PR #17 PostgreSQL legacy chat metadata boundary: deterministic contact metadata includes legacy chat id, avatar, assignment, tags, orders, unread count, and display-only chat time; tenant-scoped contact metadata reads/replacements support request-bound `markRead` and `replaceTags` operations.
- PostgreSQL service-backed metadata regression using a non-superuser/NOBYPASSRLS role verifies imported metadata, unread/tag persistence, preservation of unrelated metadata, and cross-tenant invisibility.
- PostgreSQL-mode `/api/chats` projects persisted avatar, unread count, display time, assignment, tags, and orders from request-bound PostgreSQL metadata while preserving the legacy response shape.
- PostgreSQL-mode `/api/chats/:id/read` and `/api/chats/:id/tags` mutate request-bound tenant-scoped PostgreSQL metadata while preserving JSON unread/tag fields as the rollback snapshot.
- Draft PR #18 moves message-side display-time/unread effects into the verified PostgreSQL chat metadata transaction path: outgoing activity sets PostgreSQL `displayTime` without incrementing unread; inbound customer activity sets `displayTime` and increments unread only for an inactive chat, while an active chat remains at unread zero.
- The JSON storage boundary now preserves PostgreSQL-owned chat `time`/`unread` fields when `ZOK_CHAT_STORAGE=postgres`, preventing legacy delayed-reply callbacks from persisting mixed-store metadata into the rollback snapshot.

### Changed
- Express filesystem persistence remains behind `createJsonStorage`.
- PostgreSQL chat mode remains explicitly configuration-gated; missing expected imports fail closed rather than silently mixing stores.
- Legacy display-only times remain metadata rather than fabricated timestamps.
- PostgreSQL-mode chat GET/read/tag/message-activity metadata now consumes the request-bound PostgreSQL metadata runtime. JSON remains the default/rollback runtime and keeps its existing behavior when `ZOK_CHAT_STORAGE=json`.
- PR #17 merged to `main` as merge commit `e9414b83def9539e0b09c1a8a8419aadbac6b62e`. The current PR #18 branch was created from current `main` `63976dc9d381b7e37f75db275835924df6da4c24`, after independently merged dependency updates.

### Verification evidence
- Foundation: schema `32330521144`; migration runtime `32330980037`; tenant RLS `32331262316`; relational integrity `32331409295`; pool/RLS `32344957870`; repository integration `32346343315`.
- Legacy compatibility/runtime: mapper CI `32351874076`; request-bound runtime CI `32357209712`, synchronized head `32357391343`.
- Configuration-gated message route: implementation CI `32362476402`, synchronized head `32362766907`; merged PR #16 as `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- PR #17 import foundation: `a94042d1fc5dc2b013261167c26c96c5d433fac2`, `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, `abc559a7593d657a373cd645eea90295268f4ca0`; CI `32367095289`, synchronized head `32367337923`.
- PR #17 resumability: `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, `a3790630253fb095f11c27613d3796f5682d556c`, `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`; CI `32372290510`, synchronized head `32372489874`.
- PR #17 cutover/rollback regression `4376ff02ec5260c5da69cae1bd7a5792644efbf4`; CI `32377588551`, synchronized head `32377881739`.
- PR #17 same-source coordination: `e17e7048f2664d20a2b1520635b09d1b716ac413`, `1a9c46472dd67322cc9ad5c3681d3f041c5e168c`, `962e603e66e96ed454a117b05b4d23662f058c1a`; CI `32383484862`, synchronized head `32383857094`.
- PR #17 read-only rehearsal: `b82df5aba873238fe5a02ab56360a739a229eb0a`, `6169f08c132345480c02d2f0549c92052b390dad`, `9b9fc95314b9c90190d69913037e08810c44b165`; CI `32389535833`, synchronized head `32389896928`.
- PR #17 metadata boundary: `7a7b8c8c56c960b405ab63738b9f1a0648ac5021`, `191bdd028502382f52894c8a8cb5c592686c1bf4`, `b474ad078147d510a49b5bc65c314cd6c7aba259`, `357c58128dce60370e61be1e1a40acaf479f61c5`, service-backed `19852412c602756af826a10c8541265cea10620d`; CI `32393891922`.
- PR #17 metadata GET overlay: strict attempt `4361b376c2c480e6c82a45a7e787496cbffefbfa` exposed compatibility regression CI `32395298787`; repair `b162f4753dd450c92ef0056fe52a3a032e7d06e2` plus test `a8b2aab893f9e12b2dbaeae80055dae8f842843a`; green CI `32395415647`.
- PR #17 metadata mutation routes: test-first `515cc33c228dcae498d03e52a440ac5af3e2d0e7`, expected red CI `32400607666`, implementation `085e024914953e0dd08e336593c8dc5aa07586eb`, green CI `32400811542`, synchronized-head CI `32401134450`.
- PR #18 message activity ownership: test-first `0fc6c0c7952b533cd694780a5edec0ff6c6bb328` produced expected failing CI `32408703635`; PostgreSQL runtime implementation `fbc160bdad6da092844cdb36ff90e3abe6ae3fe3`, JSON rollback ownership guard `d9d7eeae1047778904938b371e1d26bbe5f6722d`, and unit coverage `8e49a56c0daf77b8ecb0bc25783b75e9c8157342` passed implementation-head CI `32408937061`. That CI passed release-document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Repository state
- PR #6, #15, #16, and #17 are merged durable-data foundations; PR #17 merge commit is `e9414b83def9539e0b09c1a8a8419aadbac6b62e`.
- Draft PR #18 (`feat/postgres-message-metadata`) is the current implementation PR and remains unmerged.
- PR #18 is based on current `main` `63976dc9d381b7e37f75db275835924df6da4c24`.
- Remaining major dependency PRs stay separately scoped from this P0 durable-data slice.

### Residual risks / not claimed
- The bounded chat runtime now has repository/CI evidence for imported messages plus GET/read/tag/message-side unread/display-time metadata ownership, but this is still configuration-gated application evidence rather than a production deployment cutover.
- The JSON ownership guard is intentionally limited to `time` and `unread` while PostgreSQL mode is active; broader application data remains unmigrated.
- No production cutover/canary/operator rollback evidence exists; prior rehearsal is read-only CI evidence.
- Campaigns, integrations, AI config, and flow state remain JSON-backed.
- Application-wide PostgreSQL cutover and backup/restore RPO/RTO remain incomplete.
- Production multi-user identity/RBAC, append-only audit enforcement, shared session/rate-limit state, provider reliability/consent, AI governance, privacy/observability/load/security exercises, and Gate D remain incomplete.

### Release status
- **FOUNDATION HARDENED / NOT GOLD MASTER.**

## [2026-08-10]

### Security and runtime hardening
- Removed hardcoded demo credentials from the canonical login path.
- Added authenticated sessions, CSRF/origin checks, rate limiting, validation, safe errors, security headers, health verification, and serialized atomic JSON persistence.
- Established Vite + React with Express as the canonical runtime and added test/lint/typecheck/build/production-audit release gates.