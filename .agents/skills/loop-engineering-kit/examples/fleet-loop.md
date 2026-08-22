# Fleet Loop Example

```text
                   Orchestrator
           ┌──────────┼──────────┐
           ↓          ↓          ↓
      Research     Engineer       QA
           ↓          ↓          ↓
      evidence    worktree     verifier
                      ↓
                   reviewer
                      ↓
                    repair
```

## Fleet rules
- Orchestrator owns the global budget.
- Specialists receive scoped subgoals and smaller budgets.
- Mutating specialists use isolated worktrees.
- Shared memory is authoritative; chat context is not.
- Cross-agent file conflicts are detected before merge.
- QA/verifier is independent of the implementation agent.
- Parallelism is capped.
