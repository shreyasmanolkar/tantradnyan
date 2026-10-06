# Walkthrough — Which policy permits this exact operation, and which boundary can veto it?

## State and transitions

Statements with effect, action patterns, resource patterns, equality conditions; optional permissions boundary; session expiry.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **An applicable explicit deny wins. A boundary limits a grant; it cannot create one.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Reading invoices/a in env=dev is allowed. Reading another prefix has implicit deny. Reading invoices/private/a hits explicit deny. A session at its expiry is invalid.

## Deliberate failure

Correct credentials with the wrong action, prefix, environment, account or expired session. Adding a broad allow does not override the explicit deny.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Add s3:ListBucket to the example. Explain why its resource is a bucket ARN while GetObject uses an object ARN.
2. Remove the env condition, then show a formerly denied context that becomes allowed.
3. Implement trust evaluation as a separate function and demonstrate that permission to read an object does not grant AssumeRole.
4. Run workbook A and compare simulator results to a real negative test using a constrained role. Identify what the simulator omitted.

## Transfer to AWS

Workbook A; original lab 2 and the IAM foundations chapter.

Read [the service contract](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Only identity policies, simplified string patterns/equality and one boundary. No Principal, NotAction, resource-policy sessions, SCP/RCP hierarchy, cross-account, KMS key-policy evaluation or full IAM condition semantics.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
