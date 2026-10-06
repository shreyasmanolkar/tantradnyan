# Walkthrough — Why can an accepted request still produce an unusable resource?

## State and transitions

Request-token map; desired resource configuration; pending/failed/ready status.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **The same token and intent return the same resource ID. Acceptance is distinct from readiness.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: `create(request-1)` returns a pending resource. Its retry returns that same ID; failed reconciliation changes status to failed, then a successful reconciliation makes it ready.

## Deliberate failure

Capacity unavailable after API acceptance. Retrying with a different token creates another resource; reusing the token with another intent is rejected.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Predict the resource count when a lost response is retried first with the same token, then with a new token.
2. Change create() to allocate an ID before checking the token. Identify the smallest retry trace that leaks a second resource.
3. Add deletion as pending-delete → deleted. Decide whether retries return a tombstone or create a new generation.
4. In an existing CloudFormation lab, contrast stack events with endpoint health. Record the first time each becomes successful.

## Transfer to AWS

Original labs 3 and 6: stack events and target health; use the existing reviewed-change-set loop.

Read [the service contract](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Tokens are application data here. Real APIs differ in token support, scope, retention and mismatch behavior. No quotas, control-plane replication, or authentication.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
