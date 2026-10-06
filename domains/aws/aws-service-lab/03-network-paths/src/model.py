"""Longest-prefix routes and first-match ACLs, with explicit return paths."""
from ipaddress import ip_address, ip_network


def route(destination, routes):
    candidates = [(ip_network(cidr), target) for cidr, target in routes
                  if ip_address(destination) in ip_network(cidr)]
    return max(candidates, key=lambda x: x[0].prefixlen)[1] if candidates else None


def acl(destination, port, rules):
    for number, cidr, low, high, allow in sorted(rules):
        if ip_address(destination) in ip_network(cidr) and low <= port <= high:
            return allow
    return False


def connection(routes, destination, destination_port, inbound, outbound,
               source="198.51.100.10", source_port=49152, sg_allows=True, listener=True):
    if route(destination, routes) is None:
        return "no-route"
    if not acl(source, destination_port, inbound):
        return "inbound-acl"
    if not sg_allows:
        return "security-group"
    if not listener:
        return "no-listener"
    if not acl(source, source_port, outbound):
        return "return-acl"
    return "connected"


def demo():
    routes = [("0.0.0.0/0", "nat"), ("10.0.0.0/16", "local")]
    inbound = [(100, "198.51.100.0/24", 443, 443, True)]
    broken = [(100, "0.0.0.0/0", 443, 443, True)]
    fixed = [(100, "198.51.100.0/24", 1024, 65535, True)]
    return {"specific_route": route("10.0.1.8", routes),
            "broken": connection(routes, "10.0.1.8", 443, inbound, broken),
            "fixed": connection(routes, "10.0.1.8", 443, inbound, fixed)}
