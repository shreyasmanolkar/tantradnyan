"""Run independent, bounded local labs. Never calls AWS or opens a socket."""
import argparse
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["demo", "test", "experiments", "all"])
    parser.add_argument("--stage", help="Two-digit stage, for example 12")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    stages = sorted(p for p in root.iterdir() if p.is_dir() and p.name[:2].isdigit())
    if args.stage:
        stages = [p for p in stages if p.name.startswith(args.stage.zfill(2) + "-")]
        if not stages:
            parser.error("unknown stage")
    commands = ["demo", "experiments", "test"] if args.command == "all" else [args.command]
    for command in commands:
        for stage in stages:
            print(f"{command}: {stage.name}", flush=True)
            target = {"demo": "src/demo.py", "test": "tests/test_model.py", "experiments": "experiments/run.py"}[command]
            result = subprocess.run([sys.executable, "-B", str(stage / target)], cwd=stage, timeout=30)
            if result.returncode:
                return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
