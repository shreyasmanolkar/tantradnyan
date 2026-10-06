"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_replacement_and_drift(self):
        trace=model.demo(); self.assertTrue(trace["drift_rejected"])
        self.assertEqual({c["resource"]:c["kind"] for c in trace["changes"]},{"table":"replace","service":"update"})
    def test_noop_and_deleted_resource(self):
        self.assertEqual(model.plan({}, {})["changes"],[])
        self.assertEqual(model.plan({"x":{"type":"a"}}, {})["changes"],[{"resource":"x","kind":"delete"}])


if __name__ == "__main__":
    unittest.main()
