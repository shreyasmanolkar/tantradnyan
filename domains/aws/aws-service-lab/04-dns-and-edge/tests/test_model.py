"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_ttl_and_distinct_failures(self):
        trace=model.demo()
        self.assertEqual((trace["before"],trace["cached"],trace["fresh"]), ("old-alb","old-alb","new-alb"))
        self.assertEqual(trace["bad_tls"],"certificate-name-mismatch")
        self.assertEqual(trace["unhealthy"],"503")
    def test_authority_is_not_a_cached_answer(self):
        dns=model.Resolver({"a":"one"}); dns.resolve("a",0,ttl=1)
        dns.authoritative["a"]="two"
        self.assertEqual(dns.resolve("a",1),"two")


if __name__ == "__main__":
    unittest.main()
