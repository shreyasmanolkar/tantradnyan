"""Concurrency slots and reusable environments; no Lambda runtime emulation."""
class Pool:
    def __init__(self, limit):
        self.limit, self.environments, self.busy = limit, {}, set()

    def acquire(self):
        for identifier in self.environments:
            if identifier not in self.busy:
                self.busy.add(identifier)
                return identifier, "warm"
        if len(self.environments) >= self.limit:
            return None, "throttled"
        identifier = len(self.environments)
        self.environments[identifier] = {}
        self.busy.add(identifier)
        return identifier, "cold"

    def release(self, identifier):
        self.busy.remove(identifier)

    def recycle_idle(self):
        if self.busy:
            raise ValueError("only recycle an idle pool in this model")
        self.environments.clear()


def demo():
    pool = Pool(1)
    identifier, first = pool.acquire()
    pool.environments[identifier]["seen_job"] = True
    _, second = pool.acquire()
    pool.release(identifier)
    identifier, third = pool.acquire()
    cached = pool.environments[identifier]["seen_job"]
    pool.release(identifier)
    pool.recycle_idle()
    identifier, fourth = pool.acquire()
    return {"first": first, "second": second, "third": third, "fourth": fourth,
            "warm_cache": cached, "cache_after_recycle": pool.environments[identifier]}
