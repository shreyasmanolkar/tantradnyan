# Failure experiment — Why can a service have free CPU, pending tasks and an unsafe rollout?

## Hypothesis

Every placement respects both resource dimensions. A rollout gate requires healthy tasks on the intended digest.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 08`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: An 8-CPU/1024-memory host fits two 1-CPU/512-memory tasks; the third stays pending despite free CPU. An unhealthy new digest cannot satisfy the cutover gate.

Failure under investigation: Memory, networking, capacity, image pull, execution-role permissions, startup and health checks can fail independently.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Bin packing and cutover predicate only; no ECS/Fargate/EKS scheduler, AZ placement, task startup or real load balancer.

## Further experiment

Create a placement example where first-fit fragmentation blocks a task although total free CPU/memory would fit it with rearrangement. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
