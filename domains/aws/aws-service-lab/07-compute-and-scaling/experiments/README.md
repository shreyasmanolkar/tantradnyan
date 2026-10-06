# Failure experiment — How many workers are needed, and how much capacity survives an AZ failure?

## Hypothesis

Expected busy slots are λS. Provisioned slots are bounded ceil(λS/u); surviving capacity must still meet demand.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 07`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: 20 requests/s × 0.1 s/request = 2 occupied slots. At 50% target utilization, request 4 slots. Losing one of two 2-slot zones leaves 2 slots.

Failure under investigation: A configured maximum caps scaling. A second AZ helps only when its surviving capacity and dependencies are sufficient.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Steady occupancy approximation with homogeneous slots; no burst distribution, CPU scheduling, ALB fail-open or real autoscaling control loop.

## Further experiment

Double service time without changing arrival rate. Predict required slots and explain why a slow database can trigger compute scaling. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
