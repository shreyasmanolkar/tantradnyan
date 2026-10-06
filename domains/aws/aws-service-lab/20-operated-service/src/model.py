"""A file-backed asset workflow: transactional outbox and idempotent worker.

One JSON file is the local transaction boundary. AWS services do not share it.
Ordinary restart recovery is modeled; power-loss durability is not established.
"""
from copy import deepcopy
from hashlib import sha256
import json
from pathlib import Path
import tempfile


class SimulatedCrash(Exception):
    pass


class Service:
    def __init__(self, path):
        self.path = Path(path)
        self.state = json.loads(self.path.read_text()) if self.path.exists() else {
            "commands": {}, "outbox": {}, "queue": [], "results": {}, "effects": 0}

    def commit(self, candidate):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".pending")
        temporary.write_text(json.dumps(candidate, sort_keys=True))
        temporary.replace(self.path)
        self.state = candidate

    def submit(self, identifier, key, body, allowed=True):
        if not allowed:
            raise PermissionError("application action denied")
        command = {"key": key, "body": body, "digest": sha256(body.encode()).hexdigest()}
        if identifier in self.state["commands"]:
            if self.state["commands"][identifier] != command:
                raise ValueError("id reused with a different command")
            return "duplicate"
        candidate = deepcopy(self.state)
        candidate["commands"][identifier] = command
        candidate["outbox"][identifier] = False
        self.commit(candidate)
        return "accepted"

    def dispatch(self, lose_confirmation=False):
        candidate = deepcopy(self.state)
        for identifier, published in candidate["outbox"].items():
            if not published:
                candidate["queue"].append(identifier)
                if not lose_confirmation:
                    candidate["outbox"][identifier] = True
        self.commit(candidate)

    def work(self, crash_after_commit=False):
        if not self.state["queue"]:
            return "idle"
        identifier = self.state["queue"][0]
        candidate = deepcopy(self.state)
        duplicate = identifier in candidate["results"]
        if not duplicate:
            command = candidate["commands"][identifier]
            candidate["results"][identifier] = {"key": command["key"],
                                                "output": command["body"].upper(), "input_digest": command["digest"]}
            candidate["effects"] += 1
        self.commit(candidate)  # effect + receipt share this transaction boundary
        if crash_after_commit:
            raise SimulatedCrash("worker died after commit, before acknowledgement")
        candidate = deepcopy(self.state)
        candidate["queue"].pop(0)
        self.commit(candidate)
        return "duplicate" if duplicate else "processed"

    def drain(self):
        attempts = len(self.state["queue"])
        for _ in range(attempts):
            self.work()
        return attempts

    def snapshot(self, path):
        Path(path).write_text(json.dumps(self.state, sort_keys=True))


def demo():
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "state.json"
        service = Service(path)
        service.submit("op-1", "asset-a", "hello")
        retry = service.submit("op-1", "asset-a", "hello")
        service.dispatch(lose_confirmation=True)
        service = Service(path)  # publisher restart; its unconfirmed send will repeat
        service.dispatch()
        queued = len(service.state["queue"])
        try:
            service.work(crash_after_commit=True)
        except SimulatedCrash:
            pass
        service = Service(path)
        replay = service.work()
        service.drain()
        return {"submit_retry": retry, "queued_after_lost_confirmation": queued, "worker_replay": replay,
                "effects": service.state["effects"], "queue_empty": not service.state["queue"],
                "result": service.state["results"]["op-1"]}
