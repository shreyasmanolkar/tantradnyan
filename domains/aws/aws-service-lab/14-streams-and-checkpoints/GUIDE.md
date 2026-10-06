# Walkthrough — Why can successful processing repeat after a consumer restarts?

## State and transitions

Append-only shard records; per-shard sequence; independent consumer checkpoints.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Order exists within each model shard. Checkpoints are monotone processed-prefix claims; another consumer has its own position.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Append a,b under one key. Read a without checkpoint, read a again, checkpoint next offset 1, then read b. Audit still reads a,b.

## Deliberate failure

Effect before checkpoint causes replay; checkpoint before effect causes loss. Different shards do not have one global order.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Swap effect and checkpoint order, then inject a crash at the boundary in each version.
2. Create two keys on different shards and explain why equal per-shard sequence numbers do not define total order.
3. Add an idempotent sink with a per-event receipt; then simulate retention expiring records beyond a stale checkpoint.
4. Design Kinesis analytics with two consumers, independent replay and a hot partition key. Explain why a worker queue is insufficient for retained independent histories.

## Transfer to AWS

Kinesis source-reading exercise; optional cloud experiment requires an owned stream with reviewed retention, capacity and cleanup.

Read [the service contract](https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Fixed shard count, toy SHA-256 hash, zero-based integer offsets and no retention/resharding. These are not Kinesis hash ranges, sequence values or exactly-once delivery.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
