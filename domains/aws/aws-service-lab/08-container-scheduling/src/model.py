"""First-fit CPU/memory placement; health and image identity are separate."""
from copy import deepcopy


def place(tasks, hosts):
    capacity, assignments, pending = deepcopy(hosts), [], []
    for task in tasks:
        for host in capacity:
            if host["cpu"] >= task["cpu"] and host["memory"] >= task["memory"]:
                host["cpu"] -= task["cpu"]
                host["memory"] -= task["memory"]
                assignments.append((task["id"], host["id"]))
                break
        else:
            pending.append(task["id"])
    return assignments, pending


def ready_for_cutover(tasks, digest, minimum):
    return sum(t["digest"] == digest and t["healthy"] for t in tasks) >= minimum


def demo():
    assignments, pending = place([{"id": f"task-{i}", "cpu": 1, "memory": 512} for i in range(3)],
                                 [{"id": "host", "cpu": 8, "memory": 1024}])
    tasks = [{"digest": "old", "healthy": True}, {"digest": "new", "healthy": False}]
    before = ready_for_cutover(tasks, "new", 1)
    tasks[1]["healthy"] = True
    return {"placed": assignments, "pending": pending, "cutover_before_health": before,
            "cutover_after_health": ready_for_cutover(tasks, "new", 1)}
