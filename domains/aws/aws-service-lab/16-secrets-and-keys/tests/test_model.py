"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_rotation_and_context(self):
        trace=model.demo(); self.assertEqual((trace["task_generation"],trace["current_generation"]),(1,2))
        self.assertTrue(trace["task_refresh_required"]); self.assertTrue(trace["wrong_context_rejected"])
    def test_key_state_and_principal_gate(self):
        store=model.EnvelopeModel(); token=store.seal("synthetic",{})
        with self.assertRaises(PermissionError): store.open(token,{},False)
        store.key_enabled=False
        with self.assertRaises(PermissionError): store.open(token,{},True)


if __name__ == "__main__":
    unittest.main()
