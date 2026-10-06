"""A delayed cache fill can resurrect stale data after invalidation."""
class CacheAside:
    def __init__(self):
        self.database, self.cache = {"item": ("old", 1)}, {}

    def begin_fill(self, key):
        return self.database[key]

    def write(self, key, value):
        self.database[key] = (value, self.database[key][1] + 1)
        self.cache.pop(key, None)

    def finish_fill(self, key, observed, now, guarded=True, ttl=10):
        if guarded and self.database[key][1] != observed[1]:
            return False
        self.cache[key] = (observed[0], now + ttl)
        return True

    def read(self, key, now):
        cached = self.cache.get(key)
        if cached and now < cached[1]:
            return cached[0]
        self.cache.pop(key, None)
        return self.database[key][0]


def demo():
    naive, guarded = CacheAside(), CacheAside()
    for store in [naive, guarded]:
        observed = store.begin_fill("item")
        store.write("item", "new")
        store.finish_fill("item", observed, 0, guarded=store is guarded)
    return {"naive_stale": naive.read("item", 1), "guarded_fresh": guarded.read("item", 1),
            "ttl_recovers": naive.read("item", 10)}
