# Failure experiment — Can an accepted job survive two independent retry boundaries without repeating its effect?

## Hypothesis

A stable command ID identifies one payload. Receipt and effect commit together. A repeated delivery reads the receipt and applies no new effect.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 20`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Submit op-1, repeat its submission, lose publish confirmation, restart publisher and publish again. Two queue copies exist. Crash worker after result commit but before ACK; restart replays the receipt. The final effect count is one and queue is empty.

Failure under investigation: Response loss, duplicate dispatch, worker death after commit, payload-ID conflict, denied action and failed persistence. Snapshot consistency and eventual dispatch are prerequisites for recovery.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Single writer, one JSON transaction file and sequential worker; no distributed broker, AWS durability, lease, auth service, fsync-based power-loss guarantee or atomic transaction across AWS services.

## Further experiment

Remove the durable command ID check. Count duplicate accepted work after a lost API response. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
