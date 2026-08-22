# Loop Engineering Kit

A vendor-neutral, production-oriented framework for building AI agent systems that improve their own work through bounded feedback loops.

## Core lifecycle

`DISCOVER → PLAN → EXECUTE → VERIFY → REVIEW → REPAIR → VERIFY → SHIP`

Every run is constrained by explicit budgets, stop conditions, tool permissions, idempotency rules, independent verification, persistent memory, and human handoff.

## Design principles

1. Closed loops first.
2. Maker and checker separation.
3. No unbounded retries.
4. Every mutation requires explicit authorization.
5. Persist state outside model context.
6. Every action is auditable and idempotent.
7. Verification decides completion, not the executor.
8. Cost/context are first-class resources.
9. Parallel agents use isolated workspaces/worktrees.
10. Escalate when confidence, progress, or budget falls below policy.

## Repository layout

```text
loop-engineering-kit/
├── AGENTS.md
├── README.md
├── config/
│   └── loop.example.yaml
├── agents/
│   ├── orchestrator.md
│   ├── discoverer.md
│   ├── planner.md
│   ├── executor.md
│   ├── verifier.md
│   ├── reviewer.md
│   ├── repairer.md
│   ├── memory-manager.md
│   └── cost-context-governor.md
├── skills/
│   ├── loop-orchestration/SKILL.md
│   ├── repository-discovery/SKILL.md
│   ├── execution-planning/SKILL.md
│   ├── bounded-execution/SKILL.md
│   ├── independent-verification/SKILL.md
│   ├── repair-loop/SKILL.md
│   ├── persistent-memory/SKILL.md
│   ├── worktree-isolation/SKILL.md
│   └── cost-governance/SKILL.md
├── schemas/
│   ├── loop-state.schema.json
│   ├── agent-result.schema.json
│   └── verification-result.schema.json
├── policies/
│   ├── stop-conditions.md
│   ├── permissions.md
│   ├── idempotency.md
│   └── memory-policy.md
├── examples/
│   ├── coding-loop.md
│   ├── research-loop.md
│   ├── content-loop.md
│   └── fleet-loop.md
└── src/
    ├── loop_engine.py
    └── test_loop_engine.py
```

## Quick start

```bash
python -m unittest src/test_loop_engine.py -v
python src/loop_engine.py
```

The Python implementation is intentionally provider-neutral. Replace the demo `AgentAdapter` with adapters for your coding agent, local model gateway, hosted LLM provider, CI system, issue tracker, or connector.

## Acceptance rule

A loop may ship only when all required verification gates pass and no mandatory review is pending. The executor cannot mark its own output as complete.

## Recommended production deployment

Use a durable store (PostgreSQL/SQLite for small deployments), durable queue, object storage for artifacts, isolated execution workers, structured logs, traces, metrics, and explicit connector credentials scoped per agent role.
