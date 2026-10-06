"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_flush_and_snapshot_cut(self):
        trace=model.demo()
        self.assertTrue(trace["buffered_write_lost"])
        self.assertTrue(trace["snapshot_unchanged"])
        self.assertEqual(trace["live"],{0:"later-page"})
    def test_empty_and_unflushed_volume(self):
        volume=model.Volume(); volume.write(2,"x")
        self.assertEqual(volume.snapshot(),{})
        volume.flush(); self.assertEqual(volume.snapshot(),{2:"x"})


if __name__ == "__main__":
    unittest.main()
