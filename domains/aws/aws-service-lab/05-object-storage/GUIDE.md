# Walkthrough — How do whole-object writes, versions and preconditions change concurrent updates?

## State and transitions

Keys mapped to ordered immutable versions; current delete marker; content comparison token.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **A stale match token cannot overwrite newer content. A current delete marker hides the key while historical versions remain readable.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Write v1, conditionally replace with v2, reject the stale v1 writer, then delete. Current is absent, but the original version still contains v1; three versions remain.

## Deliberate failure

Blind overwrites lose updates. A delete marker is not byte erasure. Strong reads do not make read→modify→write atomic.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Draw two writers that both read v1. Compare blind PUT with If-Match and explain which write must be retried or rejected.
2. Remove the match check and construct the lost-update trace.
3. Implement deleting one explicit version and explain when an earlier version becomes current.
4. Run workbook B. Record returned ETags and version IDs separately; demonstrate that deleting current content leaves stored versions.

## Transfer to AWS

Workbook B; first S3 exercise and original lab 12.

Read [the service contract](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** The local token is SHA-256 of text, not an AWS ETag algorithm. No multipart uploads, replication, bucket configuration delays, lifecycle jobs or atomic multi-key writes.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
