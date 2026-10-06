# Failure experiment — Which writes belong in a snapshot, and who gives bytes filesystem meaning?

## Hypothesis

The snapshot is an independent cut of durable blocks. Unflushed writes are absent from this model after a crash.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 06`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Flush block 0; take a snapshot; buffer block 1 and crash; overwrite/flush block 0. Live block 0 changes, snapshot block 0 stays old, and block 1 is absent.

Failure under investigation: A snapshot can omit buffered application state. Taking bytes from a busy database does not automatically establish an application-consistent backup.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

No device, filesystem, mount, fsync guarantee, partial sector writes or real EBS snapshot is simulated. No privileged operation occurs.

## Further experiment

Move snapshot() before flush() and predict its contents. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
