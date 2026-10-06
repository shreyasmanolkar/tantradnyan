"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_transaction_and_snapshot(self):
        self.assertEqual(model.demo(),{"first":"committed","retry":"duplicate","live_total":9,"restored_total":7})
    def test_restart_receipt_and_mismatched_id(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"db"; ledger=model.Ledger(path); ledger.accept("x",3); ledger.close()
            ledger=model.Ledger(path)
            try:
                self.assertEqual(ledger.accept("x",3),"duplicate")
                with self.assertRaises(ValueError): ledger.accept("x",4)
                self.assertEqual(ledger.total(),3)
            finally: ledger.close()


if __name__ == "__main__":
    unittest.main()
