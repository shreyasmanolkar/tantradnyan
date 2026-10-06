# Failure experiment — Why can successful processing repeat after a consumer restarts?

## Hypothesis

Order exists within each model shard. Checkpoints are monotone processed-prefix claims; another consumer has its own position.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 14`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Append a,b under one key. Read a without checkpoint, read a again, checkpoint next offset 1, then read b. Audit still reads a,b.

Failure under investigation: Effect before checkpoint causes replay; checkpoint before effect causes loss. Different shards do not have one global order.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Fixed shard count, toy SHA-256 hash, zero-based integer offsets and no retention/resharding. These are not Kinesis hash ranges, sequence values or exactly-once delivery.

## Further experiment

Swap effect and checkpoint order, then inject a crash at the boundary in each version. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
