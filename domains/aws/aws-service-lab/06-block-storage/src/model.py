"""Volatile writes versus persisted blocks; not a hardware crash simulator."""
from copy import deepcopy


class Volume:
    def __init__(self):
        self.durable, self.pending = {}, {}

    def write(self, block, body):
        self.pending[block] = body

    def flush(self):
        self.durable.update(self.pending)
        self.pending.clear()

    def crash(self):
        self.pending.clear()

    def snapshot(self):
        return deepcopy(self.durable)


def demo():
    disk = Volume()
    disk.write(0, "committed-page")
    disk.flush()
    snapshot = disk.snapshot()
    disk.write(1, "buffered-page")
    disk.crash()
    disk.write(0, "later-page")
    disk.flush()
    return {"buffered_write_lost": 1 not in disk.durable,
            "snapshot": snapshot, "live": disk.durable, "snapshot_unchanged": snapshot[0] == "committed-page"}
