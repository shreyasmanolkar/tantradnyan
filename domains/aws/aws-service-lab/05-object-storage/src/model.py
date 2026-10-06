"""Whole-object versions, opaque comparison tokens, and delete markers."""
from hashlib import sha256


class PreconditionFailed(Exception):
    pass


class Bucket:
    def __init__(self):
        self.versions, self.next_version = {}, 0

    def current(self, key):
        versions = self.versions.get(key, [])
        return versions[-1] if versions and versions[-1]["body"] is not None else None

    def put(self, key, body, absent=False, match=None):
        current = self.current(key)
        if absent and current is not None:
            raise PreconditionFailed("already exists")
        if match is not None and (current is None or current["token"] != match):
            raise PreconditionFailed("stale token")
        self.next_version += 1
        version = {"version": self.next_version, "body": body,
                   "token": sha256(body.encode()).hexdigest()}
        self.versions.setdefault(key, []).append(version)
        return dict(version)

    def delete(self, key):
        self.next_version += 1
        self.versions.setdefault(key, []).append({"version": self.next_version, "body": None, "token": None})

    def get_version(self, key, version):
        return next(v["body"] for v in self.versions[key] if v["version"] == version)


def demo():
    bucket = Bucket()
    old = bucket.put("report", "v1", absent=True)
    bucket.put("report", "v2", match=old["token"])
    try:
        bucket.put("report", "stale", match=old["token"])
    except PreconditionFailed:
        stale_rejected = True
    bucket.delete("report")
    return {"stale_rejected": stale_rejected, "current_missing": bucket.current("report") is None,
            "old_version": bucket.get_version("report", old["version"]), "stored_versions": len(bucket.versions["report"])}
