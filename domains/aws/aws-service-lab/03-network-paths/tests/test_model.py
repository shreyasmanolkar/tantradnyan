"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_longest_prefix_and_return_path(self):
        self.assertEqual(model.demo(), {"specific_route":"local", "broken":"return-acl", "fixed":"connected"})
    def test_acl_priority_and_default_deny(self):
        self.assertFalse(model.acl("10.0.1.2", 443, [(20,"10.0.0.0/8",0,65535,True), (10,"10.0.0.0/8",443,443,False)]))
        self.assertIsNone(model.route("192.0.2.1", []))
        self.assertFalse(model.acl("192.0.2.1", 443, []))


if __name__ == "__main__":
    unittest.main()
