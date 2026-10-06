# Failure experiment — Why does rotating a secret not update an already running process?

## Hypothesis

Captured configuration is a snapshot. An allowed decrypt-style operation must also have the right context and enabled key in this model.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 16`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: A task captures generation 1; rotation advances current to 2, leaving the task at 1. A tenant-b context cannot open a tenant-a record; the correct context can.

Failure under investigation: Database password and secret value diverge; old tasks keep old secrets; log leakage; key disabled; wrong tenant context.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

All values are synthetic. The opaque-token store retains plaintext and performs no encryption; it is never a cryptographic reference implementation or secret store.

## Further experiment

Model rotation as change-database-password then update-secret then replace-task. Inject failure between each pair and propose a recoverable sequence. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
