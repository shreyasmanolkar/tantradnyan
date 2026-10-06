# 00 — Getting started with AWS

[Guide index](README.md) · [Hands-on labs](04-hands-on-labs.md)

This short lab gives you a safe first loop with AWS: identify the account and role you are using, create a private S3 bucket, upload and download a sample object, inspect its settings, then remove the resources. It uses synthetic text only.

## You need

- An AWS sandbox account, or an account whose owner has explicitly authorized learning work.
- AWS CLI version 2 and Python 3.
- A role with permission to create and configure an S3 bucket and put, read, and delete objects. Ask the account administrator for an appropriate sandbox role if you do not have one.

Do not use the Organizations management account or a production account for practice. AWS resources may be billable even when idle. This exercise stores only a tiny text file, but requests and stored data can still incur charges. Budgets alert you; they do not cap spend. See [AWS Free Tier](https://aws.amazon.com/free/) and [S3 pricing](https://aws.amazon.com/s3/pricing/) for current terms.

## 1. Configure a profile and region

Use your organization's AWS IAM Identity Center login when available. It provides temporary credentials and avoids long-lived access keys.

```bash
aws configure sso --profile aws-lab
aws sso login --profile aws-lab
export AWS_PROFILE=aws-lab
export AWS_REGION=us-east-1  # Change to a Region enabled for your sandbox.
export AWS_PAGER=""
```

If your administrator already configured a profile, set `AWS_PROFILE` to that profile and use its approved login flow. Do not paste credentials into this guide, commit them, or put them in the example application.

Confirm the caller before creating anything:

```bash
aws sts get-caller-identity
printf 'AWS_REGION=%s\n' "$AWS_REGION"
```

Check that the account ID is your sandbox and the ARN is your expected federated or assumed role. If either is unexpected, stop and select the correct profile. `get-caller-identity` is a read-only STS request and is useful when debugging “wrong account” mistakes.

## 2. Create a private bucket and inspect it

Run this block in Bash. Keep the printed bucket name; you will need it to clean up if you close the terminal before the last step.

```bash
set -euo pipefail

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
RUN_ID=$(python3 -c 'import uuid; print(uuid.uuid4().hex[:12])')
BUCKET="aws-learning-${ACCOUNT_ID}-${RUN_ID}"
printf 'Lab bucket: %s\n' "$BUCKET"

aws s3 mb "s3://$BUCKET" --region "$AWS_REGION"
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api get-public-access-block --bucket "$BUCKET"
aws s3api get-bucket-encryption --bucket "$BUCKET"
```

S3 bucket names share a global namespace, so creation can fail if the generated name is already taken. Run the block again to generate another name. The bucket remains private; this lab does not enable website hosting or anonymous access.

## 3. Upload, inspect, and download an object

```bash
LOCAL_DIR=$(mktemp -d)
printf 'Hello from my AWS learning lab.\n' > "$LOCAL_DIR/hello.txt"

aws s3 cp "$LOCAL_DIR/hello.txt" "s3://$BUCKET/notes/hello.txt"
aws s3api head-object --bucket "$BUCKET" --key notes/hello.txt \
  --query '{Size:ContentLength,Type:ContentType,Encryption:ServerSideEncryption}'
aws s3 cp "s3://$BUCKET/notes/hello.txt" "$LOCAL_DIR/downloaded.txt"
diff "$LOCAL_DIR/hello.txt" "$LOCAL_DIR/downloaded.txt"
```

The upload and download travel through authenticated S3 APIs. `head-object` reads object metadata without downloading the body. The explicit encryption setting uses S3-managed keys; other workloads may require customer-managed KMS keys and their extra access and cost considerations.

## 4. Clean up

Delete the sample object first, then remove the empty bucket. This bucket name was generated for this lab; check the value of `BUCKET` before running the commands.

```bash
printf 'Cleaning up s3://%s\n' "$BUCKET"
aws s3 rm "s3://$BUCKET" --recursive
aws s3 rb "s3://$BUCKET" --region "$AWS_REGION"
if [[ -n ${LOCAL_DIR:-} && -d $LOCAL_DIR ]]; then rmdir "$LOCAL_DIR"; fi
```

If you closed the original terminal, set `AWS_PROFILE` and `AWS_REGION` again, assign `BUCKET` to the exact bucket name printed during creation, and repeat the cleanup commands. Do not delete an unfamiliar bucket. If bucket deletion reports that it is not empty, inspect its contents and remove only the objects created for this exercise.

## What you learned

An AWS CLI command is an authenticated API call made by the current identity against a resource in a Region. IAM decides whether it is allowed; bucket settings and policies govern access; S3 stores the object independently from your local file. You can now continue with [AWS foundations](01-foundations.md), or go straight to the [standalone S3 and SQS track](04-hands-on-labs.md#focused-s3-and-sqs-track). The larger container path starts at [full container track setup](04-hands-on-labs.md#full-container-track-setup-and-change-loop) and has substantially higher cost and permission requirements.
