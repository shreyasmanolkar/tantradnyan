"""Deterministic failure fixture; times in models are logical, not measured."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from model import demo

if __name__ == "__main__":
    print(json.dumps({"stage": Path(__file__).resolve().parents[1].name,
                      "fixture": "worked-example-and-deliberate-failure", "observation": demo()},
                     indent=2, sort_keys=True))
