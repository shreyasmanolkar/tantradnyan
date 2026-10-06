# Failure experiment — Why can two AZs still share one point of failure and one recurring bill?

## Hypothesis

A viable path has every required dependency available. A restored cut only contains operations included in that cut.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 19`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: app-a and app-b both require shared-nat-a and db-a. Losing app-a leaves a path; losing shared NAT or DB removes both modeled paths. A snapshot with op-1 loses accepted op-2.

Failure under investigation: Counting replicas without tracing dependencies; pricing only request volume while ignoring idle hourly resources; restore with receipts/results from different cuts.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Boolean path model and deterministic accepted-ID sets; no measured probabilities, AWS outage model, price quote or RTO/RPO measurements.

## Further experiment

Replace shared NAT/DB dependencies with a resilient topology and redraw which failures still remove all paths. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
