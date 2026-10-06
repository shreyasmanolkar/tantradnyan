# Source from the repository root: source examples/lab.sh
# Functions only; sourcing never creates, changes, or deletes AWS resources.
export AWS_PAGER=""
AWS_LAB_PREFIX=${AWS_LAB_PREFIX:-aws101}
LAB_EXAMPLES=examples

out() {
  aws cloudformation describe-stacks --stack-name "$1" \
    --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue | [0]" --output text
}

plan_stack() {
  local stack=$1 template=$2
  STACK=$stack
  export STACK
  unset CHANGE_SET
  shift 2
  local execution_role=() status change_type parameters change_name
  if [[ -n ${CFN_EXECUTION_ROLE_ARN:-} ]]; then execution_role=(--role-arn "$CFN_EXECUTION_ROLE_ARN"); fi
  if status=$(aws cloudformation describe-stacks --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text 2>&1); then
    case "$status" in
      REVIEW_IN_PROGRESS) change_type=CREATE ;;
      CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE) change_type=UPDATE ;;
      *) printf 'Stack is not ready for a new plan: %s\n' "$status" >&2; return 1 ;;
    esac
  elif [[ $status == *"does not exist"* ]]; then
    change_type=CREATE
  else
    printf '%s\n' "$status" >&2
    return 1
  fi
  parameters=$(python3 -c 'import json,sys; print(json.dumps([dict(zip(("ParameterKey","ParameterValue"), x.split("=",1))) for x in sys.argv[1:]]))' "$@") || return
  change_name="lab-$(python3 -c 'import uuid; print(uuid.uuid4())')"
  CHANGE_SET=$(aws cloudformation create-change-set --stack-name "$stack" \
    --template-body "file://$template" --change-set-name "$change_name" --change-set-type "$change_type" \
    --parameters "$parameters" --capabilities CAPABILITY_IAM "${execution_role[@]}" \
    --tags Key=Project,Value=aws-field-guide Key=Environment,Value=sandbox \
    --query Id --output text) || return
  export CHANGE_SET
  if ! aws cloudformation wait change-set-create-complete --change-set-name "$CHANGE_SET"; then
    aws cloudformation describe-change-set --change-set-name "$CHANGE_SET" --query '{Status:Status,Reason:StatusReason}'
    unset CHANGE_SET
    return 1
  fi
  aws cloudformation describe-change-set --change-set-name "$CHANGE_SET" \
    --query '{Status:Status,Reason:StatusReason,Changes:Changes[].ResourceChange.{Action:Action,Id:LogicalResourceId,Type:ResourceType,Replacement:Replacement}}'
  # The caller reviews and explicitly executes this exact ARN, never a "latest" lookup.
}

load_foundation() {
  VPC_ID=$(out "$AWS_LAB_PREFIX-foundation" Vpc)
  PUBLIC_SUBNETS=$(out "$AWS_LAB_PREFIX-foundation" PublicSubnets)
  PRIVATE_SUBNETS=$(out "$AWS_LAB_PREFIX-foundation" PrivateSubnets)
  DB_SUBNETS=$(out "$AWS_LAB_PREFIX-foundation" DatabaseSubnets)
  ALB_SG=$(out "$AWS_LAB_PREFIX-foundation" AlbSG)
  APP_SG=$(out "$AWS_LAB_PREFIX-foundation" AppSG)
  DB_SG=$(out "$AWS_LAB_PREFIX-foundation" DbSG)
  REPOSITORY=$(out "$AWS_LAB_PREFIX-foundation" Repository)
  REPOSITORY_URI=$(out "$AWS_LAB_PREFIX-foundation" RepositoryUri)
  REPOSITORY_ARN=$(out "$AWS_LAB_PREFIX-foundation" RepositoryArn)
}

plan_service() {
  plan_stack "$AWS_LAB_PREFIX-service" "$LAB_EXAMPLES/service.json" \
    "VpcId=$VPC_ID" "PublicSubnets=$PUBLIC_SUBNETS" "PrivateSubnets=$PRIVATE_SUBNETS" \
    "AlbSG=$ALB_SG" "AppSG=$APP_SG" "ImageUri=$IMAGE_URI" "RepositoryArn=$REPOSITORY_ARN" \
    "CertificateArn=${CERT_ARN:-}" "DbHost=${DB_HOST:-}" "DbSecretArn=${DB_SECRET_ARN:-}" \
    "DesiredCount=${DESIRED_COUNT:-2}"
}

load_service() {
  CLUSTER=$(out "$AWS_LAB_PREFIX-service" Cluster)
  SERVICE=$(out "$AWS_LAB_PREFIX-service" Service)
  TASK_DEFINITION=$(out "$AWS_LAB_PREFIX-service" TaskDefinition)
  LOG_GROUP=$(out "$AWS_LAB_PREFIX-service" LogGroup)
  ALB_DNS=$(out "$AWS_LAB_PREFIX-service" AlbDns)
  TARGET_GROUP_ARN=$(out "$AWS_LAB_PREFIX-service" TargetGroupArn)
}
