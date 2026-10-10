# Walkthrough: Password verifiers

1. Keep the question visible: **Why must password verifiers be costly while session tokens need unpredictability?**
2. Inspect state in [model.mjs](src/model.mjs): password, random salt, cost record. Identify which fields come from a caller and which are trusted server state.
3. Follow the transition: KDF enrollment then constant-time comparison. Name the actor, recipient, clock and failure return/exception. No trust comes merely from the shape of an input.
4. Predict the boundary: **same password has different salted records; wrong password fails**. Run the documented tests and inspect the rejecting case before modifying code.
5. Change one input in a test fixture, not a real account: principal, tenant, recipient, timestamp or credential bytes as appropriate. Explain why the outcome should change; record whether it actually does.
6. Apply the lesson: Limit guessing and hashing concurrency; choose measured costs. Name a production boundary that would require another check or durable transaction.

```mermaid
flowchart LR
 S[Explicit initial state] --> T[Validated transition]
 I[Caller-controlled input] --> T
 T --> D{Invariant preserved?}
 D -->|yes| A[New state / permitted result]
 D -->|no| R[Reject without granting authority]
```

The diagram is a state-transition reading aid, not a complete wire protocol. Exact HTTP/sequence messages and production placement are in [chapter 4](../../GUIDE.md). This implementation deliberately omits breach screening, pepper, reset/recovery, WebAuthn and deployment benchmarking. Ask which omission would invalidate your deployment’s requirement before adding features.

**Failure experiment:** run [the stage driver](experiments/run.mjs), then its negative tests. The driver prints sanitized model outcomes or integration instructions; it is not a benchmark or a claim that external IdP/SCIM integrations ran. Verify the relevant [evidence](../../experiments/README.md) and write your own hypothesis/setup/actual-result/limits/next-question note.
