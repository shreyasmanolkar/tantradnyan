"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_both_retry_boundaries(self):
        trace=model.demo(); self.assertEqual(trace["queued_after_lost_confirmation"],2)
        self.assertEqual(trace["worker_replay"],"duplicate"); self.assertEqual(trace["effects"],1)
        self.assertTrue(trace["queue_empty"]); self.assertEqual(trace["result"]["output"],"HELLO")
    def test_id_conflict_and_permission_have_no_new_effect(self):
        with tempfile.TemporaryDirectory() as folder:
            service=model.Service(Path(folder)/"state"); service.submit("x","k","a")
            with self.assertRaises(ValueError): service.submit("x","k","b")
            with self.assertRaises(PermissionError): service.submit("y","k","a",allowed=False)
            self.assertEqual(len(service.state["commands"]),1)
    def test_many_jobs_and_restore_carries_receipts(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"state"; service=model.Service(path)
            for i in range(100): service.submit(str(i),"asset",str(i))
            service.dispatch(lose_confirmation=True); service.dispatch(); service.drain()
            self.assertEqual(service.state["effects"],100)
            snapshot=Path(folder)/"snapshot.json"; service.snapshot(snapshot)
            service.submit("future","asset","later"); service.dispatch(); service.drain()
            self.assertEqual(service.state["effects"],101)
            restored=model.Service(snapshot)
            self.assertEqual(restored.submit("0","asset","0"),"duplicate")
            restored.dispatch(); restored.drain()
            self.assertEqual(restored.state["effects"],100)
            self.assertNotIn("future",restored.state["commands"])
    def test_failed_persistence_does_not_publish_candidate(self):
        with tempfile.TemporaryDirectory() as folder:
            service=model.Service(Path(folder)/"state")
            with unittest.mock.patch.object(Path,"write_text",side_effect=OSError("injected write failure")):
                with self.assertRaises(OSError): service.submit("x","k","a")
            self.assertEqual(service.state["commands"],{})


if __name__ == "__main__":
    unittest.main()
