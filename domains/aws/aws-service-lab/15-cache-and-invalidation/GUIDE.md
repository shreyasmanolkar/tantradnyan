# Walkthrough — Why can invalidation be followed immediately by a stale cache entry?

## State and transitions

Database value/version; delayed fill result; cached value with TTL.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **A guarded fill is accepted only if its observed version still matches authoritative state. TTL bounds this model stale entry lifetime after fill, not a general consistency guarantee.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Reader starts old-version fetch. Writer stores new version and invalidates. Reader fills old data afterward. Naive reads old; version-guarded reads new; the naive cache recovers on TTL expiry.

## Deliberate failure

Delayed fill resurrects invalid data; stampede after expiry; incomplete cache key; cache outage coupling; stale authorization data.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Draw the interleaving and mark exactly why invalidating on every write did not prevent stale data.
2. Add ten readers after expiry and count backing-store fetches with and without single-flight.
3. Implement bounded negative caching and decide how a newly created record invalidates a previous missing result.
4. For original lab 14, distinguish TLS connectivity from cache-aside correctness. Choose maximum allowed staleness and fallback behavior before adding application caching.

## Transfer to AWS

Original lab 14 is connectivity only. The local model supplies the missing application consistency experiment.

Read [the service contract](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Guard checks use one local authoritative version; distributed atomic guard/invalidation requires additional machinery. No Valkey/Redis protocol, eviction or persistence behavior.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
