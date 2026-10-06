# Failure experiment — Which missing or aggregated data makes a healthy-looking dashboard misleading?

## Hypothesis

The alarm decision explicitly depends on missing-data policy. Error budget compares failed requests with allowed failures over one defined population/window.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 17`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: 99 requests at 10 ms and one at 1000 ms have mean 19.9 ms, nearest-rank p99 10 ms, p100 1000 ms. Two of three CPU samples breach. Missing samples produce insufficient data by the model default.

Failure under investigation: A low mean hides tails; p99 can hide the worst 1%; no telemetry can look healthy when missing is treated as nonbreaching; an alarm without an action reaches nobody.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Finite lists and nearest-rank percentile, no CloudWatch backend, histogram accuracy, time-series ingestion delay or real SLO measurements.

## Further experiment

Change the population to 98 fast and two slow requests; recompute mean and p99. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
