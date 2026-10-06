# Failure experiment — Which policy permits this exact operation, and which boundary can veto it?

## Hypothesis

An applicable explicit deny wins. A boundary limits a grant; it cannot create one.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 02`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Reading invoices/a in env=dev is allowed. Reading another prefix has implicit deny. Reading invoices/private/a hits explicit deny. A session at its expiry is invalid.

Failure under investigation: Correct credentials with the wrong action, prefix, environment, account or expired session. Adding a broad allow does not override the explicit deny.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Only identity policies, simplified string patterns/equality and one boundary. No Principal, NotAction, resource-policy sessions, SCP/RCP hierarchy, cross-account, KMS key-policy evaluation or full IAM condition semantics.

## Further experiment

Add s3:ListBucket to the example. Explain why its resource is a bucket ARN while GetObject uses an object ARN. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
