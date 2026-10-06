"""Logical visibility leases and fresh receipt handles; not SQS emulation."""
from copy import deepcopy


class Queue:
    def __init__(self, visibility=5, maximum_receives=3):
        self.visibility, self.maximum_receives = visibility, maximum_receives
        self.messages, self.dead_letters, self.receipt_number = [], [], 0

    def send(self, identifier, body):
        self.messages.append({"id": identifier, "body": deepcopy(body), "visible_at": 0,
                              "receives": 0, "receipt": None})

    def receive(self, now):
        for message in list(self.messages):
            if message["visible_at"] > now:
                continue
            if message["receives"] >= self.maximum_receives:
                self.messages.remove(message)
                self.dead_letters.append(deepcopy(message))
                continue
            self.receipt_number += 1
            message.update(receives=message["receives"] + 1,
                           visible_at=now + self.visibility, receipt=f"receipt-{self.receipt_number}")
            return deepcopy(message)
        return None

    def acknowledge(self, identifier, receipt):
        for message in self.messages:
            if message["id"] == identifier and message["receipt"] == receipt:
                self.messages.remove(message)
                return True
        return False

    def change_visibility(self, identifier, receipt, now, seconds):
        for message in self.messages:
            if message["id"] == identifier and message["receipt"] == receipt:
                message["visible_at"] = now + seconds
                return True
        return False


def demo():
    queue = Queue()
    queue.send("job-1", {"amount": 7})
    first = queue.receive(0)
    hidden = queue.receive(4)
    retry = queue.receive(5)
    stale = queue.acknowledge("job-1", first["receipt"])
    fresh = queue.acknowledge("job-1", retry["receipt"])
    queue.send("poison", {"invalid": True})
    for now in [10, 15, 20, 25]:
        queue.receive(now)
    return {"hidden": hidden, "receives": retry["receives"], "stale_ack": stale, "fresh_ack": fresh,
            "dead_letters": [m["id"] for m in queue.dead_letters]}
