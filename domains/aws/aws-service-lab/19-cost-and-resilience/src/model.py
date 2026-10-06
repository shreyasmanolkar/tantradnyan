"""A quoted-unit cost sum and failure-domain dependency paths."""
from decimal import Decimal


def cost(usage, quoted_rates):
    if set(usage) - set(quoted_rates):
        raise ValueError("missing quoted rate")
    if any(Decimal(str(v)) < 0 for v in list(usage.values()) + list(quoted_rates.values())):
        raise ValueError("negative quantity or rate")
    return sum((Decimal(str(quantity)) * Decimal(str(quoted_rates[unit]))
                for unit, quantity in usage.items()), Decimal(0))


def available(paths, failed):
    return any(not (set(path) & set(failed)) for path in paths)


def recovery(snapshot_ids, accepted_ids):
    missing = sorted(set(accepted_ids) - set(snapshot_ids))
    return {"missing_operations": missing, "lost_count": len(missing)}


def demo():
    paths = [["app-a", "shared-nat-a", "db-a"], ["app-b", "shared-nat-a", "db-a"]]
    return {"illustrative_units_cost": str(cost({"instance_hours": 2, "GB": 3}, {"instance_hours": "0.10", "GB": "0.02"})),
            "app_a_failure": available(paths, {"app-a"}), "nat_failure": available(paths, {"shared-nat-a"}),
            "database_failure": available(paths, {"db-a"}), "restore_gap": recovery(["op-1"], ["op-1", "op-2"])}
