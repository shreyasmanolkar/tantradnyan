"""Disposable AWS networking/identity lab, not an authenticated production API."""
import json
import os
import signal
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

pool = None
if os.environ.get("DB_SECRET"):
    from psycopg_pool import ConnectionPool

    credential = json.loads(os.environ["DB_SECRET"])
    pool = ConnectionPool(
        kwargs={
            "host": os.environ["PGHOST"],
            "dbname": os.environ.get("PGDATABASE", "lab"),
            "user": credential["username"],
            "password": credential["password"],
            "sslmode": "verify-full",
            "sslrootcert": "/app/rds-ca.pem",
            "connect_timeout": 5,
            "options": "-c statement_timeout=3000",
        },
        min_size=0,
        max_size=2,
        max_waiting=8,
        timeout=4,
        open=False,
    )
    pool.open()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        started = time.monotonic()
        route = self.path.split("?", 1)[0]
        request_id = str(uuid.uuid4())
        status, body = 200, {"ok": True}
        if route == "/":
            body = {"service": "aws-field-guide", "version": os.getenv("APP_VERSION", "lab")}
        elif route == "/healthz":
            pass  # Liveness deliberately does not depend on a shared database.
        elif route == "/db":
            if pool is None:
                status, body = 503, {"error": "database_not_configured"}
            else:
                try:
                    with pool.connection() as connection:
                        row = connection.execute("SELECT value FROM public.lab_marker WHERE id = 1").fetchone()
                    body = {"ok": row is not None, "marker": row[0] if row else None}
                    if row is None:
                        status = 503
                except Exception as exc:
                    # Never print connection strings, secrets, SQL values, or exception messages.
                    print(json.dumps({"event": "db_error", "type": type(exc).__name__, "request_id": request_id}), flush=True)
                    status, body = 503, {"error": "database_unavailable"}
        else:
            status, body = 404, {"error": "not_found"}
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Request-ID", request_id)
        self.end_headers()
        self.wfile.write(payload)
        print(json.dumps({"event": "request", "request_id": request_id, "route": route if route in {"/", "/healthz", "/db"} else "unmatched", "status": status, "duration_ms": round((time.monotonic() - started) * 1000, 2)}), flush=True)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", int(os.getenv("PORT", "8080"))), Handler)
    signal.signal(signal.SIGTERM, lambda *_: threading.Thread(target=server.shutdown, daemon=True).start())
    signal.signal(signal.SIGINT, lambda *_: threading.Thread(target=server.shutdown, daemon=True).start())
    try:
        server.serve_forever()
    finally:
        server.server_close()
        if pool:
            pool.close()
