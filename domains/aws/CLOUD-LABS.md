# AWS cloud workbook: predict, observe, break, recover

[Master guide](GUIDE.md) · [Local models](aws-service-lab/README.md) · [Original deployment labs](service-lifecycle/04-hands-on-labs.md) · [Record template](experiments/TEMPLATE.md)

This workbook adds real-service comparisons to the local models. It describes commands for your authorized sandbox; **these cloud experiments have not been executed as part of writing the curriculum**. Local checks establish neither cloud permissions nor deployment success. Every exercise separates expected from actual results.

## 0. Setup, command scope, and evidence

Run the cloud workbook from this repository's root by first changing directory:

```bash
cd domains/aws/service-lifecycle
export AWS_PROFILE=aws-lab AWS_REGION=us-east-1 AWS_PAGER=""
export AWS_LAB_PREFIX=aws101
source examples/lab.sh
aws sso login --profile "$AWS_PROFILE"
aws sts get-caller-identity
export EXPECTED_ACCOUNT=111122223333  # Replace with your authorized sandbox account.
test "$(aws sts get-caller-identity --query Account --output text)" = "$EXPECTED_ACCOUNT" || exit 1
RUN_DIR=$(mktemp -d)
RUN_ID=$(python3 -c 'import uuid; print(uuid.uuid4().hex[:12])')
```

Use AWS CLI v2, Bash, Python 3, jq and the permissions required for the selected lab. Region/account IDs above are examples. Preserve non-secret resource identifiers, profile/region, source revision, exact commands, UTC timestamps, output/errors and cleanup evidence in your own run record. Do not store access keys, session tokens, presigned URLs or real customer data in Git.

