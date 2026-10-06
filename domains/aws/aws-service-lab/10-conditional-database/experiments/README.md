# Failure experiment — Why does a strongly consistent read still need a conditional write?

## Hypothesis

Compare the expected version inside the write. Only one competing writer from that version can succeed.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 10`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Create pending version 1; an eventual read can still see missing. Writer A sets paid at version 2. Writer B expecting version 1 is rejected. Explicit replication makes the eventual reader catch up.

Failure under investigation: Read freshness does not lock an item. Adding partitions does not distribute traffic for one identical hot key.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

One in-memory primary, one manually advanced replica and a fixed SHA-256 partition hash. No DynamoDB physical partitioning, transactions, adaptive capacity, TTL service or global table implementation.

## Further experiment

Draw two strongly consistent reads of version 1 followed by blind writes. Show that freshness alone permits a lost update. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
