# 04 — Local service → operated AWS service

[Index](README.md) · [Example files and limitations](examples/README.md) · [Operations reference](03-operations-and-reference.md)

Most labs form a cumulative container-service journey. Labs 12–13 also work as a focused S3/SQS track on their own. Every stage includes its objective, prerequisites, verification, failure clues, costs, cleanup, and production implication. They are **instructions for your sandbox**, not changes already made to AWS. Expect multiple sessions; tear down idle infrastructure rather than leaving it running after practice.

## Full container track setup and change loop

Install AWS CLI v2, Docker with buildx, Python 3, `jq`, Git, and DNS/TLS tools. Use a sandbox **member** account, a region with two available AZs and required services, and a domain you control for HTTPS. Your provisioning identity needs permissions for the template resource types and narrowly reviewed IAM role creation/passing. That identity is intentionally more privileged than the application role; do not solve a failure by making the task an administrator.

This setup is for the longer container-service path. If you only want to practice S3 and SQS, use the focused track below; it does not require Docker, a domain, or the VPC labs.

All commands run from the repository root in Bash. Use no production secrets/data. Account ID, resource ARN and endpoint are identifiers, not passwords. Do not enable `set -x` around credentials or presigned URLs.

```bash
export AWS_PROFILE=aws-lab AWS_REGION=us-east-1 AWS_PAGER=""
export AWS_LAB_PREFIX=aws101
source examples/lab.sh
aws sso login
aws sts get-caller-identity
# Explicitly set this to YOUR sandbox account and assert it before every apply.
export EXPECTED_ACCOUNT=111122223333
```

**Review/apply loop:** `plan_stack` / `plan_service` create only a change set and print changes. Inspect replacements, IAM, public ingress and cost. Run the following only after accepting that specific plan; a later plan replaces `$CHANGE_SET`:

```bash
test "$(aws sts get-caller-identity --query Account --output text)" = "$EXPECTED_ACCOUNT" || exit 1
aws cloudformation describe-change-set --change-set-name "$CHANGE_SET" \
  --query '{Type:ChangeSetType,Status:Status,Changes:Changes}'
test "$(aws cloudformation describe-change-set --change-set-name "$CHANGE_SET" --query Status --output text)" = CREATE_COMPLETE || exit 1
CHANGE_TYPE=$(aws cloudformation describe-change-set --change-set-name "$CHANGE_SET" --query ChangeSetType --output text)
aws cloudformation execute-change-set --change-set-name "$CHANGE_SET"
if [ "$CHANGE_TYPE" = CREATE ]; then
  aws cloudformation wait stack-create-complete --stack-name "$STACK"
else
  aws cloudformation wait stack-update-complete --stack-name "$STACK"
fi
```

A failed waiter is an investigation trigger: inspect stack events; do not continue with missing outputs. Empty-change-set errors mean there is nothing new to apply. Helpers use no persistent local configuration: in a new shell reload outputs and restore the **non-secret** values for image digest, certificate ARN and database endpoint/secret ARN before planning a service update, or you could remove a previous feature.

## Focused S3 and SQS track

Labs 12–13 can be done on their own; they do not need the VPC, Docker, domain, ECS, or database from labs 1–11. You need AWS CLI v2, Python 3, Bash, `jq`, `curl`, an authorized sandbox profile, and permission to create CloudFormation stacks containing S3 and SQS resources. This track still creates billable resources. Read the lab cost and cleanup notes, and use only synthetic data.

From the repository root, set your sandbox profile and Region, then load the helper functions. Confirm the account before making a change:

```bash
export AWS_PROFILE=aws-lab AWS_REGION=us-east-1 AWS_PAGER=""
export AWS_LAB_PREFIX=aws101
source examples/lab.sh
aws sso login --profile "$AWS_PROFILE"
aws sts get-caller-identity
export EXPECTED_ACCOUNT=111122223333  # Replace with your sandbox account ID.
```

