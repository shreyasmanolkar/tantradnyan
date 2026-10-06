"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_independent_copies_and_partial_fanout(self):
        trace=model.demo()
        self.assertEqual(trace["partial"],{"delivered":["billing"],"failed":["audit"]})
        self.assertEqual(trace["audit_still_has_copy"],1)
        self.assertEqual(trace["billing_consumed"],0); self.assertFalse(trace["shipping_matched"])
    def test_filtered_event_and_mutation_isolation(self):
        inboxes={}; event={"type":"a","payload":[]}
        model.publish(event,{"one":{"type":["a"]},"two":{"type":["a"]}},inboxes)
        inboxes["one"][0]["payload"].append(1)
        self.assertEqual(inboxes["two"][0]["payload"],[])
        self.assertFalse(model.matches({"type":"b"},{"type":["a"]}))


if __name__ == "__main__":
    unittest.main()
