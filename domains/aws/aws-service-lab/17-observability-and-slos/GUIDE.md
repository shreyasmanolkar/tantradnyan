# Walkthrough — Which missing or aggregated data makes a healthy-looking dashboard misleading?

## State and transitions

Finite metric windows; M-of-N threshold; missing-data policy; request success count; nearest-rank latency quantile.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **The alarm decision explicitly depends on missing-data policy. Error budget compares failed requests with allowed failures over one defined population/window.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: 99 requests at 10 ms and one at 1000 ms have mean 19.9 ms, nearest-rank p99 10 ms, p100 1000 ms. Two of three CPU samples breach. Missing samples produce insufficient data by the model default.

## Deliberate failure

A low mean hides tails; p99 can hide the worst 1%; no telemetry can look healthy when missing is treated as nonbreaching; an alarm without an action reaches nobody.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Change the population to 98 fast and two slow requests; recompute mean and p99.
2. Compare missing, breaching and nonbreaching policies on the same empty window.
3. Add queue oldest-message age and a synthetic end-to-end request metric; explain what CPU alone misses.
4. In original lab 10, confirm notification delivery and identify one user-facing symptom whose alarm can fire while infrastructure CPU is normal.

## Transfer to AWS

Original lab 10. Actual CloudWatch missing-data evaluation has additional evaluation-range behavior beyond this toy window.

Read [the service contract](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Finite lists and nearest-rank percentile, no CloudWatch backend, histogram accuracy, time-series ingestion delay or real SLO measurements.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
