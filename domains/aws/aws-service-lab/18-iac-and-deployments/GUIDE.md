# Walkthrough — What exactly was approved when infrastructure changed?

## State and transitions

Actual and desired resource maps; immutable plan with base fingerprint; replacement-property list.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Execute the reviewed desired state, tied to its observed base in this model. A replacement is distinct from an in-place update.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Changing table primary_key is replacement; changing image is update. Manual actual-state drift after planning makes apply reject the old base.

## Deliberate failure

Replanning after approval changes intent; replacement can destroy identity/data; rollback cannot undo external application side effects.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Add a retained database and specify cleanup ownership after replacement.
2. Change desired state after plan creation; verify the deep-copied reviewed plan does not change.
3. Implement create-before-delete with an injected failed health gate; preserve the old endpoint on failure.
4. In the imported plan/apply loop, record exact ChangeSet ARN, image digest, replacement flags and resulting task revision. Explain what drift checks and review still cannot predict.

## Transfer to AWS

Original labs 6 and 11. Real CloudFormation is not an atomic map replacement and does not inherit the model base-fingerprint guarantee.

Read [the service contract](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** One atomic in-memory application; no cloud API failures, dependency graph, rollback, IAM, replacement lifecycle or real drift detector.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
