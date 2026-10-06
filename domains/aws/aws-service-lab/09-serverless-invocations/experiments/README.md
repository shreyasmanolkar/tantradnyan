# Failure experiment — Why are warm globals neither durable storage nor reliable deduplication?

## Hypothesis

Busy slots cannot execute another invocation in this model. Recycling an environment discards its cache.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 09`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: With limit 1: first acquisition is cold, the next concurrent request is throttled, release/reacquire is warm, recycle/reacquire is cold with an empty cache.

Failure under investigation: Throttling, cold initialization and duplicate events are distinct. A warm seen-ID set disappears on environment replacement.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Pool semantics are selected assumptions, not exact Lambda scheduling, scaling quotas, billing or retry timing. Reserved and provisioned concurrency are different real configurations.

## Further experiment

Use λS to calculate average concurrency for 200 events/s taking 0.25 s each. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
