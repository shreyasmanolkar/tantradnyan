"""Capacity from occupancy; intentionally no cloud scaling controller."""
from math import ceil


def desired(arrivals_per_second, service_seconds, target_utilization, minimum=1, maximum=10):
    if arrivals_per_second < 0 or service_seconds < 0 or not 0 < target_utilization <= 1 or not 0 <= minimum <= maximum:
        raise ValueError("invalid units or bounds")
    return max(minimum, min(maximum, ceil(arrivals_per_second * service_seconds / target_utilization)))


def surviving_capacity(instances, failed_zones):
    return sum(i["slots"] for i in instances if i["zone"] not in failed_zones and i["healthy"])


def demo():
    instances = [{"zone": "a", "healthy": True, "slots": 2}, {"zone": "b", "healthy": True, "slots": 2}]
    return {"required": desired(20, 0.1, 0.5), "capped": desired(200, 1, 0.5),
            "normal_slots": surviving_capacity(instances, set()), "one_az_slots": surviving_capacity(instances, {"a"})}
