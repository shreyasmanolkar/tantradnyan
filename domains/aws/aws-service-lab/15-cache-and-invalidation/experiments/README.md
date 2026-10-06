# Failure experiment — Why can invalidation be followed immediately by a stale cache entry?

## Hypothesis

A guarded fill is accepted only if its observed version still matches authoritative state. TTL bounds this model stale entry lifetime after fill, not a general consistency guarantee.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 15`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Reader starts old-version fetch. Writer stores new version and invalidates. Reader fills old data afterward. Naive reads old; version-guarded reads new; the naive cache recovers on TTL expiry.

Failure under investigation: Delayed fill resurrects invalid data; stampede after expiry; incomplete cache key; cache outage coupling; stale authorization data.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Guard checks use one local authoritative version; distributed atomic guard/invalidation requires additional machinery. No Valkey/Redis protocol, eviction or persistence behavior.

## Further experiment

Draw the interleaving and mark exactly why invalidating on every write did not prevent stale data. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
