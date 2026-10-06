# Failure experiment — Why does permitting destination port 443 still allow a connection to time out?

## Hypothesis

The most specific matching route wins. ACL evaluation stops at its first matching rule. A connection needs both request and return paths.

## Setup and controls

Python 3.10+, explicit initial state in [model.py](../src/model.py), fixed inputs and sequential events. Any times are logical seconds. No randomness, AWS API, network listener or privileged host operation is used. SQLite/capstone files, where relevant, use a private temporary directory.

## Driver and expected result

From `domains/aws/aws-service-lab`: `python3 run.py experiments --stage 03`.

[Driver](run.py) runs the worked/failure fixture. Expected trace: 10.0.1.8 chooses local over the default NAT route. The request ACL allows port 443, but the response targets client port 49152; a port-443-only return rule fails.

Failure under investigation: Missing route, return ACL deny, security-group deny or absent application listener. These produce different failure labels in the model.

## Actual result

The local document does not invent a result. Observed runs and raw traces belong in the [curriculum evidence](../../../experiments/README.md); cloud runs require separate learner records. No cloud observation is implied by a local fixture.

## Explanation and limitations

IPv4, one synthetic flow and no real packets. NAT address translation, ENIs, SG references, connection-tracking limits and managed-service DNS are not implemented.

## Further experiment

Add a /24 route and predict which route wins for two destinations. Keep a prediction, exact changed input, raw output, and conclusion with the scope of the model.
