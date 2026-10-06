"""Secret generations and an access-controlled opaque token, NOT encryption."""
class Secret:
    def __init__(self, value):
        self.value, self.generation = value, 1

    def capture(self):
        return self.value, self.generation

    def rotate(self, value):
        self.value, self.generation = value, self.generation + 1


class EnvelopeModel:
    def __init__(self):
        self.records, self.key_enabled = {}, True

    def seal(self, body, context):
        token = f"opaque-{len(self.records) + 1}"
        self.records[token] = (body, dict(context))
        return token

    def open(self, token, context, principal_allowed):
        if not self.key_enabled or not principal_allowed or self.records[token][1] != context:
            raise PermissionError("principal, key state, or context rejected")
        return self.records[token][0]


def demo():
    secret = Secret("synthetic-generation-1")
    task = secret.capture()
    secret.rotate("synthetic-generation-2")
    envelope = EnvelopeModel()
    token = envelope.seal("synthetic data", {"tenant": "a"})
    try:
        envelope.open(token, {"tenant": "b"}, True)
    except PermissionError:
        wrong_context = True
    return {"task_generation": task[1], "current_generation": secret.generation,
            "task_refresh_required": task != secret.capture(), "wrong_context_rejected": wrong_context,
            "correct_context": envelope.open(token, {"tenant": "a"}, True)}
