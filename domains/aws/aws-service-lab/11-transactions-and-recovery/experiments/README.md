# Failure experiment — Can a retry receipt and a business effect commit or roll back together?

## Hypothesis

A new receipt and balance update share one SQL transaction. The same ID/amount does not apply again; different content under that ID is rejected.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 11`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Commit job-1 amount 7; repeat it; fail job-2 before commit; snapshot; commit job-3 amount 2. Live total is 9, restored total is 7.

Failure under investigation: Committing a receipt before an effect can lose work; committing an effect before a receipt can duplicate work. Separate nontransactional writes create a crash gap.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Single local ledger, SQLite BEGIN IMMEDIATE and ordinary file backup/reopen. No RDS deployment, engine equivalence, power-loss test or multi-service transaction.

## Further experiment

Split receipt and balance into separate commits. Inject a failure between them and draw both failure orders. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
