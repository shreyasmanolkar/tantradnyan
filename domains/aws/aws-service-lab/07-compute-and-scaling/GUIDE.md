# Walkthrough — How many workers are needed, and how much capacity survives an AZ failure?

## State and transitions

Arrival rate in requests/s; service occupancy in s/request; target utilization; min/max; healthy slots by zone.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Expected busy slots are λS. Provisioned slots are bounded ceil(λS/u); surviving capacity must still meet demand.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: 20 requests/s × 0.1 s/request = 2 occupied slots. At 50% target utilization, request 4 slots. Losing one of two 2-slot zones leaves 2 slots.

## Deliberate failure

A configured maximum caps scaling. A second AZ helps only when its surviving capacity and dependencies are sufficient.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Double service time without changing arrival rate. Predict required slots and explain why a slow database can trigger compute scaling.
2. Compute backlog growth when arrival rate exceeds surviving service rate.
3. Add provisioning delay and a cooldown; plot logical backlog rather than assuming capacity appears instantly.
4. In original lab 15, identify metric, target, min, max, scaling events and actual healthy capacity. Explain whether your workload is CPU-bound or blocked on another resource.

## Transfer to AWS

Original labs 15–16. Model numbers are inputs, not measured AWS throughput.

Read [the service contract](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Steady occupancy approximation with homogeneous slots; no burst distribution, CPU scheduling, ALB fail-open or real autoscaling control loop.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
