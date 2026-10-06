"""Observable properties and counterexamples for this bounded model."""
import sys
import tempfile
import unittest
import unittest.mock
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import model


class ModelTests(unittest.TestCase):

    def test_occupancy_and_zone_failure(self):
        self.assertEqual(model.demo(), {"required":4,"capped":10,"normal_slots":4,"one_az_slots":2})
    def test_zero_load_bounds_and_bad_units(self):
        self.assertEqual(model.desired(0,1,.5),1)
        self.assertEqual(model.desired(0,1,.5,minimum=0),0)
        with self.assertRaises(ValueError): model.desired(1,1,0)


if __name__ == "__main__":
    unittest.main()
