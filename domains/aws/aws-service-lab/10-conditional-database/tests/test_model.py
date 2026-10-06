"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_stale_read_and_write_conflict(self):
        trace=model.demo(); self.assertIsNone(trace["before_replication"])
        self.assertEqual(trace["strong"],{"value":"paid","version":2})
        self.assertTrue(trace["conflict"]); self.assertEqual(trace["after_replication"],trace["strong"])
    def test_create_only_and_isolated_read_copy(self):
        table=model.Table(); table.put("a",{},absent=True)
        with self.assertRaises(model.Conflict): table.put("a",{},absent=True)
        read=table.get("a",consistent=True); read["value"]["bad"]=True
        self.assertEqual(table.get("a",consistent=True)["value"],{})


if __name__ == "__main__":
    unittest.main()
