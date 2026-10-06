# Runnable learning examples

Follow [the labs](../04-hands-on-labs.md); these files do nothing until you deliberately build/deploy them. The AWS account needs appropriate provisioning permissions. Do not deploy them into an existing production VPC.

| Artifact                         | Purpose                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `foundation.json`                | Two-AZ VPC; public ALB subnets, private task subnets, isolated DB subnets; one zonal NAT; S3 gateway endpoint; security groups; ECR                                            |
| `service.json`                   | Two private Fargate tasks; ALB; optional HTTPS; bounded CPU/memory; scoped ECR/log/secret execution permissions; empty application task role; log retention; example CPU alarm |
| `data.json`                      | Private encrypted PostgreSQL; managed admin secret; separate generated app credential; one-off initialization task; backups; deletion protection                               |
| `async.json`                     | Private encrypted/versioned bucket; SQS and DLQ; example DLQ alarm                                                                                                             |
| `cache.json`                     | Optional private TLS Valkey serverless cache; network-only lab access; no application RBAC                                                                                     |
| `api.py`                         | `/`, `/healthz`, `/db`; JSON logs, DB TLS verification, two-connection pool                                                                                                    |
| `db_init.py`                     | Creates only a disposable marker and SELECT-only login using a separate administrative task                                                                                    |
| `cache_probe.py`                 | Tests TLS cache connectivity from a task; does not implement an application cache                                                                                              |
| `github-actions.yml.example`     | Inactive two-job OIDC pipeline: build/scan/plan, then protected apply and revision/target-health checks                                                                        |
| `smoke.py`                       | Local API acceptance check; no AWS calls                                                                                                                                       |
| `lab.sh`                         | Explicit plan and output-reading functions; sourcing does not apply changes                                                                                                    |
| `Dockerfile`, `requirements.txt` | Learning image; x86-64 task definition; no AWS credentials baked into it                                                                                                       |

CloudFormation JSON is used so templates can be parsed without installing a YAML library. The intrinsic functions are the same as YAML's `!Ref`, `!Sub`, and `!GetAtt`.

## Learning shortcuts and production promotion gates

- The Python stdlib HTTP server is a diagnostic teaching server, **not a production HTTP application framework**. It has no user authentication/authorization or general request-concurrency limit. Ingress MUST stay restricted to your client CIDR; do not deploy real data. Substitute your hardened backend before opening the API to users.
- One zonal NAT is an intentional cost/complexity shortcut; the other AZ depends on it. Single-AZ RDS is the initial lab setting, despite two DB subnets. Two tasks alone do not make this stack AZ-resilient. Select Multi-AZ RDS and resilient egress before claiming that property.
- Secrets are injected at task start. The admin secret is given only to the initialization task; the API receives the SELECT-only user's secret. Bootstrap-task creation alone does not initialize SQL. Run it explicitly and check its exit code. Restrict who can run/pass its role after bootstrap.
- RDS manages the admin password lifecycle; the app secret has **no automated database rotation integration**. Update password and secret together, then replace tasks, or implement/test a supported rotation strategy before production.
- TLS is verified from application to RDS. Optional client→ALB TLS is added in lab 7. ALB→task is HTTP on a restricted SG path. Decide whether your threat model requires backend TLS.
- The cache uses TLS and SG isolation only, with no RBAC user group. This is optional disposable infrastructure; add least-privilege RBAC/IAM auth and cache-aside application logic before production.
- CPU and DLQ alarms initially have **no notification action**; lab 10 connects SNS. Thresholds are teaching values. Add user-facing availability/latency alerts, traces, threat controls, access logs, and response ownership.
- Dependency ranges, the base-image tag and downloaded CA bundle are moving build inputs. Resolve/scan/lock dependencies and base digest for releases. Deploy the built ECR **digest**, not the mutable build inputs.
- Fargate ephemeral storage is disposable. DB snapshots, S3 versions, app secret and ECR are deliberately retained or snapshot-protected; **stack deletion does not remove every billable artifact**.

## Validation boundaries

Local validation can check Python/shell/JSON syntax, CloudFormation schema (with `cfn-lint`), parameter references, HTTP behavior and image build. The actual region/account still must validate engine/class availability, IAM controls, capacity, image pulls, certificate validation, DB bootstrap, failover and restore. Use the acceptance checks in each lab. Do not label this a production-certified stack.

Source references: [CloudFormation resource reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-template-resource-type-ref.html), [ECS task parameters](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html), [RDS managed credentials](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html), [Psycopg pool lifecycle](https://www.psycopg.org/psycopg3/docs/advanced/pool.html).

Repeat schema checks after editing templates. A successful local schema check cannot detect a region-specific quota, unavailable engine/class, denied organization policy or missing network path.