Before any provisioning or cleanup, recheck caller identity and the exact owned target. `plan_stack` creates a change set; it does not apply it. Reuse the original [review/apply loop](service-lifecycle/04-hands-on-labs.md#full-container-track-setup-and-change-loop) and each lab's budget/cleanup instructions. A later plan changes `CHANGE_SET`; review the actual ARN you execute.

| Exercise | Resources | Cost dimensions | Cleanup scope |
| --- | --- | --- | --- |
| A — Policy request matrix | Policy simulation API; no new infrastructure | Any enabled analysis features are separate; check selected API/service terms | Temporary local policy files |
| B — S3 concurrency/versioning | Existing disposable versioned lab bucket | Requests, stored current/noncurrent versions | Only this run's key/version IDs; original bucket teardown separately |
| C — Queue redelivery | Existing disposable SQS/DLQ | Requests, retained work | This run's deliveries; original queue stack teardown separately |
| D/E — Conditional DB and Lambda | One new table, function, IAM role and log group | On-demand DB operations/storage, invocations/runtime, log ingestion/storage | New conditional-lab stack, including disposable data/logs |
| F — Operated container recovery | Existing cumulative ECS/RDS lab | Tasks, ALB, NAT, DB, logs, retained backups/storage | Original dependent teardown and retained-artifact inventory |
| G/H — Fanout, routing, replay | New SNS/SQS, EventBridge and one-shard Kinesis stack | Publish/delivery requests, retained messages, provisioned shard while idle, records, KMS | Entire disposable events stack after both exercises |

No numeric price or “free” assumption is built into these exercises. Quote your intended region and account terms before provisioning. Local models remain usable without these resources.

## A. IAM: construct a request matrix before changing permissions

**Question:** is a failure implicit denial, explicit denial, an unmet condition, or a different boundary?

**Prerequisite:** permission to call `iam:SimulateCustomPolicy`. The simulator does not execute S3 requests. It has documented limitations and cannot establish all resource-policy/cross-account/runtime behavior. [IAM policy simulator](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_testing-policies.html).

1. Predict the following decisions: read `invoices/demo.txt`; read `other/demo.txt`; delete `invoices/demo.txt`; read `invoices/private/demo.txt`.
2. Save this synthetic identity policy:

```bash
cat > "$RUN_DIR/policy.json" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect":"Allow","Action":"s3:GetObject","Resource":"arn:aws:s3:::example-learning-bucket/invoices/*"},
    {"Effect":"Deny","Action":"s3:*","Resource":"arn:aws:s3:::example-learning-bucket/invoices/private/*"}
  ]
}
JSON
aws iam simulate-custom-policy \
  --policy-input-list "file://$RUN_DIR/policy.json" \
  --action-names s3:GetObject s3:DeleteObject \
  --resource-arns \
    arn:aws:s3:::example-learning-bucket/invoices/demo.txt \
    arn:aws:s3:::example-learning-bucket/other/demo.txt \
    arn:aws:s3:::example-learning-bucket/invoices/private/demo.txt \
  --query 'EvaluationResults[].{Action:EvalActionName,Resource:EvalResourceName,Decision:EvalDecision}'
```

**Expected:** GetObject on the first prefix is allowed, other prefix is implicitly denied, and private prefix is explicitly denied; DeleteObject has no allow except that the private deny also applies. Record actual decisions rather than checking only the first output row.

**Break/repair:** add a broad allow and predict which explicit denial remains. Add a `StringEquals` condition on a synthetic principal tag and provide/omit its context through the simulator's `--context-entries` option. Explain why simulation with fabricated context is not evidence about a real session's tags.

**Transfer:** original lab 2 later tests allowed/denied S3 requests using a genuinely constrained role. An administrator's success does not test that boundary. Distinguish trust, identity policy, bucket policy, organization restrictions and KMS access.

**Exercises:** design read access for exactly one tenant prefix; include ListBucket's bucket ARN and prefix condition separately. State which policy owns an invariant that must survive a future broad grant.

## B. S3: observe create-only, stale-write rejection and retained versions

**Prerequisite:** original lab 12 has created the disposable `aws101-async` stack and its private versioned bucket. Use its `Bucket` output; this exercise does not enable public access. Selected identity needs the exact put/get/version/list/delete permissions. Confirm versioning configuration and service readiness before writing.

```bash
BUCKET=$(out "$AWS_LAB_PREFIX-async" Bucket)
test -n "$BUCKET" && test "$BUCKET" != None || exit 1
test "$(aws s3api get-bucket-versioning --bucket "$BUCKET" --query Status --output text)" = Enabled || exit 1
KEY="workbook/$RUN_ID/report.txt"
printf 'version one\n' > "$RUN_DIR/one.txt"
printf 'version two\n' > "$RUN_DIR/two.txt"
aws s3api put-object --bucket "$BUCKET" --key "$KEY" \
  --body "$RUN_DIR/one.txt" --if-none-match '*' > "$RUN_DIR/put-one.json"
V1=$(jq -r .VersionId "$RUN_DIR/put-one.json")
TOKEN1=$(aws s3api head-object --bucket "$BUCKET" --key "$KEY" --query ETag --output text)
```

**Predict:** repeating create-only while that current object exists must fail its precondition, rather than create another version. Run the expected-failure command separately so the failure is observable:

```bash
if aws s3api put-object --bucket "$BUCKET" --key "$KEY" \
  --body "$RUN_DIR/two.txt" --if-none-match '*'; then
  printf 'Unexpected success: inspect this key and retain the trace.\n'
  exit 1
fi
```

Verify the error is `PreconditionFailed`; AccessDenied, wrong bucket, unsupported CLI option or connectivity failure are **different observations** and do not validate concurrency behavior.

Now conditionally update using the current token, then repeat using the stale token:

```bash
aws s3api put-object --bucket "$BUCKET" --key "$KEY" \
  --body "$RUN_DIR/two.txt" --if-match "$TOKEN1" > "$RUN_DIR/put-two.json"
V2=$(jq -r .VersionId "$RUN_DIR/put-two.json")
if aws s3api put-object --bucket "$BUCKET" --key "$KEY" \
  --body "$RUN_DIR/one.txt" --if-match "$TOKEN1"; then
  printf 'Unexpected stale-write success: retain both responses.\n'
  exit 1
fi
aws s3api list-object-versions --bucket "$BUCKET" --prefix "$KEY"
```

**Expected:** first match succeeds and returns a new version; stale match fails its precondition. Concurrent deletes can produce other documented conflict/not-found outcomes; this sequential fixture isolates the stale-token case. [Conditional-write contract](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html).

Delete the current view, then retrieve the old exact version:

```bash
aws s3api delete-object --bucket "$BUCKET" --key "$KEY" > "$RUN_DIR/delete-marker.json"
MARKER=$(jq -r .VersionId "$RUN_DIR/delete-marker.json")
aws s3api get-object --bucket "$BUCKET" --key "$KEY" \
  --version-id "$V1" "$RUN_DIR/recovered.txt"
diff "$RUN_DIR/one.txt" "$RUN_DIR/recovered.txt"
aws s3api list-object-versions --bucket "$BUCKET" --prefix "$KEY"
```

**Observe:** current object absence and recoverable noncurrent bytes are different states. A normal delete is not a complete storage cleanup.

**Cleanup:** inspect the exact key and version IDs recorded above, recheck sandbox identity, then remove only these tutorial versions and marker:

```bash
test "$(aws sts get-caller-identity --query Account --output text)" = "$EXPECTED_ACCOUNT" || exit 1
aws s3api delete-object --bucket "$BUCKET" --key "$KEY" --version-id "$V1"
aws s3api delete-object --bucket "$BUCKET" --key "$KEY" --version-id "$V2"
aws s3api delete-object --bucket "$BUCKET" --key "$KEY" --version-id "$MARKER"
aws s3api list-object-versions --bucket "$BUCKET" --prefix "$KEY"
```

Do the original bucket/stack teardown separately; its bucket is retained. **Exercise:** two clients edit the same manifest—decide whether to reject, rebase or create a conflict version after a 412. A fresh ETag alone does not choose application semantics.

## C. SQS: deliberately redeliver one job

**Prerequisite:** the original async lab stack; an otherwise idle disposable queue; send/receive/change-visibility/delete/get-attributes permissions. Do not run this against a shared production queue.

```bash
QUEUE_URL=$(out "$AWS_LAB_PREFIX-async" QueueUrl)
DLQ_URL=$(out "$AWS_LAB_PREFIX-async" DlqUrl)
JOB_ID="job-$RUN_ID"
jq -nc --arg id "$JOB_ID" '{id:$id,kind:"synthetic-demo"}' > "$RUN_DIR/job.json"
aws sqs send-message --queue-url "$QUEUE_URL" --message-body "file://$RUN_DIR/job.json"
aws sqs receive-message --queue-url "$QUEUE_URL" --max-number-of-messages 1 \
  --wait-time-seconds 5 --message-system-attribute-names ApproximateReceiveCount \
  > "$RUN_DIR/receive-one.json"
```

An empty receive is possible; inspect and repeat a bounded receive if necessary. Verify the body belongs to this run before manipulating it:

```bash
test "$(jq -r '.Messages[0].Body | fromjson | .id' "$RUN_DIR/receive-one.json")" = "$JOB_ID" || exit 1
RECEIPT1=$(jq -r '.Messages[0].ReceiptHandle' "$RUN_DIR/receive-one.json")
aws sqs change-message-visibility --queue-url "$QUEUE_URL" \
  --receipt-handle "$RECEIPT1" --visibility-timeout 0
aws sqs receive-message --queue-url "$QUEUE_URL" --max-number-of-messages 1 \
  --wait-time-seconds 5 --message-system-attribute-names ApproximateReceiveCount \
  > "$RUN_DIR/receive-two.json"
```

Again inspect any empty result, then verify the same business ID and compare delivery metadata:

```bash
test "$(jq -r '.Messages[0].Body | fromjson | .id' "$RUN_DIR/receive-two.json")" = "$JOB_ID" || exit 1
jq '.Messages[] | {MessageId,ReceiptHandle,Attributes,Body}' "$RUN_DIR/receive-one.json" "$RUN_DIR/receive-two.json"
RECEIPT2=$(jq -r '.Messages[0].ReceiptHandle' "$RUN_DIR/receive-two.json")
```

**Expected:** the business job is delivered again with a new receipt handle and an increased approximate receive count. The application effect must deduplicate on `JOB_ID`, not the receipt handle. An older-handle delete is deliberately not used as a correctness assertion: AWS documents that it can return success without the expected deletion. [DeleteMessage](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessage.html).

**Break/repair:** run the stage-11 ledger with this ID/amount twice; compare the receipt-based total to a naive increment. Extend stage 12's visibility during a modeled long task. For actual poison work, read the queue's configured `RedrivePolicy`, use a separate synthetic ID and original lab 13's DLQ procedure; record approximate counts and eventual movement rather than inventing an exact timing guarantee.

**Cleanup:** delete this delivery with its latest handle, then inspect queue/DLQ state:

```bash
aws sqs delete-message --queue-url "$QUEUE_URL" --receipt-handle "$RECEIPT2"
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible RedrivePolicy
```

Approximate counters are not immediate proof of emptiness. Finish the original async teardown when done. **Exercise:** choose a visibility interval, extension policy, idempotency retention and poison-work classification for a ten-minute job.

## D. DynamoDB: race a conditional update

**Prerequisite:** provisioning permissions for DynamoDB, Lambda, IAM role creation/passing and CloudWatch Logs. The new template creates one disposable table, a function, its role and one-day log group. No public API, event source or scheduled invocation is provisioned. The table and logs use Delete policies; this is synthetic, disposable data.

First render locally, then inspect the template and plan:

```bash
python3 ../aws-service-lab/cloud/build_template.py
python3 -m json.tool ../aws-service-lab/cloud/serverless.json > "$RUN_DIR/serverless-expanded.json"
# If installed, also run: cfn-lint ../aws-service-lab/cloud/serverless.json
LAB_SERVERLESS_STACK="$AWS_LAB_PREFIX-conditional"
plan_stack "$LAB_SERVERLESS_STACK" ../aws-service-lab/cloud/serverless.json
```

Review the exact change set, IAM grants, table/log deletion behavior, intended region, runtime availability and pricing. The role grants only PutItem/GetItem on this table and log writes to this function's group. It is intentionally narrower than the provisioning identity. Run the original reviewed apply loop only after accepting that concrete change set; check stack events on failure.

```bash
TABLE=$(out "$LAB_SERVERLESS_STACK" TableName)
FUNCTION=$(out "$LAB_SERVERLESS_STACK" FunctionName)
FUNCTION_LOGS=$(out "$LAB_SERVERLESS_STACK" LogGroup)
aws dynamodb describe-table --table-name "$TABLE"
COUNTER_ID="counter-$RUN_ID"
jq -nc --arg id "$COUNTER_ID" '{PK:{S:$id},n:{N:"0"},version:{N:"0"}}' > "$RUN_DIR/counter.json"
jq -nc --arg id "$COUNTER_ID" '{PK:{S:$id}}' > "$RUN_DIR/counter-key.json"
aws dynamodb put-item --table-name "$TABLE" --item "file://$RUN_DIR/counter.json" \
  --condition-expression 'attribute_not_exists(PK)'
```

Two writers both observe version 0. Execute the first update, then attempt the same expected version again:

```bash
aws dynamodb update-item --table-name "$TABLE" --key "file://$RUN_DIR/counter-key.json" \
  --update-expression 'SET #n = #n + :one, #v = #v + :one' \
  --condition-expression '#v = :expected' \
  --expression-attribute-names '{"#n":"n","#v":"version"}' \
  --expression-attribute-values '{":one":{"N":"1"},":expected":{"N":"0"}}' \
  --return-values ALL_NEW
if aws dynamodb update-item --table-name "$TABLE" --key "file://$RUN_DIR/counter-key.json" \
  --update-expression 'SET #n = #n + :one, #v = #v + :one' \
  --condition-expression '#v = :expected' \
  --expression-attribute-names '{"#n":"n","#v":"version"}' \
  --expression-attribute-values '{":one":{"N":"1"},":expected":{"N":"0"}}'; then
  printf 'Unexpected stale-version success: retain the trace.\n'
  exit 1
fi
aws dynamodb get-item --table-name "$TABLE" --key "file://$RUN_DIR/counter-key.json" --consistent-read
```

**Expected:** first update produces `n=1, version=1`; second is `ConditionalCheckFailedException`; strong GetItem returns the accepted item. Permission/throttle errors do not validate the predicate. An eventually consistent read may happen to be fresh; failure to observe a stale read does not disprove the documented eventual-read model. [Condition expressions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html).

**Exercises:** reject stale edits versus re-read/recompute; express a stock decrement with a nonnegative guard; design a transactional receipt plus effect when they are different items. No load test is required to demonstrate this race. Keep the stack for E, then use the cleanup below.

## E. Lambda: lose the outcome after the durable effect

Read [handler.py](aws-service-lab/cloud/handler.py). A conditional PutItem stores one synthetic value/hash. The **entire effect is that one item**; no email/payment/external side effect occurs. A repeated ID/value is duplicate; changed value under that ID is rejected. The injection flag raises only after the first successful durable write.

The inline template uses `python3.13` and its runtime SDK; check the current [Lambda runtime contract](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) before deployment. A real release should package/pin its dependencies. This lab is deliberately inspectable inline code.

```bash
LAMBDA_JOB_ID="lambda-$RUN_ID"
jq -nc --arg id "$LAMBDA_JOB_ID" '{id:$id,value:"synthetic-value",fail_after_write:true}' > "$RUN_DIR/invoke.json"
aws lambda invoke --function-name "$FUNCTION" --invocation-type RequestResponse \
  --cli-binary-format raw-in-base64-out --payload "file://$RUN_DIR/invoke.json" \
  "$RUN_DIR/first-result.json" > "$RUN_DIR/first-metadata.json"
cat "$RUN_DIR/first-metadata.json" "$RUN_DIR/first-result.json"
```

**Predict/observe:** API metadata can have a successful StatusCode and `FunctionError`; the body describes the injected function failure. The invocation API did not roll back the earlier DynamoDB write. Read the item by the same ID using a strong GetItem.

Retry the same event:

```bash
aws lambda invoke --function-name "$FUNCTION" --invocation-type RequestResponse \
  --cli-binary-format raw-in-base64-out --payload "file://$RUN_DIR/invoke.json" \
  "$RUN_DIR/retry-result.json" > "$RUN_DIR/retry-metadata.json"
cat "$RUN_DIR/retry-metadata.json" "$RUN_DIR/retry-result.json"
aws logs tail "$FUNCTION_LOGS" --since 10m --format short
```

**Expected:** retry returns `status=duplicate`, no new record; logs contain request ID and whether a record was created. Change `value` while keeping the ID: expect a function error for mismatched content. That prevents a retry ID from silently absorbing different intent.

**Async extension:** invoke a **new** ID with `--invocation-type Event` and the same injection flag. Submission accepts queued work; later execution/retries are separate. Inspect the item and logs using bounded retries while allowing for log delivery. Do not infer completion from a 202 response. Review configured retry age/destinations before deliberately testing repeated terminal failures. [Async error handling](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html).

**Limit:** one conditional item cannot atomically couple arbitrary external work with a receipt. If the effect becomes an email, two crash windows reappear unless the downstream protocol supplies idempotency or another recovery strategy. Separate that design from this narrower exercise.

### D/E cleanup

Confirm any intended asynchronous work has reached the observation you want, preserve non-secret run evidence, and inspect the stack's exact owned resources. These are disposable records/logs; deletion removes this evidence from AWS.

```bash
test "$(aws sts get-caller-identity --query Account --output text)" = "$EXPECTED_ACCOUNT" || exit 1
aws cloudformation list-stack-resources --stack-name "$LAB_SERVERLESS_STACK"
# After inspecting these exact sandbox resources:
aws cloudformation delete-stack --stack-name "$LAB_SERVERLESS_STACK"
aws cloudformation wait stack-delete-complete --stack-name "$LAB_SERVERLESS_STACK"
```

If deletion fails, inspect events and surviving resources. Do not broaden IAM blindly. Check console/inventory and eventual billing for residue; stack status alone is not a universal all-costs-zero guarantee.

## F. Make the existing 18 cloud labs an evidence sequence

Use the original [cumulative labs](service-lifecycle/04-hands-on-labs.md). Add this prediction/acceptance table to your run notes; it adds reasoning tasks to deployment commands rather than making template creation the learning outcome.

| Original stage | Predict and inspect | Failure exercise | Evidence required |
| --- | --- | --- | --- |
| 1–2 account/IAM | Exact principal, account, session and allowed resources | Wrong profile or denied synthetic prefix | Caller identity; allowed **and** denied observations |
| 3 network | Client/ALB/task/DB plus ECR/logs/secrets paths | One bounded sandbox path failure from original lab 16 | Route/SG/endpoint and failure boundary |
| 4–6 API/image/service | Digest, CPU/memory, listening port, readiness | Incorrect health path or invalid image/config through a reviewed update | Local response; task stopped reason; target health; actual revision |
| 7 DNS/TLS | Hostname, DNS answer, certificate names, response | Name mismatch in a controlled client request | Separate resolution, handshake and HTTP evidence |
| 8–9 SQL/secret | Restricted app login and initialization task | Bootstrap not executed; captured old credential after rotation exercise | Init exit; SELECT-only positive/negative checks; no secret values logged |
| 10 alarms | User symptom, measurement and notification recipient | Missing telemetry or disconnected notification | Actual received notification and usable runbook |
| 11 CI/CD | Exact reviewed change set and image digest | A failed new revision must not count old healthy tasks as success | Reviewed plan, revision match and endpoint acceptance |
| 12–14 storage/queue/cache | Versions, delivery IDs, cache consistency contract | Retained versions; redelivery; stale-fill interleaving | Raw state traces; connectivity separated from application correctness |
| 15–16 scaling/failure | Arrival/service rates, capacity bounds, shared dependencies | Worker/task loss under the original bounded procedure | Queue age/user outcomes; scaling events; surviving dependencies |
| 17 restore | Accepted marker/data and cutover criteria | Recover to a cut missing a later accepted operation | Restore contents; measured RTO/RPO with timestamps and units |
| 18 teardown | Dependency order and retained resources | Stack removed while billable data remains | Owned-resource inventory and deliberate retained-data disposition |

Write one rejected hypothesis, corrected explanation and next experiment after each failure. The local models help isolate the mechanism; the real run must supply its own evidence. Use synthetic data and the original sandbox constraints throughout.

## G. SNS and EventBridge: independent delivery and selective routing

**Question:** does consuming billing's copy remove audit's work, and what changes when an event pattern does not match?

**Prerequisite:** the setup in section 0; provisioning and application permissions for the selected SNS/SQS/EventBridge/Kinesis/KMS operations. The optional [events template](aws-service-lab/cloud/events.json) creates two encrypted SQS queues, SNS subscriptions with raw delivery, a custom EventBridge bus/rule, and an encrypted one-shard Kinesis stream for H. Its stream bills while idle; do G/H together and tear it down. This compact bundle favors an inspectable shared exercise over minimal cost for G alone; remove the stream/output before planning if you only want fanout practice.

```bash
LAB_EVENTS_STACK="$AWS_LAB_PREFIX-events"
plan_stack "$LAB_EVENTS_STACK" ../aws-service-lab/cloud/events.json
# Inspect and accept this specific plan, then use the original review/apply loop.
```

After successful provisioning, load owned outputs:

```bash
TOPIC=$(out "$LAB_EVENTS_STACK" TopicArn)
BILLING_QUEUE=$(out "$LAB_EVENTS_STACK" BillingQueueUrl)
AUDIT_QUEUE=$(out "$LAB_EVENTS_STACK" AuditQueueUrl)
BUS=$(out "$LAB_EVENTS_STACK" BusName)
STREAM=$(out "$LAB_EVENTS_STACK" StreamName)
jq -nc --arg id "fanout-$RUN_ID" '{id:$id,type:"OrderPaid"}' > "$RUN_DIR/fanout.json"
aws sns publish --topic-arn "$TOPIC" --message "file://$RUN_DIR/fanout.json"
```

Receive billing's copy and delete only this run's delivery after inspecting its business ID:

```bash
aws sqs receive-message --queue-url "$BILLING_QUEUE" --max-number-of-messages 1 \
  --wait-time-seconds 5 > "$RUN_DIR/billing.json"
test "$(jq -r '.Messages[0].Body | fromjson | .id' "$RUN_DIR/billing.json")" = "fanout-$RUN_ID" || exit 1
aws sqs delete-message --queue-url "$BILLING_QUEUE" \
  --receipt-handle "$(jq -r '.Messages[0].ReceiptHandle' "$RUN_DIR/billing.json")"
aws sqs receive-message --queue-url "$AUDIT_QUEUE" --max-number-of-messages 1 \
  --wait-time-seconds 5 > "$RUN_DIR/audit.json"
test "$(jq -r '.Messages[0].Body | fromjson | .id' "$RUN_DIR/audit.json")" = "fanout-$RUN_ID" || exit 1
jq '.Messages[0]' "$RUN_DIR/audit.json"
aws sqs delete-message --queue-url "$AUDIT_QUEUE" \
  --receipt-handle "$(jq -r '.Messages[0].ReceiptHandle' "$RUN_DIR/audit.json")"
```

An empty receive may require a bounded repeat before the ID check. **Expected:** audit retains its independent copy after billing has deleted its own. Raw delivery means Body is the original JSON message; default SNS delivery uses an envelope. Inspect that configuration before parsing. [SNS/SQS fanout](https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html).

Now route an event only to audit through the rule, using an EventBridge envelope rather than a raw SNS body:

```bash
jq -nc --arg bus "$BUS" --arg id "route-$RUN_ID" \
  '[{EventBusName:$bus,Source:"aws.learning",DetailType:"AssetReady",Detail:({id:$id}|tojson)}]' \
  > "$RUN_DIR/event-entries.json"
aws events put-events --entries "file://$RUN_DIR/event-entries.json" > "$RUN_DIR/put-events.json"
cat "$RUN_DIR/put-events.json"
test "$(jq -r .FailedEntryCount "$RUN_DIR/put-events.json")" = 0 || exit 1
aws sqs receive-message --queue-url "$AUDIT_QUEUE" --max-number-of-messages 1 \
  --wait-time-seconds 5 > "$RUN_DIR/routed.json"
test "$(jq -r '.Messages[0].Body | fromjson | .detail.id' "$RUN_DIR/routed.json")" = "route-$RUN_ID" || exit 1
aws sqs delete-message --queue-url "$AUDIT_QUEUE" \
  --receipt-handle "$(jq -r '.Messages[0].ReceiptHandle' "$RUN_DIR/routed.json")"
```

**Break:** change `DetailType` to `AssetIgnored` and submit a new ID. A successful PutEvents entry means acceptance, not that every rule matches or every target has completed delivery. Inspect the rule pattern and delivery metrics; one empty poll alone does not prove no delivery. Queue policies permit only the owned topic/rule to SendMessage; routing permission and target consumption remain different concerns. [EventBridge target resource policies](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-use-resource-based.html).

**Exercise:** add a subscriber filter and publish matching/nonmatching synthetic events; predict billing versus audit effects. Add a target DLQ before relying on recovery from sustained target failure. This teaching template has no configured EventBridge target DLQ or archive.

## H. Kinesis: same retained records, independent consumer positions

**Prerequisite:** the events stack from G; PutRecord/ListShards/GetShardIterator/GetRecords plus appropriate encryption permissions. Only synthetic records, one provisioned shard and short practice; quote idle shard and KMS usage before planning.

```bash
jq -nc --arg id "stream-$RUN_ID" '{id:$id,n:1}' > "$RUN_DIR/record-one.json"
jq -nc --arg id "stream-$RUN_ID" '{id:$id,n:2}' > "$RUN_DIR/record-two.json"
aws kinesis put-record --stream-name "$STREAM" --partition-key "customer-$RUN_ID" \
  --data "fileb://$RUN_DIR/record-one.json" > "$RUN_DIR/record-one-result.json"
SEQ1=$(jq -r .SequenceNumber "$RUN_DIR/record-one-result.json")
SHARD=$(jq -r .ShardId "$RUN_DIR/record-one-result.json")
aws kinesis put-record --stream-name "$STREAM" --partition-key "customer-$RUN_ID" \
  --sequence-number-for-ordering "$SEQ1" --data "fileb://$RUN_DIR/record-two.json"
ITERATOR=$(aws kinesis get-shard-iterator --stream-name "$STREAM" --shard-id "$SHARD" \
  --shard-iterator-type AT_SEQUENCE_NUMBER --starting-sequence-number "$SEQ1" \
  --query ShardIterator --output text)
aws kinesis get-records --shard-iterator "$ITERATOR" --limit 10 > "$RUN_DIR/records.json"
python3 - "$RUN_DIR/records.json" <<'PY'
import base64, json, sys
for record in json.load(open(sys.argv[1]))['Records']:
    print(record['SequenceNumber'], json.loads(base64.b64decode(record['Data'])))
PY
```

If the batch is empty or incomplete, advance with `NextShardIterator` and bounded polling; record observed sequence/arrival rather than assuming an immediate batch. Do not poll aggressively to “prove” throughput. Kinesis sequence identifiers are opaque strings with service ordering semantics, not the local model's zero-based integers. [PutRecord ordering](https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecord.html), [iterator semantics](https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetShardIterator.html).

**Replay:** create a new iterator at `SEQ1` for a second consumer and fetch again. The records were not deleted by the first consumer; each application needs its own progress/checkpoint. GetRecords supplies a continuation iterator, not a durable application checkpoint or business-effect transaction.

**Break locally:** stage 14 crashes between effect and checkpoint in both orders. In AWS, define a durable sink/receipt strategy before processing real side effects. Review retention, partition-key skew and resharding before expanding beyond this one-shard exercise.

**G/H cleanup:** preserve the run record, recheck sandbox identity, inspect resources and delete the exact disposable events stack. This removes its retained queue/stream data.

```bash
test "$(aws sts get-caller-identity --query Account --output text)" = "$EXPECTED_ACCOUNT" || exit 1
aws cloudformation list-stack-resources --stack-name "$LAB_EVENTS_STACK"
# After inspecting these exact sandbox resources:
aws cloudformation delete-stack --stack-name "$LAB_EVENTS_STACK"
aws cloudformation wait stack-delete-complete --stack-name "$LAB_EVENTS_STACK"
```

Verify owned queues/topic/subscriptions/rule/bus/stream are gone; inspect events if deletion fails. The AWS-managed key is managed by AWS, not a separately created customer key in this template.
