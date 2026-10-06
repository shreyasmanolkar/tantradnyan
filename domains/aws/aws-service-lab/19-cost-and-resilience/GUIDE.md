# Walkthrough — Why can two AZs still share one point of failure and one recurring bill?

## State and transitions

Quoted billing units/rates; required dependency paths; failed-domain set; snapshot and accepted operation IDs.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **A viable path has every required dependency available. A restored cut only contains operations included in that cut.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: app-a and app-b both require shared-nat-a and db-a. Losing app-a leaves a path; losing shared NAT or DB removes both modeled paths. A snapshot with op-1 loses accepted op-2.

## Deliberate failure

Counting replicas without tracing dependencies; pricing only request volume while ignoring idle hourly resources; restore with receipts/results from different cuts.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Replace shared NAT/DB dependencies with a resilient topology and redraw which failures still remove all paths.
2. Quote each real line item from the intended region; compare idle and one-month active scenarios with explicit units.
3. Measure RTO from incident start until verified service restoration, and RPO from accepted data not recovered. Do not substitute restore-command duration.
4. Run original lab 17 and inventory retained snapshots, object versions, images and secrets after lab 18 teardown.

## Transfer to AWS

Original labs 15–18 and operations cost/recovery sections. Use current regional pricing; local numerical rates are illustrative only.

Read [the service contract](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Boolean path model and deterministic accepted-ID sets; no measured probabilities, AWS outage model, price quote or RTO/RPO measurements.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
