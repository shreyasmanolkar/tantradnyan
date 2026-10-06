"""Finite metric windows, explicit missing-data policy, and error budget."""
from math import ceil


def alarm(samples, threshold, periods=3, required=2, missing="missing"):
    if not 1 <= required <= periods or missing not in {"missing", "breaching", "not-breaching"}:
        raise ValueError("invalid alarm policy")
    window = [None] * max(0, periods - len(samples)) + list(samples[-periods:])
    if None in window and missing == "missing":
        return "INSUFFICIENT_DATA"
    breached = sum(missing == "breaching" if sample is None else sample >= threshold for sample in window)
    return "ALARM" if breached >= required else "OK"


def percentile(samples, p):
    if not samples or not 0 < p <= 1:
        raise ValueError("nonempty samples and 0 < p <= 1 required")
    return sorted(samples)[ceil(p * len(samples)) - 1]


def budget(total_requests, failed_requests, objective):
    if total_requests <= 0 or not 0 <= failed_requests <= total_requests or not 0 < objective < 1:
        raise ValueError("invalid SLO inputs")
    allowed = total_requests * (1 - objective)
    return {"availability": 1 - failed_requests / total_requests,
            "allowed_failures": allowed, "burn": failed_requests / allowed}


def demo():
    latency = [10] * 99 + [1000]
    return {"mean_ms": sum(latency) / len(latency), "p99_ms": percentile(latency, .99),
            "p100_ms": percentile(latency, 1), "alarm": alarm([90, 20, 90], 80),
            "missing": alarm([90], 80), "budget": budget(1000, 5, .99)}
