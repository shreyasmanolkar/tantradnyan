"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_replay_and_consumer_independence(self):
        trace=model.demo(); self.assertEqual(trace["first"],trace["replayed_before_checkpoint"])
        self.assertEqual([r["value"] for r in trace["after_checkpoint"]],["b"])
        self.assertEqual([r["value"] for r in trace["independent_consumer"]],["a","b"])
    def test_checkpoint_must_be_a_monotone_prefix(self):
        stream=model.Stream(1); stream.append("k",1); stream.checkpoint("c",0,1)
        with self.assertRaises(ValueError): stream.checkpoint("c",0,0)
        with self.assertRaises(ValueError): stream.checkpoint("c",0,2)


if __name__ == "__main__":
    unittest.main()
