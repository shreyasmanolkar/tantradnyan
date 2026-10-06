"""A logical-time DNS cache; no DNS packets or cryptographic TLS."""
class Resolver:
    def __init__(self, authoritative):
        self.authoritative, self.cache = dict(authoritative), {}

    def resolve(self, host, now, ttl=30):
        if host not in self.cache or self.cache[host][1] <= now:
            self.cache[host] = (self.authoritative[host], now + ttl)
        return self.cache[host][0]


def request(host, certificate_names, endpoint_healthy):
    if host not in certificate_names:
        return "certificate-name-mismatch"
    return "200" if endpoint_healthy else "503"


def demo():
    dns = Resolver({"api.example.test": "old-alb"})
    before = dns.resolve("api.example.test", 0)
    dns.authoritative["api.example.test"] = "new-alb"
    cached = dns.resolve("api.example.test", 29)
    fresh = dns.resolve("api.example.test", 30)
    return {"before": before, "cached": cached, "fresh": fresh,
            "bad_tls": request("api.example.test", {"other.example.test"}, True),
            "unhealthy": request("api.example.test", {"api.example.test"}, False)}
