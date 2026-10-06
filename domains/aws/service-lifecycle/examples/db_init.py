"""Run once as an ECS task. Administrative secret is never given to the API."""
import json
import os
import psycopg
from psycopg import sql

admin = json.loads(os.environ["MASTER_SECRET"])
app = json.loads(os.environ["DB_SECRET"])
# This script only manages this disposable lab identity/schema.
assert app["username"] == "lab_reader"
with psycopg.connect(
    host=os.environ["PGHOST"], dbname="lab", user=admin["username"],
    password=admin["password"], sslmode="verify-full", sslrootcert="/app/rds-ca.pem",
    connect_timeout=5, options="-c statement_timeout=10000 -c lock_timeout=3000",
) as connection:
    exists = connection.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (app["username"],)).fetchone()
    if not exists:
        connection.execute(sql.SQL("CREATE ROLE {} LOGIN").format(sql.Identifier(app["username"])))
    connection.execute(sql.SQL("ALTER ROLE {} PASSWORD {}").format(sql.Identifier(app["username"]), sql.Literal(app["password"])))
    connection.execute("CREATE TABLE IF NOT EXISTS public.lab_marker (id integer PRIMARY KEY, value text NOT NULL)")
    connection.execute("INSERT INTO public.lab_marker (id, value) VALUES (1, 'restore-me') ON CONFLICT (id) DO NOTHING")
    connection.execute("GRANT CONNECT ON DATABASE lab TO lab_reader")
    connection.execute("GRANT USAGE ON SCHEMA public TO lab_reader")
    connection.execute("GRANT SELECT ON public.lab_marker TO lab_reader")
print(json.dumps({"event": "database_initialized", "app_role": "lab_reader"}))
