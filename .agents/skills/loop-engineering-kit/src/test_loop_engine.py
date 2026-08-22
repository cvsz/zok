import tempfile
import unittest

try:
    from src.loop_engine import (
        LoopEngine, DemoAdapter, JsonlMemoryStore, Budgets, State,
        AgentResult, Usage
    )
except ModuleNotFoundError:
    from loop_engine import (
        LoopEngine, DemoAdapter, JsonlMemoryStore, Budgets, State,
        AgentResult, Usage
    )


class NoProgressAdapter:
    def run(self, role, state):
        return AgentResult(
            status="OK",
            summary="No measurable progress",
            progress=False,
            usage=Usage(tokens=1, cost=0.0),
        )


class BlockedAdapter:
    def run(self, role, state):
        return AgentResult(
            status="BLOCKED",
            summary="Human approval required",
            progress=False,
        )


class LoopEngineTests(unittest.TestCase):
    def test_demo_repairs_then_ships(self):
        with tempfile.NamedTemporaryFile() as f:
            engine = LoopEngine(DemoAdapter(), JsonlMemoryStore(f.name))
            result = engine.run("goal", ["criterion"])
            self.assertEqual(result.state, State.SHIPPED)
            self.assertEqual(result.repair_attempts, 1)
            self.assertGreaterEqual(len(result.evidence), 1)

    def test_no_progress_handoffs(self):
        with tempfile.NamedTemporaryFile() as f:
            budgets = Budgets(max_iterations=20, max_consecutive_no_progress=2)
            engine = LoopEngine(NoProgressAdapter(), JsonlMemoryStore(f.name))
            result = engine.run("goal", ["criterion"], budgets)
            self.assertEqual(result.state, State.HANDOFF)
            self.assertIn("no_progress", result.blockers)

    def test_blocked_handoffs(self):
        with tempfile.NamedTemporaryFile() as f:
            engine = LoopEngine(BlockedAdapter(), JsonlMemoryStore(f.name))
            result = engine.run("goal", ["criterion"])
            self.assertEqual(result.state, State.HANDOFF)


if __name__ == "__main__":
    unittest.main()
