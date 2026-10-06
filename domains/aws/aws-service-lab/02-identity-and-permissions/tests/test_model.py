"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_prefix_condition_and_deny(self):
        self.assertEqual(model.demo(), {"allowed":"allow", "wrong_prefix":"implicit-deny", "explicit":"explicit-deny", "expired":True})
    def test_boundary_is_not_a_grant(self):
        allow=[{"effect":"allow", "actions":["*"], "resources":["*"]}]
        self.assertEqual(model.decision([], "a", "r", boundary=allow), "implicit-deny")
        self.assertEqual(model.decision(allow, "a", "r", boundary=[]), "boundary-deny")


if __name__ == "__main__":
    unittest.main()
