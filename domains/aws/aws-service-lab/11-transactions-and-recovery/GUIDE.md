# Walkthrough — Can a retry receipt and a business effect commit or roll back together?

## State and transitions

SQLite receipts table keyed by job ID; balance row; WAL-backed local database; backup file.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **A new receipt and balance update share one SQL transaction. The same ID/amount does not apply again; different content under that ID is rejected.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Commit job-1 amount 7; repeat it; fail job-2 before commit; snapshot; commit job-3 amount 2. Live total is 9, restored total is 7.

## Deliberate failure

Committing a receipt before an effect can lose work; committing an effect before a receipt can duplicate work. Separate nontransactional writes create a crash gap.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Split receipt and balance into separate commits. Inject a failure between them and draw both failure orders.
2. Open the persisted database after closing the original connection and retry the same job.
3. Add two-account transfer, nonnegative balance and a transaction that rejects insufficient funds.
4. In original labs 8–9 and 17, verify database identity, restricted SQL permissions, restore contents and endpoint cutover. Define which external effects SQL rollback cannot undo.

## Transfer to AWS

Original labs 8–9 and 17. Local SQLite is actual SQL behavior, not a PostgreSQL/RDS isolation or HA test.

Read [the service contract](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Single local ledger, SQLite BEGIN IMMEDIATE and ordinary file backup/reopen. No RDS deployment, engine equivalence, power-loss test or multi-service transaction.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
