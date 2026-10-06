"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_retry_and_provision_failure(self):
        self.assertEqual(model.demo(), {"accepted":"pending", "same_id_after_retry":True, "resources":1, "failed":"failed", "recovered":"ready"})
    def test_token_reuse_rejects_changed_intent(self):
        api=model.ControlPlane(); api.create("x", {"size":1})
        with self.assertRaises(ValueError): api.create("x", {"size":2})
        self.assertEqual(len(api.resources), 1)


if __name__ == "__main__":
    unittest.main()
