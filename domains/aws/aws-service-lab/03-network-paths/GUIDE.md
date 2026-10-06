# Walkthrough — Why does permitting destination port 443 still allow a connection to time out?

## State and transitions

IPv4 route prefixes; ordered ACL rules; destination and ephemeral source ports; SG/listener gates.

Read [model.py](src/model.py). Identify each authoritative field, copied value, version/receipt, and logical clock. Invariant: **The most specific matching route wins. ACL evaluation stops at its first matching rule. A connection needs both request and return paths.**

## Predict → run → explain

1. Before running, write the expected returned fields from `demo()` and locate the transition responsible for each.
2. Run the [demo](src/demo.py) using the [stage commands](README.md). Compare your prediction with its JSON trace.
3. Read the [checks](tests/test_model.py): one worked case and an independent boundary/counterexample. Locate what would make each fail.
4. Change one controlled assumption, rerun, and save the smallest changed trace in your own experiment notes.

Worked trace: 10.0.1.8 chooses local over the default NAT route. The request ACL allows port 443, but the response targets client port 49152; a port-443-only return rule fails.

## Deliberate failure

Missing route, return ACL deny, security-group deny or absent application listener. These produce different failure labels in the model.

The fixture exposes this failure without random timing. Logical time values are model inputs, not measured service latency. The repair follows the invariant rather than adding unconditional retries.

## Exercises

1. Add a /24 route and predict which route wins for two destinations.
2. Add an earlier numbered deny before a later allow. Show why rule order now determines the result.
3. Represent security-group connection state explicitly and test a permitted reply without adding a reverse SG rule.
4. Draw client→ALB→task→RDS and task→ECR/logs/secrets paths for original lab 3. For each hop identify route, SG, DNS and identity dependencies.

## Transfer to AWS

Original labs 3, 6 and 8. Read routes and SGs before changing an AWS path.

Read [the service contract](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html), then compare the local transition with a real request/result. Record account, region, command, resource ID, expected result, actual result, and cleanup. A rejected local action is not evidence that an AWS policy rejects it. Use the [cloud workbook](../../CLOUD-LABS.md) for runnable comparisons and the [original labs](../../service-lifecycle/04-hands-on-labs.md) for the cumulative service.

**Model omissions:** IPv4, one synthetic flow and no real packets. NAT address translation, ENIs, SG references, connection-tracking limits and managed-service DNS are not implemented.

Checkpoint explanations and design rubrics are in the [exercise review](../../EXERCISES.md). Preserve your prediction before reading them.
