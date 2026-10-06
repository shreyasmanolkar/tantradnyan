"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_shared_failure_and_restore_gap(self):
        trace=model.demo(); self.assertEqual(trace["illustrative_units_cost"],"0.26")
        self.assertTrue(trace["app_a_failure"]); self.assertFalse(trace["nat_failure"])
        self.assertFalse(trace["database_failure"])
        self.assertEqual(trace["restore_gap"],{"missing_operations":["op-2"],"lost_count":1})
    def test_missing_price_and_no_paths(self):
        with self.assertRaises(ValueError): model.cost({"GB":1},{})
        self.assertFalse(model.available([],set()))
        self.assertEqual(model.recovery(["a"],["a"])["lost_count"],0)


if __name__ == "__main__":
    unittest.main()
