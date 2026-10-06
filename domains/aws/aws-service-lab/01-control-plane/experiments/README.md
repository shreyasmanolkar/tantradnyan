# Failure experiment — Why can an accepted request still produce an unusable resource?

## Hypothesis

The same token and intent return the same resource ID. Acceptance is distinct from readiness.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 01`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: `create(request-1)` returns a pending resource. Its retry returns that same ID; failed reconciliation changes status to failed, then a successful reconciliation makes it ready.

Failure under investigation: Capacity unavailable after API acceptance. Retrying with a different token creates another resource; reusing the token with another intent is rejected.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Tokens are application data here. Real APIs differ in token support, scope, retention and mismatch behavior. No quotas, control-plane replication, or authentication.

## Further experiment

Predict the resource count when a lost response is retried first with the same token, then with a new token. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
