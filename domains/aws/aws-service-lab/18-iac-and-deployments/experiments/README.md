# Failure experiment — What exactly was approved when infrastructure changed?

## Hypothesis

Execute the reviewed desired state, tied to its observed base in this model. A replacement is distinct from an in-place update.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 18`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Changing table primary_key is replacement; changing image is update. Manual actual-state drift after planning makes apply reject the old base.

Failure under investigation: Replanning after approval changes intent; replacement can destroy identity/data; rollback cannot undo external application side effects.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

One atomic in-memory application; no cloud API failures, dependency graph, rollback, IAM, replacement lifecycle or real drift detector.

## Further experiment

Add a retained database and specify cleanup ownership after replacement. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
