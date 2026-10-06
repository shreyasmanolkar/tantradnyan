# Failure experiment — How do whole-object writes, versions and preconditions change concurrent updates?

## Hypothesis

A stale match token cannot overwrite newer content. A current delete marker hides the key while historical versions remain readable.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 05`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Write v1, conditionally replace with v2, reject the stale v1 writer, then delete. Current is absent, but the original version still contains v1; three versions remain.

Failure under investigation: Blind overwrites lose updates. A delete marker is not byte erasure. Strong reads do not make read→modify→write atomic.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

The local token is SHA-256 of text, not an AWS ETag algorithm. No multipart uploads, replication, bucket configuration delays, lifecycle jobs or atomic multi-key writes.

## Further experiment

Draw two writers that both read v1. Compare blind PUT with If-Match and explain which write must be retried or rejected. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
