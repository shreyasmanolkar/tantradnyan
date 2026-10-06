"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_invalidation_race(self):
        self.assertEqual(model.demo(),{"naive_stale":"old","guarded_fresh":"new","ttl_recovers":"new"})
    def test_guard_rejects_stale_fill(self):
        cache=model.CacheAside(); read=cache.begin_fill("item"); cache.write("item","new")
        self.assertFalse(cache.finish_fill("item",read,0))
        self.assertEqual(cache.read("item",0),"new")


if __name__ == "__main__":
    unittest.main()
