# Walkthrough — Why does rotating a secret not update an already running process?

## State and transitions

Current secret value/generation; captured task environment; opaque sealed record, context, key-state and principal gates.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Captured configuration is a snapshot. An allowed decrypt-style operation must also have the right context and enabled key in this model.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: A task captures generation 1; rotation advances current to 2, leaving the task at 1. A tenant-b context cannot open a tenant-a record; the correct context can.

## Deliberate failure

Database password and secret value diverge; old tasks keep old secrets; log leakage; key disabled; wrong tenant context.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Model rotation as change-database-password then update-secret then replace-task. Inject failure between each pair and propose a recoverable sequence.
2. Add overlapping credential generations and define when old sessions are invalidated.
3. Draw real envelope encryption: local data key, encrypted payload, wrapped data key, KMS authorization and encryption context. Explain why the local opaque-token model offers no confidentiality.
4. For original lab 9, identify who reads the secret at task startup and who connects to the DB. Determine what must be redeployed after app-secret rotation.

## Transfer to AWS

Original lab 9 and the documented app-secret rotation limitation; current KMS and Secrets Manager contracts.

Read [the service contract](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** All values are synthetic. The opaque-token store retains plaintext and performs no encryption; it is never a cryptographic reference implementation or secret store.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
