# Walkthrough — How do independent subscribers differ from workers competing for one job?

## State and transitions

Event ID/source/type; subscriber filters; separate target inboxes; failed target list.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Each matching subscriber gets its own copy. Consuming one inbox does not acknowledge another subscriber.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: OrderPaid reaches billing; audit is unavailable and receives a targeted retry later; shipping does not match. Billing consumes its copy while audit still retains one.

## Deliberate failure

Partial fanout, missing publish, incompatible schema and one slow subscriber. Broadcasting again can duplicate already successful subscribers.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Send ten events to two consumers of one queue, then to two independent subscriber queues; compare intended total effects.
2. Retry all targets after only audit failed; identify the billing duplicate and define target-side deduplication.
3. Add event schema version and a subscriber that rejects unsupported versions to its own DLQ.
4. Choose SQS, SNS, EventBridge or Step Functions for payment→shipping→email. Specify where durable work, routing, orchestration and error recovery live.

## Transfer to AWS

Read original messaging chapter. Optional cloud extension: SNS→two SQS queues or EventBridge→SQS; explicitly provision permissions and cleanup.

Read [the service contract](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Equality filters only; no SNS/EventBridge delivery implementation, IAM policy, archive, replay, retries or orchestration service. Partial failures are returned for the caller to handle.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
