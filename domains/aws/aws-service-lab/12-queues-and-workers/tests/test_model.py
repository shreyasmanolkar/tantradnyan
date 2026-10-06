"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_visibility_receipts_and_dead_letter(self):
        self.assertEqual(model.demo(),{"hidden":None,"receives":2,"stale_ack":False,"fresh_ack":True,"dead_letters":["poison"]})
    def test_extend_visibility_and_empty_queue(self):
        queue=model.Queue(); self.assertIsNone(queue.receive(0)); queue.send("a",{})
        receipt=queue.receive(0)["receipt"]
        self.assertTrue(queue.change_visibility("a",receipt,1,10))
        self.assertIsNone(queue.receive(10)); self.assertIsNotNone(queue.receive(11))


if __name__ == "__main__":
    unittest.main()
