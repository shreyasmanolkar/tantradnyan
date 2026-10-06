"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_tail_and_missing_data(self):
        trace=model.demo(); self.assertEqual(trace["p99_ms"],10); self.assertEqual(trace["p100_ms"],1000)
        self.assertEqual(trace["alarm"],"ALARM"); self.assertEqual(trace["missing"],"INSUFFICIENT_DATA")
        self.assertAlmostEqual(trace["budget"]["burn"],.5)
    def test_missing_policy_changes_result(self):
        self.assertEqual(model.alarm([],80,missing="breaching"),"ALARM")
        self.assertEqual(model.alarm([],80,missing="not-breaching"),"OK")
        with self.assertRaises(ValueError): model.percentile([], .99)


if __name__ == "__main__":
    unittest.main()
