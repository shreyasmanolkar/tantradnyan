# Walkthrough — Why does a strongly consistent read still need a conditional write?

## State and transitions

Authoritative items with versions; delayed read replica; deterministic toy partition assignment.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Compare the expected version inside the write. Only one competing writer from that version can succeed.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Create pending version 1; an eventual read can still see missing. Writer A sets paid at version 2. Writer B expecting version 1 is rejected. Explicit replication makes the eventual reader catch up.

## Deliberate failure

Read freshness does not lock an item. Adding partitions does not distribute traffic for one identical hot key.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Draw two strongly consistent reads of version 1 followed by blind writes. Show that freshness alone permits a lost update.
2. Remove the expected-version condition and observe which test/trace loses the conflict.
3. Model a GSI projection that lags primary state, then design a workflow that reads the primary key for confirmation.
4. Run workbook D and compare a successful UpdateItem, ConditionalCheckFailedException, and a strongly consistent GetItem.

## Transfer to AWS

Workbook D. The AWS read-consistency choices differ for table/LSI versus GSI and for global-table modes.

Read [the service contract](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** One in-memory primary, one manually advanced replica and a fixed SHA-256 partition hash. No DynamoDB physical partitioning, transactions, adaptive capacity, TTL service or global table implementation.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
