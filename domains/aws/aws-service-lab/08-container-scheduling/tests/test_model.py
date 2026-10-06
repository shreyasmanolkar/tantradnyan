"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_memory_is_the_bottleneck_and_health_gates_revision(self):
        trace=model.demo()
        self.assertEqual(trace["pending"],["task-2"])
        self.assertEqual(len(trace["placed"]),2)
        self.assertFalse(trace["cutover_before_health"])
        self.assertTrue(trace["cutover_after_health"])
    def test_no_hosts_and_does_not_mutate_capacity(self):
        task={"id":"a","cpu":1,"memory":1}; hosts=[{"id":"h","cpu":1,"memory":1}]
        self.assertEqual(model.place([task],[]),([], ["a"]))
        model.place([task],hosts); self.assertEqual(hosts[0]["cpu"],1)


if __name__ == "__main__":
    unittest.main()
