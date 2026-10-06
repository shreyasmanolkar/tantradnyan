"""One authoritative item and a deliberately delayed read replica."""
from copy import deepcopy
from hashlib import sha256


class Conflict(Exception):
    pass


class Table:
    def __init__(self):
        self.primary, self.replica = {}, {}

    def put(self, key, value, expected=None, absent=False):
        old = self.primary.get(key)
        if absent and old is not None:
            raise Conflict("item exists")
        if expected is not None and (old is None or old["version"] != expected):
            raise Conflict("version changed")
        self.primary[key] = {"value": deepcopy(value), "version": (old["version"] if old else 0) + 1}
        return deepcopy(self.primary[key])

    def get(self, key, consistent=False):
        return deepcopy((self.primary if consistent else self.replica).get(key))

    def replicate(self):
        self.replica = deepcopy(self.primary)


def partition(key, count):
    return int.from_bytes(sha256(key.encode()).digest()[:8], "big") % count


def demo():
    table = Table()
    first = table.put("order", "pending", absent=True)
    stale = table.get("order")
    table.put("order", "paid", expected=first["version"])
    try:
        table.put("order", "cancelled", expected=first["version"])
    except Conflict:
        conflict = True
    strong = table.get("order", consistent=True)
    table.replicate()
    return {"before_replication": stale, "strong": strong, "conflict": conflict,
            "after_replication": table.get("order"), "hot_key_partition": partition("celebrity", 4)}
