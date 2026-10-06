# Walkthrough — Which writes belong in a snapshot, and who gives bytes filesystem meaning?

## State and transitions

Durable block map and a separate volatile pending-write map.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **The snapshot is an independent cut of durable blocks. Unflushed writes are absent from this model after a crash.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Flush block 0; take a snapshot; buffer block 1 and crash; overwrite/flush block 0. Live block 0 changes, snapshot block 0 stays old, and block 1 is absent.

## Deliberate failure

A snapshot can omit buffered application state. Taking bytes from a busy database does not automatically establish an application-consistent backup.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Move snapshot() before flush() and predict its contents.
2. Add filesystem metadata pointing at a new block and construct an inconsistent snapshot if only metadata is flushed.
3. Implement a write-ahead record and commit marker in the model; recover only complete committed transactions.
4. Compare EBS, instance store, EFS and S3 for a task working directory. Explain which deletion or replacement event removes each kind of state.

## Transfer to AWS

Use the imported storage chapter. Cloud counterpart requires a deliberately provisioned scratch volume; no host disks are used by this lab.

Read [the service contract](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** No device, filesystem, mount, fsync guarantee, partial sector writes or real EBS snapshot is simulated. No privileged operation occurs.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
