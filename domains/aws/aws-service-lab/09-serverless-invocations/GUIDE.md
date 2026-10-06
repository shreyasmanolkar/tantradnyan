# Walkthrough — Why are warm globals neither durable storage nor reliable deduplication?

## State and transitions

Finite active execution slots; reusable environments; environment-local cache.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Busy slots cannot execute another invocation in this model. Recycling an environment discards its cache.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: With limit 1: first acquisition is cold, the next concurrent request is throttled, release/reacquire is warm, recycle/reacquire is cold with an empty cache.

## Deliberate failure

Throttling, cold initialization and duplicate events are distinct. A warm seen-ID set disappears on environment replacement.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Use λS to calculate average concurrency for 200 events/s taking 0.25 s each.
2. Add two environments with independent seen-ID sets; show the same event processed by both.
3. Move the idempotency receipt into a conditional durable store and define when it expires.
4. Run workbook E. Distinguish an Invoke API success from FunctionError; fail after a durable write and retry the same business ID.

## Transfer to AWS

Workbook E; current runtime table and Lambda asynchronous-retry contract.

Read [the service contract](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Pool semantics are selected assumptions, not exact Lambda scheduling, scaling quotas, billing or retry timing. Reserved and provisioned concurrency are different real configurations.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
