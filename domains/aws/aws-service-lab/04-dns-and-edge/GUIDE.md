# Walkthrough — Why can DNS be correct while a request reaches an old or unhealthy endpoint?

## State and transitions

Authoritative name map; cached answer with logical expiry; certificate-name and target-health gates.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Changing authority does not rewrite an already cached answer. TLS identity and HTTP application health are separate checks.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: Cache old-alb at second 0 with TTL 30. Change authority immediately. Second 29 still returns old-alb; second 30 returns new-alb. Correct routing with the wrong certificate name fails separately.

## Deliberate failure

Cached old answers, certificate mismatch, unhealthy origin and stale edge content have different repair paths.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Change TTL from 30 to 300 and derive the latest possible expiry for a resolver that queried just before cutover.
2. Add a negative cache for missing names. Show why creating a new record may not immediately repair clients.
3. Add a content cache keyed by URL and tenant. Demonstrate cross-tenant leakage when tenant is omitted.
4. For original lab 7, inspect the requested hostname, resolved endpoint, certificate names and HTTP status separately. Propose a rollback that works while some clients retain the old DNS answer.

## Transfer to AWS

Original lab 7. Read CloudFront cache-policy and Route 53 record contracts before adding an edge cache.

Read [the service contract](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** One resolver, fixed logical TTL, exact-name checks, no real DNS/TLS, wildcards, delegation, DNSSEC or CloudFront implementation.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
