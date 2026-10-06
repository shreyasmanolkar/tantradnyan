"""Bounded identity-policy model; deliberately not a full IAM evaluator."""
from fnmatch import fnmatchcase


def matches(statement, action, resource, context):
    return (any(fnmatchcase(action, a) for a in statement["actions"])
            and any(fnmatchcase(resource, r) for r in statement["resources"])
            and all(context.get(k) == v for k, v in statement.get("equals", {}).items()))


def decision(statements, action, resource, context=None, boundary=None):
    context = context or {}
    applicable = [s for s in statements if matches(s, action, resource, context)]
    if any(s["effect"] == "deny" for s in applicable):
        return "explicit-deny"
    if not any(s["effect"] == "allow" for s in applicable):
        return "implicit-deny"
    if boundary is not None and decision(boundary, action, resource, context) != "allow":
        return "boundary-deny"
    return "allow"


def session_valid(now, expires_at):
    return now < expires_at


def demo():
    policy = [{"effect": "allow", "actions": ["s3:GetObject"],
               "resources": ["arn:aws:s3:::lab/invoices/*"], "equals": {"env": "dev"}},
              {"effect": "deny", "actions": ["*"], "resources": ["*/private/*"]}]
    return {"allowed": decision(policy, "s3:GetObject", "arn:aws:s3:::lab/invoices/a", {"env": "dev"}),
            "wrong_prefix": decision(policy, "s3:GetObject", "arn:aws:s3:::lab/other/a", {"env": "dev"}),
            "explicit": decision(policy, "s3:GetObject", "arn:aws:s3:::lab/invoices/private/a", {"env": "dev"}),
            "expired": not session_valid(60, 60)}
