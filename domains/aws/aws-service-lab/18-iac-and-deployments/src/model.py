"""Immutable plan tied to an observed base; simplified atomic application."""
from copy import deepcopy
from hashlib import sha256
import json


def fingerprint(resources):
    return sha256(json.dumps(resources, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def plan(actual, desired, replacement_properties=("type", "primary_key")):
    changes = []
    for name in sorted(actual.keys() | desired.keys()):
        if name not in actual:
            kind = "create"
        elif name not in desired:
            kind = "delete"
        elif actual[name] == desired[name]:
            continue
        else:
            kind = "replace" if any(actual[name].get(k) != desired[name].get(k) for k in replacement_properties) else "update"
        changes.append({"resource": name, "kind": kind})
    return {"base": fingerprint(actual), "desired": deepcopy(desired), "changes": changes}


def apply(reviewed, actual):
    if reviewed["base"] != fingerprint(actual):
        raise ValueError("actual state changed after planning")
    return deepcopy(reviewed["desired"])


def demo():
    actual = {"table": {"type": "database", "primary_key": "id"}, "service": {"type": "compute", "image": "a"}}
    desired = {"table": {"type": "database", "primary_key": "tenant"}, "service": {"type": "compute", "image": "b"}}
    reviewed = plan(actual, desired)
    drifted = deepcopy(actual)
    drifted["service"]["image"] = "manual-edit"
    try:
        apply(reviewed, drifted)
    except ValueError:
        rejected = True
    return {"changes": reviewed["changes"], "drift_rejected": rejected, "applied": apply(reviewed, actual)}
