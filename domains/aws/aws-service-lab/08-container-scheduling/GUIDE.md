# Walkthrough — Why can a service have free CPU, pending tasks and an unsafe rollout?

## State and transitions

Task CPU/memory requests; host capacities; pending assignments; image digest and health.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **Every placement respects both resource dimensions. A rollout gate requires healthy tasks on the intended digest.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: An 8-CPU/1024-memory host fits two 1-CPU/512-memory tasks; the third stays pending despite free CPU. An unhealthy new digest cannot satisfy the cutover gate.

## Deliberate failure

Memory, networking, capacity, image pull, execution-role permissions, startup and health checks can fail independently.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Create a placement example where first-fit fragmentation blocks a task although total free CPU/memory would fit it with rearrangement.
2. Modify the gate to count healthy old tasks and show a false successful deployment.
3. Add draining state and a maximum-unavailable constraint to a rolling deployment.
4. Inspect task role versus execution role in original lab 6. Which identity pulls ECR, emits logs, injects a secret, or lets application code access S3?

## Transfer to AWS

Original labs 5–6, 9 and 11. EKS adds Kubernetes objects/controllers; it does not remove resource or identity reasoning.

Read [the service contract](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** Bin packing and cutover predicate only; no ECS/Fargate/EKS scheduler, AZ placement, task startup or real load balancer.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
