# Walkthrough — Why is receive neither deletion nor ownership forever?

## State and transitions

Message bodies; receive counts; visibility deadlines; changing receipt handles; dead-letter list.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **A hidden message can reappear. Acknowledgement uses the current delivery receipt in this model; repeated failure eventually moves the message to the DLQ.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Receive at 0; hidden at 4; visible at 5. The new receive gets another handle. The old ACK fails here, the new one removes it. A poison message reaches the model DLQ after three receives.

## Deliberate failure

Worker crash after effect but before delete; processing longer than visibility; poison jobs; stale handle. Visibility is not business-level exactly-once execution.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Set visibility shorter than processing time and draw two workers concurrently handling one business ID.
2. Remove worker deduplication and count effects after a lost delete acknowledgement.
3. Add a heartbeat to extend visibility and a retry cap for nonretryable errors; explain how the old worker is prevented from applying late effects.
4. Run workbook C. Record MessageId, ReceiptHandle and ApproximateReceiveCount as distinct fields; use a synthetic business ID in the body.

## Transfer to AWS

Workbook C and original lab 13.

Read [the service contract](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessage.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Deterministic toy queue has no spontaneous duplicate or reorder; retries demonstrate the need for idempotency. Its stale-handle rejection is stronger than the AWS DeleteMessage response semantics. No FIFO implementation.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
