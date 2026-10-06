"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_cold_warm_throttle_and_recycle(self):
        trace=model.demo()
        self.assertEqual([trace[k] for k in ["first","second","third","fourth"]],["cold","throttled","warm","cold"])
        self.assertTrue(trace["warm_cache"])
        self.assertEqual(trace["cache_after_recycle"],{})
    def test_busy_pool_is_not_recycled(self):
        pool=model.Pool(2); a,_=pool.acquire(); b,_=pool.acquire()
        self.assertNotEqual(a,b)
        with self.assertRaises(ValueError): pool.recycle_idle()


if __name__ == "__main__":
    unittest.main()
