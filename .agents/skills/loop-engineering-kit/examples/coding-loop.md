# Coding Loop Example

## Goal
Implement one bounded feature or bug fix.

## Flow
1. Discover project instructions, relevant code, tests, CI failures.
2. Plan the smallest vertical slice.
3. Create isolated worktree.
4. Implement.
5. Run targeted tests/static checks.
6. Independent verifier runs acceptance matrix.
7. Reviewer checks correctness/security/maintainability.
8. Repair blocking findings within retry budget.
9. Run regression suite.
10. Ship only when mandatory gates pass.

## Example acceptance criteria
- target behavior implemented;
- regression test exists;
- lint/type/test gates pass;
- no new critical security finding;
- public interface remains backward compatible unless change was explicitly approved.
