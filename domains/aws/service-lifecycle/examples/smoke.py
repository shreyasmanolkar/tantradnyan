"""Local-only API acceptance check; no AWS calls or application secrets."""
import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

with socket.socket() as reservation:
    reservation.bind(("127.0.0.1", 0))
    port = reservation.getsockname()[1]
http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
process = subprocess.Popen(
    [sys.executable, str(Path(__file__).with_name("api.py"))],
    env={"PATH": os.environ.get("PATH", ""), "PORT": str(port), "PYTHONDONTWRITEBYTECODE": "1"},
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
)
try:
    for _ in range(100):
        try:
            with http.open(f"http://127.0.0.1:{port}/healthz", timeout=1) as response:
                assert response.status == 200
            break
        except (OSError, urllib.error.URLError):
            if process.poll() is not None:
                raise RuntimeError("API exited before startup")
            time.sleep(0.05)
    else:
        raise TimeoutError("API startup")
    for path, expected in [("/", 200), ("/healthz?secret=never-log-me", 200), ("/db", 503), ("/missing", 404)]:
        try:
            response = http.open(f"http://127.0.0.1:{port}{path}", timeout=2)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            assert response.status == expected, (path, response.status)
            assert response.headers["Cache-Control"] == "no-store"
            assert response.headers["X-Request-ID"]
            json.loads(response.read())
    process.send_signal(signal.SIGTERM)
    logs, errors = process.communicate(timeout=5)
    assert process.returncode == 0, errors
    assert "never-log-me" not in logs + errors
    records = [json.loads(line) for line in logs.splitlines()]
    assert all("request_id" in record for record in records)
    print("PASS: HTTP status, JSON, request IDs, no-store, log redaction, SIGTERM shutdown")
finally:
    if process.poll() is None:
        process.kill()
        process.communicate()
