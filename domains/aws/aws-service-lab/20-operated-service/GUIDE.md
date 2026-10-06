# Walkthrough — Can an accepted job survive two independent retry boundaries without repeating its effect?

## State and transitions

File-backed commands; unpublished outbox entries; duplicate queue entries; processed results/receipts; effect count.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **A stable command ID identifies one payload. Receipt and effect commit together. A repeated delivery reads the receipt and applies no new effect.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Submit op-1, repeat its submission, lose publish confirmation, restart publisher and publish again. Two queue copies exist. Crash worker after result commit but before ACK; restart replays the receipt. The final effect count is one and queue is empty.

## Deliberate failure

Response loss, duplicate dispatch, worker death after commit, payload-ID conflict, denied action and failed persistence. Snapshot consistency and eventual dispatch are prerequisites for recovery.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Remove the durable command ID check. Count duplicate accepted work after a lost API response.
2. Separate result and receipt writes and inject a crash between them; demonstrate both loss and duplication.
3. Add a poison-job DLQ and a visibility lease by integrating the stage-12 state machine; preserve the business ID across new receipts.
4. Design a real asset processor using S3 object version IDs, DynamoDB job/outbox records, SQS and a worker. Mark each transaction boundary and explain why S3 upload plus DB insert is not one transaction.
5. Use the 100-job check as correctness evidence. Propose a separate controlled load experiment with rates, queue age, concurrency limits, cost and raw results; do not infer throughput from this check.

## Transfer to AWS

Workbook D/E demonstrate a narrow real conditional receipt. Original container labs supply the operated deployment. This capstone is a local mechanism integration.

Read [the service contract](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Single writer, one JSON transaction file and sequential worker; no distributed broker, AWS durability, lease, auth service, fsync-based power-loss guarantee or atomic transaction across AWS services.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
