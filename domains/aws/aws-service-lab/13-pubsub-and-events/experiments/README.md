# Failure experiment — How do independent subscribers differ from workers competing for one job?

## Hypothesis

Each matching subscriber gets its own copy. Consuming one inbox does not acknowledge another subscriber.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 13`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: OrderPaid reaches billing; audit is unavailable and receives a targeted retry later; shipping does not match. Billing consumes its copy while audit still retains one.

Failure under investigation: Partial fanout, missing publish, incompatible schema and one slow subscriber. Broadcasting again can duplicate already successful subscribers.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Equality filters only; no SNS/EventBridge delivery implementation, IAM policy, archive, replay, retries or orchestration service. Partial failures are returned for the caller to handle.

## Further experiment

Send ten events to two consumers of one queue, then to two independent subscriber queues; compare intended total effects. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
