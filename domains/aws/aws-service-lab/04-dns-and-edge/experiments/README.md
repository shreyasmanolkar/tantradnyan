# Failure experiment — Why can DNS be correct while a request reaches an old or unhealthy endpoint?

## Hypothesis

Changing authority does not rewrite an already cached answer. TLS identity and HTTP application health are separate checks.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 04`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Cache old-alb at second 0 with TTL 30. Change authority immediately. Second 29 still returns old-alb; second 30 returns new-alb. Correct routing with the wrong certificate name fails separately.

Failure under investigation: Cached old answers, certificate mismatch, unhealthy origin and stale edge content have different repair paths.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

One resolver, fixed logical TTL, exact-name checks, no real DNS/TLS, wildcards, delegation, DNSSEC or CloudFront implementation.

## Further experiment

Change TTL from 30 to 300 and derive the latest possible expiry for a resolver that queried just before cutover. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
