"""An accepted API request and a ready resource are different states."""
from copy import deepcopy


class ControlPlane:
    def __init__(self):
        self.requests, self.resources = {}, {}

    def create(self, token, specification):
        if token in self.requests:
            previous, resource_id = self.requests[token]
            if previous != specification:
                raise ValueError("request token reused with different intent")
            return resource_id
        resource_id = f"resource-{len(self.resources) + 1}"
        self.requests[token] = (deepcopy(specification), resource_id)
        self.resources[resource_id] = {"desired": deepcopy(specification), "status": "pending"}
        return resource_id

    def reconcile(self, resource_id, capacity_available=True):
        self.resources[resource_id]["status"] = "ready" if capacity_available else "failed"


def demo():
    api = ControlPlane()
    first = api.create("request-1", {"image": "digest-a"})
    retry = api.create("request-1", {"image": "digest-a"})
    accepted = api.resources[first]["status"]
    api.reconcile(first, capacity_available=False)
    failed = api.resources[first]["status"]
    api.reconcile(first)
    return {"accepted": accepted, "same_id_after_retry": first == retry,
            "resources": len(api.resources), "failed": failed, "recovered": api.resources[first]["status"]}