Then follow [lab 12](#12--add-private-object-storage) and [lab 13](#13--process-a-queue-job-and-observe-duplicate-delivery). Use the [review/apply loop](#full-container-track-setup-and-change-loop) for the stack change set. Compare the printed account ID and ARN with your sandbox before setting `EXPECTED_ACCOUNT`; check it before each apply. The S3 bucket is retained when its stack is deleted; follow the version-aware cleanup in the final teardown so stored versions do not remain billable.

## 1 — Bootstrap the account safely

**Objective/architecture:** organization → sandbox member account → federated developer. **Prerequisite:** authorized account owner; no workload yet. **Services:** Organizations, Identity Center, Billing/Budgets, CloudTrail.

1. Complete the [bootstrap checklist](01-foundations.md#bootstrap-checklist): root MFA/recovery, member account, Identity Center groups/permission set, audit logging, owner and billing contacts.
2. Use the Billing console to create a monthly cost budget and actual/forecast notifications to your own monitored address; set an amount you are willing to spend. Enable anomaly notifications. Console use here helps verify account ownership and recipient confirmation.
3. Install CLI v2 from [AWS's installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), run `aws configure sso --profile aws-lab`, authenticate, and inspect caller identity above.

**Verify:** caller ARN is a federated role in the sandbox, not root; test budget notification delivery and an audit lookup. **Common error:** correct username, wrong account/region. **Cost:** audit storage/data events and selected support/features; budgets are not a hard cap. **Cleanup:** retain foundational security; sign out with `aws sso logout` when finished, not while running later labs. **Learned/production:** identity and recovery exist before infrastructure.

## 2 — Observe least privilege

**Objective:** distinguish a human role, a task role and a deployment role. **Prerequisite:** stage 1. **Services:** IAM, STS, Access Analyzer.

1. Save the S3-prefix identity policy from [IAM example A](01-foundations.md#example-a-application-reads-only-one-s3-prefix) to `/tmp/read-prefix-policy.json`, replacing the example bucket with your intended bucket name.
2. Validate its syntax and policy semantics:

```bash
aws accessanalyzer validate-policy --policy-document file:///tmp/read-prefix-policy.json \
  --policy-type IDENTITY_POLICY
aws sts get-caller-identity
```

3. List your assigned Identity Center permission set with an administrator if necessary; compare it to the policy. ListBucket and GetObject target different ARN shapes. Do not attach this policy to your human role just to hide other permissions.
4. At stage 12, attach a matching policy to a **dedicated constrained test role**, authenticate as it through an authorized trust path, and test one allowed key and a second bucket/prefix that MUST be denied. A test under an administrator role proves nothing about least privilege.

**Verify:** no unresolved validation errors; explain trust versus permissions and why explicit deny wins. **Failure:** missing validator permission is a provisioning-role issue. **Cost:** verify chosen Analyzer features; analysis products can differ. **Cleanup:** remove temporary test-role policy/role after stage 12. **Production:** validate policies and test negative cases; never grant broad access to eliminate an unexplained denial.

## 3 — Build the network deliberately

**Objective/architecture:** two AZs; public ingress, private compute, isolated DB; outbound via one zonal NAT. **Prerequisite:** stages 1–2, budget approved by you. **Services:** VPC, IGW, NAT, endpoints, SG, ECR.

```bash
aws ec2 describe-availability-zones --filters Name=state,Values=available \
  --query 'AvailabilityZones[].{Name:ZoneName,Id:ZoneId}' --output table
# Choose two STANDARD AZ names from that output in AWS_REGION.
AZ_A=us-east-1a
AZ_B=us-east-1b
CLIENT_CIDR="$(curl -fsS https://checkip.amazonaws.com)/32"
plan_stack "$AWS_LAB_PREFIX-foundation" "$LAB_EXAMPLES/foundation.json" \
  "AzA=$AZ_A" "AzB=$AZ_B" "ClientCidr=$CLIENT_CIDR"
# Review/apply loop above, then:
load_foundation
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID"
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID"
```

**Verify:** public routes→IGW; private routes→NAT plus S3 endpoint; DB routes have no default internet path. SG chain permits ALB→8080→task→5432→DB. **Failure:** overlapping CIDR, unsupported AZ, EIP quota, changing client public IP. Update ClientCidr via the same template if your address changes. **Cost:** NAT/public IPv4 start billing now even idle; ECR charges stored images later. **Cleanup:** final teardown, after dependent stacks. **Production:** single NAT is an explicit AZ dependency; use resilient egress and appropriately scoped outbound controls before promotion.

## 4 — Run and inspect the local API

**Objective:** establish a known-good process before cloud debugging. **Prerequisite:** Python 3; no AWS needed. **Architecture/services:** local HTTP only.

```bash
python3 examples/api.py
# In a second terminal:
curl -fsS http://localhost:8080/healthz
curl -i http://localhost:8080/db
curl -i http://localhost:8080/missing
```

**Expected/verify:** health 200, unconfigured DB 503, unknown route 404; stdout emits JSON with request ID, route, status and duration without query strings. Ctrl-C stops it. **Failure:** port 8080 occupied; use `PORT=8081` and matching URL. **Cost/cleanup:** local resources only; stop the process. **Production:** distinguish process liveness from dependency readiness; replace the teaching HTTP server with a hardened authenticated backend before public use.

## 5 — Build once and publish to ECR

**Objective/architecture:** source→Docker→private ECR digest. **Prerequisite:** stage 3 and Docker daemon. **Services:** ECR; build network retrieves public dependencies.

```bash
load_foundation
TAG="lab-$(date -u +%Y%m%dT%H%M%SZ)"
REGISTRY=${REPOSITORY_URI%%/*}
aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"
docker buildx build --platform linux/amd64 --load -t "$REPOSITORY_URI:$TAG" examples
# Run locally, verify /healthz in a second terminal, then Ctrl-C:
docker run --rm --read-only -p 127.0.0.1:8080:8080 "$REPOSITORY_URI:$TAG"
docker push "$REPOSITORY_URI:$TAG"
DIGEST=$(aws ecr describe-images --repository-name "$REPOSITORY" --image-ids "imageTag=$TAG" \
  --query 'imageDetails[0].imageDigest' --output text)
IMAGE_URI="$REPOSITORY_URI@$DIGEST"
aws ecr describe-image-scan-findings --repository-name "$REPOSITORY" --image-id "imageDigest=$DIGEST"
```

**Verify:** digest exists, correct architecture, no unresolved unacceptable findings; scan may still be in progress. **Failure:** immutable tag reuse→new unique tag; `exec format error`→architecture; denied upload→human/CI permissions, not task permissions. **Cost:** registry storage/scans/transfer, local build. **Cleanup:** `docker logout "$REGISTRY"`; retain deployed digest until rollback window closes; final teardown removes lab registry intentionally. **Production:** lock base/dependencies and scan/rebuild regularly. Digest immutability does not imply vulnerability-free software.

## 6 — Deploy private Fargate behind an ALB

**Objective:** ECS desired state starts two task ENIs reachable only through ALB. **Prerequisite:** stages 3–5, `$IMAGE_URI`. **Services:** ECS/Fargate, ALB, IAM, CloudWatch.

```bash
plan_service
# Review/apply loop, then:
load_service
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
aws elbv2 describe-target-health --target-group-arn "$TARGET_GROUP_ARN"
curl -fsS "http://$ALB_DNS/healthz"
aws logs tail "$LOG_GROUP" --since 10m
```

**Verify:** two healthy targets, no task public IPs, 200 from your allowed address; `/db` still 503. **Failure:** examine ECS events/stopped reason; image pull needs ECR/S3 networking plus execution role. **Cost:** ALB + two small Fargate tasks + logs + existing NAT; idle bill continues. **Cleanup:** final service teardown. **Production:** HTTP is temporarily allowed only from your CIDR; stage 7 adds HTTPS before using credentials or meaningful data. Health checks cannot prove business correctness.

## 7 — Add DNS and HTTPS

**Objective/architecture:** owned hostname→Route 53→ACM/HTTPS ALB. **Prerequisite:** delegated Route 53 public hosted zone for your domain; stages 1–6. Domain registration and zone delegation are explicit prerequisites, not accomplished by merely creating a zone.

```bash
API_HOST=api.lab.example.com  # Replace with YOUR controlled hostname.
ZONE_ID=Z_REPLACE_ME         # Public zone containing API_HOST.
CERT_ARN=$(aws acm request-certificate --domain-name "$API_HOST" --validation-method DNS \
  --query CertificateArn --output text)
aws acm describe-certificate --certificate-arn "$CERT_ARN" \
  --query 'Certificate.DomainValidationOptions[].ResourceRecord'
```

ACM DNS records appear asynchronously. When the output is populated, put the returned **exact** CNAME in the authoritative zone:

```bash
aws acm describe-certificate --certificate-arn "$CERT_ARN" --output json |
  jq '{Changes:[.Certificate.DomainValidationOptions[].ResourceRecord |
    {Action:"UPSERT",ResourceRecordSet:{Name:.Name,Type:.Type,TTL:300,ResourceRecords:[{Value:.Value}]}}]}' \
  > /tmp/aws101-cert-dns.json
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch file:///tmp/aws101-cert-dns.json
aws acm wait certificate-validated --certificate-arn "$CERT_ARN"
plan_service
# Review/apply update loop. Then create the API alias:
ALB_ZONE=$(out "$AWS_LAB_PREFIX-service" AlbZoneId)
jq -n --arg name "$API_HOST" --arg dns "$ALB_DNS" --arg zone "$ALB_ZONE" \
 '{Changes:[{Action:"UPSERT",ResourceRecordSet:{Name:$name,Type:"A",AliasTarget:{HostedZoneId:$zone,DNSName:$dns,EvaluateTargetHealth:false}}}]}' \
 > /tmp/aws101-api-dns.json
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch file:///tmp/aws101-api-dns.json
curl -fsS "https://$API_HOST/healthz"
curl -I "http://$API_HOST/healthz"
```

**Verify:** HTTPS passes certificate validation; HTTP redirects; `dig` points to ALB. **Failure:** wrong ACM region, un-delegated zone, missing validation record, stale DNS or changed client CIDR. **Cost:** domain/hosted zone/DNS and ALB; verify certificate type/feature pricing rather than assuming all ACM certificates are free. **Cleanup:** remove only lab alias/validation records and unused lab cert in final teardown. **Production:** retain validation records for renewal; own DNS/certificate lifecycle in IaC. These CLI-created records are intentional learning exceptions, not CloudFormation-owned resources.

## 8 — Provision private PostgreSQL

**Objective:** persistent state with private addressing, encryption, snapshots and separate SQL identities. **Prerequisite:** stages 3–7. **Services:** RDS, Secrets Manager, ECS bootstrap.

```bash
aws rds describe-db-engine-versions --engine postgres --default-only \
  --query 'DBEngineVersions[].EngineVersion' --output text
PG_VERSION=REPLACE_WITH_SUPPORTED_VERSION
aws rds describe-orderable-db-instance-options --engine postgres --engine-version "$PG_VERSION" \
  --db-instance-class db.t4g.micro --query 'OrderableDBInstanceOptions[].{Class:DBInstanceClass,MultiAZ:MultiAZCapable}'
plan_stack "$AWS_LAB_PREFIX-data" "$LAB_EXAMPLES/data.json" \
  "DatabaseSubnets=$DB_SUBNETS" "DbSG=$DB_SG" \
  "ImageUri=$IMAGE_URI" "RepositoryArn=$REPOSITORY_ARN" "EngineVersion=$PG_VERSION" \
  MultiAZ=false ProtectDatabase=true
# Review/apply loop. Provisioning is slower than container startup.
DB_ID=$(out "$AWS_LAB_PREFIX-data" DbId)
DB_HOST=$(out "$AWS_LAB_PREFIX-data" DbHost)
DB_SECRET_ARN=$(out "$AWS_LAB_PREFIX-data" DbSecretArn)
INIT_TASK=$(out "$AWS_LAB_PREFIX-data" InitTask)
aws rds describe-db-instances --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[].{Status:DBInstanceStatus,Public:PubliclyAccessible,Encrypted:StorageEncrypted,BackupDays:BackupRetentionPeriod}'
```

Do not proceed if the selected version/class is unavailable; choose a supported class and update `data.json` deliberately. The template does not hard-code a soon-to-expire engine version.

**Verify:** available, not public, encrypted, backup retention 7 days, deletion protection true. **Failure:** quota, engine/class mismatch, subnet AZ coverage. **Cost:** DB compute/storage/backups and two secrets; Single-AZ is a learning shortcut. **Cleanup:** protected data-stack procedure below; never disable protection casually. **Production:** choose Multi-AZ against availability target; choose class/pool size by measurements, not this tiny lab default.

## 9 — Initialize least-privilege SQL and inject the app secret

**Objective:** administrative bootstrap is separate from API runtime. **Prerequisite:** stage 8. **Architecture:** one-off ECS task with admin secret→create marker/read-only SQL role; API gets only read credential.

```bash
NETWORK="awsvpcConfiguration={subnets=[$PRIVATE_SUBNETS],securityGroups=[$APP_SG],assignPublicIp=DISABLED}"
INIT_RESULT=$(aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE \
  --task-definition "$INIT_TASK" --network-configuration "$NETWORK")
printf '%s\n' "$INIT_RESULT" | jq '{failures, tasks: [.tasks[].taskArn]}'
INIT_ARN=$(printf '%s' "$INIT_RESULT" | jq -er '.tasks[0].taskArn')
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$INIT_ARN"
aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$INIT_ARN" \
  --query 'tasks[].{Reason:stoppedReason,Containers:containers[].{Name:name,Exit:exitCode,Reason:reason}}'
aws logs tail "$(out "$AWS_LAB_PREFIX-data" InitLogGroup)" --since 10m
# Proceed ONLY if initialization exited 0 and logged database_initialized:
plan_service
# Review/apply update loop, then:
curl -fsS "https://$API_HOST/db"
```

**Verify:** `{"ok":true,"marker":"restore-me"}`; no master secret in API definition; inspect role policy resource ARN without retrieving its value. **Failure:** execution role secret access, DB SG source, CA trust, SQL init not run. **Cost:** short extra task plus normal infrastructure. **Cleanup:** stopped task consumes no Fargate compute; retained log/secret data still exists. **Learned/production:** secret storage does not create SQL grants or rotate an application's password automatically. Injected secrets require task replacement after rotation. Restrict bootstrap-role use and replace manual SQL bootstrap with controlled migrations for real applications.

## 10 — Wire observability to a human

**Objective:** produce and receive an actionable alarm. **Prerequisite:** stage 6 (DB optional), monitored email. **Services:** CloudWatch, SNS.

```bash
ALERT_EMAIL=you@example.com  # Replace with your own address.
TOPIC_ARN=$(aws sns create-topic --name "$AWS_LAB_PREFIX-alerts" --query TopicArn --output text)
aws sns subscribe --topic-arn "$TOPIC_ARN" --protocol email --notification-endpoint "$ALERT_EMAIL"
# Confirm subscription through the email sent to you.
```

Edit the `CpuAlarm` resource in your **lab copy** of `service.json`: add `AlarmActions: ["your-topic-arn"]` and `OKActions: ["your-topic-arn"]` to Properties, using valid JSON (ARNs are not secrets); review/apply via `plan_service`. This keeps alarm ownership in IaC. Then test delivery without generating load:

```bash
CPU_ALARM=$(out "$AWS_LAB_PREFIX-service" CpuAlarm)
aws cloudwatch set-alarm-state --alarm-name "$CPU_ALARM" --state-value ALARM --state-reason 'Sandbox notification drill'
aws cloudwatch describe-alarms --alarm-names "$CPU_ALARM"
aws logs tail "$LOG_GROUP" --since 10m
```

CloudWatch evaluation subsequently determines the real state. Build a dashboard in the console with ALB target 5xx/latency/healthy targets, ECS CPU/memory and RDS connections/storage. Use the Logs Insights query in the operations reference. Add an external HTTPS probe for availability; infrastructure CPU is not an SLO.

**Verify:** email arrives, links to alarm/runbook; a known request appears in structured logs. **Failure:** pending SNS confirmation, missing action permission, no metric dimensions/data. **Cost:** alarms, metrics/logs, dashboard, notifications. **Cleanup:** delete topic/subscriptions after stack alarms are removed; log retention expires old events. **Production:** add traces via OpenTelemetry/ADOT, SLO burn alerts, cost/security routes and named responders; template alarms alone are incomplete monitoring.

## 11 — CI/CD without permanent AWS keys

**Objective:** GitHub OIDC→scoped role→immutable artifact→reviewed deployment. **Prerequisite:** stage 7, GitHub repository/environment you administer; [OIDC trust example](01-foundations.md#example-b-github-deploys-through-oidc). **Services:** IAM OIDC/STS, ECR, CloudFormation/ECS.

A complete build/scan → change-set → separately approved apply example is provided in [github-actions.yml.example](examples/github-actions.yml.example). It is an inactive example file; copy it to `.github/workflows/aws-lab.yml` only after the lab stacks and narrowly scoped roles exist. Configure `sandbox-plan` and `sandbox` environments, repository variables `AWS_REGION`, `AWS_ACCOUNT_ID`, `AWS_CERTIFICATE_ARN`, `AWS_PLAN_ROLE_ARN`, `AWS_APPLY_ROLE_ARN`, and `AWS_CFN_EXECUTION_ROLE_ARN`, and replace the two action SHA placeholders with reviewed full commit SHAs. Scope the plan role to artifact publishing/change-set creation (no execution), the apply role to reviewed stack execution/read-back, and the CloudFormation service role to the lab resource lifecycle. Protect both environment branch rules; require reviewer approval on `sandbox` after inspecting the exact change set. The hosted runner verifies target health via AWS APIs because the diagnostic API remains restricted to your client address; add an authorized external business probe before production promotion.

1. Create GitHub's OIDC provider in the sandbox account with audience `sts.amazonaws.com`. Create a deployment role using the exact repository/environment trust condition from the foundation guide.
2. Attach permissions for ECR push/pull on this repository; token retrieval requires `Resource: "*"`. Scope ECS service updates and `iam:PassRole` to the known task/execution roles. If deploying CloudFormation, use a constrained CloudFormation service role and stack-scoped orchestration rights; role creation/deployment privileges are not harmless merely because they pass through IaC.
3. Configure GitHub environment `sandbox` (or `production` for a separate account) with permitted branches and reviewer gate. Match the trust-policy environment name. Store account/region/role ARN/cluster/service as non-secret variables.
4. Use this **workflow fragment**, inside a job with checkout and an AWS CLI/Docker-equipped runner. Replace the action placeholder with a reviewed full commit SHA from [the official action](https://github.com/aws-actions/configure-aws-credentials). A placeholder deliberately cannot run unchanged:

```yaml
permissions:
  contents: read
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: sandbox
    steps:
      # Precede with checkout pinned to a reviewed full SHA.
      - uses: aws-actions/configure-aws-credentials@REVIEWED_FULL_COMMIT_SHA
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
          role-session-name: github-${{ github.run_id }}
      - run: aws sts get-caller-identity
      # Run local checks, build/scan/push once (lab 5), resolve digest.
      # Render task definition or create an IaC change set, review, deploy,
      # wait for service convergence, verify deployed digest and smoke-test HTTPS.
```

5. Implement build/push from stage 5 with a commit+run unique tag. Use the **same digest** for staging and production; do not rebuild per environment. Trigger a harmless release; record old/new task revisions. Reject untrusted PR/fork deployment jobs. Fail the job if image scanning or required smoke tests fail.
6. For this lab's CloudFormation-owned task/service, use the reviewed change-set flow for updates. Do not casually mix ad hoc ECS updates with IaC ownership. For real migrations: one controlled job, backwards-compatible expansion first, app rollout second, destructive contraction only after rollback window and backup validation.

**Verify:** CloudTrail shows an assumed role session; no permanent AWS key is stored in GitHub; unauthorized repository/environment token is denied; failed smoke test prevents promotion. **Common error:** `sub` branch subject versus environment subject mismatch. **Cost:** CI runner/build/image/temporary surge. **Cleanup:** remove role/provider only if dedicated and unused; revoke environment access. **Production:** the supplied workflow needs your scoped roles, action pins, protected environments and external business-health gate; pin dependencies, scope trust, and test rollback. [AWS OIDC documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html).

## 12 — Add private object storage

**Objective:** use S3 API semantics and short-lived authorized download capabilities. **Prerequisite:** the [focused S3/SQS track setup](#focused-s3-and-sqs-track); no earlier numbered lab is required. **Services:** S3, SQS created for the next stage.

```bash
plan_stack "$AWS_LAB_PREFIX-async" "$LAB_EXAMPLES/async.json"
# Review/apply loop, then:
BUCKET=$(out "$AWS_LAB_PREFIX-async" Bucket)
printf 'sandbox upload\n' > /tmp/aws101-object.txt
aws s3 cp /tmp/aws101-object.txt "s3://$BUCKET/invoices/example.txt"
aws s3api head-object --bucket "$BUCKET" --key invoices/example.txt
aws s3api get-public-access-block --bucket "$BUCKET"
# Use only synthetic data; URL is a temporary bearer credential—do not log/share it.
URL=$(aws s3 presign "s3://$BUCKET/invoices/example.txt" --expires-in 60)
curl -fsS "$URL"
unset URL
aws s3api list-object-versions --bucket "$BUCKET" --prefix invoices/
```

Repeat upload after editing the file; verify a second version. If you also completed stage 2, perform its constrained-role positive/negative test. Presigning does not override the signer's permissions. To integrate a real backend, grant its task role only the bucket/prefix actions it needs, authorize the customer/key in application code, then call the SDK's presigner; never put a permanent access key in the app. The starter API deliberately has no upload endpoint.

**Verify:** authorized URL works, anonymous access does not, object versions exist. **Failure:** wrong prefix ARN or missing KMS permission for a different SSE-KMS setup. **Cost:** versions/storage/requests/transfer; lifecycle only aborts abandoned multipart uploads in this lab. **Cleanup:** retain bucket until final review; versioned cleanup requires deleting every version/delete marker, not just `aws s3 rm --recursive`. **Production:** implement upload validation, ownership, lifecycle and recovery; static assets use CloudFront origin access control.

## 13 — Process a queue job and observe duplicate delivery

**Objective:** understand visibility, acknowledgment and poison-message isolation. **Prerequisite:** stage 12. **Architecture/services:** producer CLI→SQS→worker CLI, DLQ. This manual worker exposes the protocol before you build a background worker.

```bash
QUEUE_URL=$(out "$AWS_LAB_PREFIX-async" QueueUrl)
DLQ_URL=$(out "$AWS_LAB_PREFIX-async" DlqUrl)
aws sqs send-message --queue-url "$QUEUE_URL" --message-body '{"job_id":"lab-job-1","object":"invoices/example.txt"}'
aws sqs receive-message --queue-url "$QUEUE_URL" --wait-time-seconds 20 \
  --visibility-timeout 10 --max-number-of-messages 1 > /tmp/aws101-job.json
jq '.Messages[] | {MessageId,Body}' /tmp/aws101-job.json
# Deliberately DO NOT acknowledge. After at least 10 seconds, receive again:
aws sqs receive-message --queue-url "$QUEUE_URL" --wait-time-seconds 20 \
  --max-number-of-messages 1 > /tmp/aws101-job.json
# Acknowledge only after your synthetic side effect is complete:
RECEIPT=$(jq -er '.Messages[0].ReceiptHandle' /tmp/aws101-job.json)
aws sqs delete-message --queue-url "$QUEUE_URL" --receipt-handle "$RECEIPT"
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names ApproximateNumberOfMessages
```

If a receive returns no messages, retry after visibility expiry; don't delete with a stale/empty handle. Send `lab-poison-1`, repeatedly receive without deleting (respect visibility), then verify it arrives in the DLQ after the redrive threshold. Attach an alarm action to `DlqAlarm` through `async.json`, as in stage 10.

**Verify:** replayed job preserves business ID; new receipt handle; eventually empty source queue or isolated DLQ message. **Failure:** no wait for visibility, competing consumer, delayed approximate metrics. **Cost:** API requests (including empty polls), worker compute when automated. **Cleanup:** delete only synthetic received work; final stack deletion removes queues. **Production:** build a worker that transactionally records the business idempotency key with its side effect, then acknowledges; a Python set in memory is insufficient. Scale on queue age/backlog within DB limits. Never redrive poison work blindly.

## 14 — Add cache connectivity, then justify cache behavior

**Objective:** distinguish encrypted/private cache transport from safe application caching. **Prerequisite:** stages 3–6; optional paid extension. **Services:** ElastiCache Serverless Valkey, ECS diagnostic task.

```bash
plan_stack "$AWS_LAB_PREFIX-cache" "$LAB_EXAMPLES/cache.json" \
  "VpcId=$VPC_ID" "AppSG=$APP_SG" "PrivateSubnets=$PRIVATE_SUBNETS"
# Review/apply loop:
CACHE_HOST=$(out "$AWS_LAB_PREFIX-cache" CacheHost)
jq -n --arg host "$CACHE_HOST" \
 '{containerOverrides:[{name:"api",command:["python","cache_probe.py"],environment:[{name:"CACHE_HOST",value:$host}]}]}' \
 > /tmp/aws101-cache-override.json
PROBE_ARN=$(aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE \
  --task-definition "$TASK_DEFINITION" --network-configuration "$NETWORK" \
  --overrides file:///tmp/aws101-cache-override.json --query 'tasks[0].taskArn' --output text)
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$PROBE_ARN"
aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$PROBE_ARN" --query 'tasks[].containers[].{Exit:exitCode,Reason:reason}'
aws logs tail "$LOG_GROUP" --since 10m
```

The short probe exits before its inherited container health check; a stopped task is the intended result. If `run-task` returns `None`, inspect its failures instead of waiting. For the next coding exercise, add cache-aside reads to your real backend with TTL/jitter, bounded value size, miss coalescing and a defined invalidation path; measure hit ratio and DB load before/after. The example performs only TLS PING and **does not claim caching performance improvements**.

**Verify:** exit 0 and `cache_tls_ping`; a laptop has no direct private cache path. **Failure:** SG/port/DNS/TLS or unavailable service region. **Cost:** serverless data storage/processing, minimum billable capacity and probe task; do not assume zero idle cost. **Cleanup:** delete cache stack after experiment. **Production:** this cache is network-isolated but has no RBAC user group—configure scoped users/IAM authentication before sensitive data; test cache loss and stampede behavior. [Serverless resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-elasticache-serverlesscache.html) · [IAM cache authentication](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/auth-iam.html).

## 15 — Add bounded autoscaling

**Objective:** separate desired-task scaling from database capacity. **Prerequisite:** stages 6 and 10, CloudFormation lab-copy editing. **Services:** Application Auto Scaling, ECS, CloudWatch.

Add these two entries inside `Resources` in your lab copy of `service.json` (JSON fragment; comma-separate from existing resources), then run `plan_service` and the review/apply loop:

```json
{
  "ScalingTarget": {
    "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
    "Properties": {
      "MinCapacity": 2,
      "MaxCapacity": 4,
      "ResourceId": {
        "Fn::Join": [
          "/",
          [
            "service",
            { "Ref": "Cluster" },
            { "Fn::GetAtt": ["Service", "Name"] }
          ]
        ]
      },
      "ScalableDimension": "ecs:service:DesiredCount",
      "ServiceNamespace": "ecs"
    }
  },
  "CpuScaling": {
    "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
    "Properties": {
      "PolicyName": "lab-cpu",
      "PolicyType": "TargetTrackingScaling",
      "ScalingTargetId": { "Ref": "ScalingTarget" },
      "TargetTrackingScalingPolicyConfiguration": {
        "TargetValue": 60,
        "ScaleOutCooldown": 60,
        "ScaleInCooldown": 120,
        "PredefinedMetricSpecification": {
          "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        }
      }
    }
  }
}
```

The threshold is a teaching value, not a sizing recommendation. Use your existing load tool against **only your sandbox**, with explicit maximum concurrency/duration; ramp and watch CPU, p95, task count and DB pool waits. This tiny health endpoint may not saturate CPU: lack of scaling is not proof of broken configuration. Inspect policy activity:

```bash
aws application-autoscaling describe-scaling-activities --service-namespace ecs \
  --resource-id "service/$CLUSTER/$SERVICE"
aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[].{Desired:desiredCount,Running:runningCount,Pending:pendingCount}'
```

**Verify:** policy exists; under a measured qualifying workload count responds within limits; at rest converges safely. **Failure:** wrong metric/dimensions, insufficient Fargate/IP quota, scaling DB bottleneck instead. **Cost:** up to four steady tasks plus deployment surge. **Cleanup:** remove both resources through IaC; do not leave external scaling ownership behind. **Production:** avoid overwriting autoscaler's live desired count on each release; establish IaC/controller ownership. Budget pool connections for maximum tasks **and deployment overlap**.

## 16 — Inject failures in the sandbox

**Objective:** test replacement, release rollback and DB failover. **Prerequisite:** healthy service, no real traffic/data; save the current image with `GOOD_IMAGE_URI="$IMAGE_URI"`. **Services:** ECS, ALB, RDS.

1. Watch a low-rate HTTPS probe in a second terminal. Stop one task, not the service:

```bash
TASK_ARN=$(aws ecs list-tasks --cluster "$CLUSTER" --service-name "$SERVICE" --query 'taskArns[0]' --output text)
aws ecs stop-task --cluster "$CLUSTER" --task "$TASK_ARN" --reason 'Authorized sandbox replacement drill'
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
```

2. Record the good revision. Set `IMAGE_URI="$REPOSITORY_URI:does-not-exist"`, run `plan_service`, review/apply. Expect failure/rollback; inspect CloudFormation events and ECS rollout state. `services-stable` can mean **rolled back**—verify the running digest is the saved good digest. Restore `IMAGE_URI="$GOOD_IMAGE_URI"`; reconcile template state before any further change.
3. To test DB failover, change `MultiAZ=true` through the full data-stack plan from stage 8 (preserve all other parameters), review/apply, and verify `MultiAZ` became true. Then run `aws rds reboot-db-instance --db-instance-identifier "$DB_ID" --force-failover`. Watch `/db`, reconnect behavior, and actual outage time. Single-AZ cannot run this drill meaningfully.

**Verify:** replacement task/healthy targets, bad release not promoted, bounded temporary DB errors followed by recovery. **Failure:** no last healthy deployment, long startup, stale credentials/connections. **Cost:** surge capacity, Multi-AZ standby and normal infrastructure. **Cleanup:** restore healthy IaC configuration; explicitly choose whether to retain Multi-AZ until teardown. **Production:** this is not a full AZ-loss test; that also needs resilient egress and all dependencies. Use scoped failure-injection plans with stop conditions, not arbitrary production resource deletion.

## 17 — Restore and measure RTO/RPO

**Objective:** prove state recovery, not merely snapshot existence. **Prerequisite:** stage 9 marker, available backups/latest restore time. **Services:** RDS, ECS, S3 when included.

```bash
RESTORE_ID="$AWS_LAB_PREFIX-restore-$(date -u +%Y%m%d%H%M)"
DB_SUBNET_GROUP=$(out "$AWS_LAB_PREFIX-data" DbSubnetGroup)
aws rds describe-db-instances --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[].{Latest:LatestRestorableTime,Status:DBInstanceStatus}'
# Record start time and expected last durable marker before issuing restore.
aws rds restore-db-instance-to-point-in-time --source-db-instance-identifier "$DB_ID" \
  --target-db-instance-identifier "$RESTORE_ID" --use-latest-restorable-time \
  --db-subnet-group-name "$DB_SUBNET_GROUP" --vpc-security-group-ids "$DB_SG" \
  --no-publicly-accessible
aws rds wait db-instance-available --db-instance-identifier "$RESTORE_ID"
RESTORE_HOST=$(aws rds describe-db-instances --db-instance-identifier "$RESTORE_ID" \
  --query 'DBInstances[0].Endpoint.Address' --output text)
```

Create a **separate validation service stack** using `service.json`, same image/SGs/subnets/cert and app secret, but `DbHost="$RESTORE_HOST"`. Supply all stage-6 parameters explicitly to `plan_stack "$AWS_LAB_PREFIX-restore-check" ...`; do not overwrite the live service. The app password is SQL data restored to that point: if it rotated since then, reconcile credentials through an authorized recovery procedure rather than resetting blindly. Use `curl --connect-to "$API_HOST:443:RESTORE_ALB_DNS:443" "https://$API_HOST/db"` with the validation stack's actual ALB DNS substituted; TLS still validates the original hostname.

The explicit restore-validation plan is:

```bash
plan_stack "$AWS_LAB_PREFIX-restore-check" "$LAB_EXAMPLES/service.json" \
  "VpcId=$VPC_ID" "PublicSubnets=$PUBLIC_SUBNETS" "PrivateSubnets=$PRIVATE_SUBNETS" \
  "AlbSG=$ALB_SG" "AppSG=$APP_SG" "ImageUri=$GOOD_IMAGE_URI" "RepositoryArn=$REPOSITORY_ARN" \
  "CertificateArn=$CERT_ARN" "DbHost=$RESTORE_HOST" "DbSecretArn=$DB_SECRET_ARN" DesiredCount=1
# Review/apply CREATE loop, then:
RESTORE_ALB_DNS=$(out "$AWS_LAB_PREFIX-restore-check" AlbDns)
curl --connect-to "$API_HOST:443:$RESTORE_ALB_DNS:443" -fsS "https://$API_HOST/db"
```

**Verify:** restored marker `restore-me` without running `db_init.py` (which could mask missing data), private SGs/TLS, elapsed restore+validation time, latest restored business timestamp. For S3, download a specific earlier version with `s3api get-object --version-id ...` to a disposable file and compare contents. **Failure:** no available restore point, incompatible settings, lost KMS permissions, rotated password mismatch. **Cost:** a second DB and temporary ALB/tasks plus backup storage. **Cleanup:** delete validation service, then restored DB with deliberate final-snapshot decision; it is outside the main data stack. **Production:** successful marker recovery is only a first drill—test production-sized data, cross-account/region permissions, artifacts, secrets, DNS cutover, fencing old writers and failback. [RDS PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html).

## 18 — Review, explain, then tear down

**Objective:** decide whether evidence supports production. **Prerequisite:** completed core labs and optional extensions relevant to your design. **Services:** all selected services.

1. Complete [production readiness and security gates](03-operations-and-reference.md#review-gates). Record any unmet gate and owner; do not equate completed tutorial with production approval.
2. Draw one request, one async job, one credential exchange and one restore. Identify every account/AZ/permission/network/storage boundary and billing unit.
3. Explain the remaining gaps: diagnostic HTTP server, no app auth, single-NAT dependency, notification coverage, optional cache auth, manual app-secret rotation, unpinned build inputs, and incomplete CI/application upload/worker integration.
4. Review Cost Explorer after billing data catches up; compare estimated and actual service/usage-type costs. Save only non-secret outputs, evidence and architecture decisions.
5. Execute the teardown below when the sandbox is no longer needed; record retained resources with owners/expiry.

**Verify:** another engineer can follow your runbook and restore without your memory. **Failure:** undocumented credentials/state or unknown retained spend. **Cost:** review itself is mostly read-only; underlying resources continue billing until removed. **Cleanup:** explicit dependency order below. **Production:** implement the unresolved gates in your real application before accepting real users/data.

## Teardown: deliberate, dependent, and complete

These commands are **destructive**. Run only against the dedicated lab after accepting deletion and saving any desired evidence. Assert account identity first. Capture bucket, repository, secret, snapshot and restore IDs **before deleting stack outputs**.

1. Remove temporary restore-check service and any remaining diagnostic tasks. Delete the optional cache stack and wait. CloudFormation-owned scaling/alarms are deleted with service/async stacks. Delete the main service stack and wait:

```bash
aws cloudformation delete-stack --stack-name "$AWS_LAB_PREFIX-service"
aws cloudformation wait stack-delete-complete --stack-name "$AWS_LAB_PREFIX-service"
```

2. For the data stack, repeat the full stage-8 plan preserving the current engine/MultiAZ values with `ProtectDatabase=false`; review/apply. Then `delete-stack`/`wait stack-delete-complete` for `$AWS_LAB_PREFIX-data`. Its `DeletionPolicy: Snapshot` preserves a billable final snapshot; the app secret is retained. Inventory and deliberately delete retained artifacts only after deciding recovery is no longer needed. A separate PITR restore DB needs separate deletion; inspect its deletion protection first. Do not casually use `--skip-final-snapshot`.
3. Delete `$AWS_LAB_PREFIX-async` and wait (synthetic queue work is lost). Its bucket is retained, including versions. List versions/delete markers with pagination; use S3 console **Empty** only on the confirmed disposable lab bucket, then delete it. This is safer than a copy-pasted all-buckets deletion script. Remove any test IAM policy referring to it.
4. Delete `$AWS_LAB_PREFIX-foundation` and wait after all dependent ENIs/DB/cache resources are gone. NAT and EIP are removed; ECR is retained. List/delete only the dedicated lab images, then delete the empty repository. Failed VPC deletion usually means a remaining dependent interface/resource; investigate instead of force-deleting unrelated items.
5. Remove lab Route 53 records using the exact earlier record sets with `Action: "DELETE"`, then unused ACM certificate. Do not delete shared zone/registration or other services' validation records. Delete lab SNS topic, temporary OIDC/test roles only if unused, and local Docker images if desired.
6. Inspect retained DB snapshots, secrets (schedule deletion with a recovery window), ECR, S3 versions, logs, manual alarms, public IPs/endpoints and restores. Check billing again later. Foundational organization/security controls remain enabled.

Each destructive action should have an explicit resource ID, account, reason and recoverability decision. For a production environment, replace this lab teardown with its authorized decommissioning runbook.
