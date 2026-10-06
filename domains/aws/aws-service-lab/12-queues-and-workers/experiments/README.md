# Failure experiment — Why is receive neither deletion nor ownership forever?

## Hypothesis

A hidden message can reappear. Acknowledgement uses the current delivery receipt in this model; repeated failure eventually moves the message to the DLQ.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 12`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: Receive at 0; hidden at 4; visible at 5. The new receive gets another handle. The old ACK fails here, the new one removes it. A poison message reaches the model DLQ after three receives.

Failure under investigation: Worker crash after effect but before delete; processing longer than visibility; poison jobs; stale handle. Visibility is not business-level exactly-once execution.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

Deterministic toy queue has no spontaneous duplicate or reorder; retries demonstrate the need for idempotency. Its stale-handle rejection is stronger than the AWS DeleteMessage response semantics. No FIFO implementation.

## Further experiment

Set visibility shorter than processing time and draw two workers concurrently handling one business ID. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
