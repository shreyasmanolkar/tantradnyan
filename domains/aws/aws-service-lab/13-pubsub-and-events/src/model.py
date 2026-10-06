"""Independent subscriber queues and a bounded equality event filter."""
from copy import deepcopy


def matches(event, pattern):
    return all(event.get(key) in allowed for key, allowed in pattern.items())


def publish(event, subscriptions, inboxes, unavailable=()):
    delivered, failed = [], []
    for target, pattern in subscriptions.items():
        if not matches(event, pattern):
            continue
        if target in unavailable:
            failed.append(target)
        else:
            inboxes.setdefault(target, []).append(deepcopy(event))
            delivered.append(target)
    return {"delivered": delivered, "failed": failed}


def demo():
    subscriptions = {"billing": {"type": ["OrderPaid"]}, "audit": {"source": ["orders"]},
                     "shipping": {"type": ["OrderCreated"]}}
    event = {"id": "event-1", "source": "orders", "type": "OrderPaid"}
    inboxes = {}
    partial = publish(event, subscriptions, inboxes, unavailable={"audit"})
    retry = publish(event, {"audit": subscriptions["audit"]}, inboxes)
    inboxes["billing"].pop(0)
    return {"partial": partial, "retry": retry, "billing_consumed": len(inboxes["billing"]),
            "audit_still_has_copy": len(inboxes["audit"]), "shipping_matched": "shipping" in inboxes}
