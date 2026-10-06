"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_versions_and_stale_writer(self):
        self.assertEqual(model.demo(), {"stale_rejected":True,"current_missing":True,"old_version":"v1","stored_versions":3})
    def test_absent_after_marker_and_failed_write_has_no_version(self):
        bucket=model.Bucket(); bucket.put("a","first",absent=True)
        with self.assertRaises(model.PreconditionFailed): bucket.put("a","second",absent=True)
        self.assertEqual(len(bucket.versions["a"]),1)
        bucket.delete("a"); bucket.put("a","third",absent=True)
        self.assertEqual(bucket.current("a")["body"],"third")


if __name__ == "__main__":
    unittest.main()
