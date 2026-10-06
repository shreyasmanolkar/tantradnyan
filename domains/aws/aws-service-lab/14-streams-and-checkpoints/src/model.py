"""Per-shard sequence and per-consumer checkpoints; no global stream order."""
from hashlib import sha256


class Stream:
    def __init__(self, shards=2):
        self.shards = [[] for _ in range(shards)]
        self.checkpoints = {}

    def append(self, key, value):
        shard = int.from_bytes(sha256(key.encode()).digest()[:8], "big") % len(self.shards)
        sequence = len(self.shards[shard])
        self.shards[shard].append({"sequence": sequence, "key": key, "value": value})
        return shard, sequence

    def read(self, consumer, shard, limit=10):
        offset = self.checkpoints.get((consumer, shard), 0)
        return [dict(record) for record in self.shards[shard][offset:offset + limit]]

    def checkpoint(self, consumer, shard, next_offset):
        old = self.checkpoints.get((consumer, shard), 0)
        if not old <= next_offset <= len(self.shards[shard]):
            raise ValueError("checkpoint outside monotone stream prefix")
        self.checkpoints[(consumer, shard)] = next_offset


def demo():
    stream = Stream()
    shard, _ = stream.append("customer-1", "a")
    stream.append("customer-1", "b")
    first = stream.read("worker", shard, 1)
    repeated = stream.read("worker", shard, 1)
    stream.checkpoint("worker", shard, first[-1]["sequence"] + 1)
    return {"first": first, "replayed_before_checkpoint": repeated,
            "after_checkpoint": stream.read("worker", shard), "independent_consumer": stream.read("audit", shard)}
