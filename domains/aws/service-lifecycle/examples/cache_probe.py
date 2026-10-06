"""TLS-only disposable cache connectivity probe. Network-isolated lab, no RBAC."""
import os
import socket
import ssl

host = os.environ["CACHE_HOST"]
context = ssl.create_default_context()
with socket.create_connection((host, int(os.getenv("CACHE_PORT", "6379"))), timeout=5) as raw:
    with context.wrap_socket(raw, server_hostname=host) as client:
        client.sendall(b"*1\r\n$4\r\nPING\r\n")
        response = client.recv(128)
        if response != b"+PONG\r\n":
            raise RuntimeError("Unexpected cache response")
print('{"event":"cache_tls_ping","ok":true}')
