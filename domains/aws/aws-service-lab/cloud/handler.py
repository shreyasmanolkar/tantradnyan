"""Synthetic conditional-write lab. The one DynamoDB item IS the whole effect."""
import hashlib
import json
import os


def handler(event, context):
    import boto3  # supplied by the managed runtime for this inline learning lab
    identifier, value = event.get("id"), event.get("value")
    if not isinstance(identifier, str) or not 1 <= len(identifier) <= 128:
        raise ValueError("id must be a bounded string")
    if not isinstance(value, str) or len(value.encode()) > 4096:
        raise ValueError("value must be at most 4096 UTF-8 bytes")
    payload_hash = hashlib.sha256(value.encode()).hexdigest()
    client = boto3.client("dynamodb")
    table = os.environ["TABLE_NAME"]
    item = {"PK": {"S": identifier}, "value": {"S": value}, "payload_hash": {"S": payload_hash}}
    created = False
    try:
        client.put_item(TableName=table, Item=item, ConditionExpression="attribute_not_exists(PK)")
        created = True
    except client.exceptions.ConditionalCheckFailedException:
        stored = client.get_item(TableName=table, Key={"PK": {"S": identifier}}, ConsistentRead=True).get("Item")
        if not stored or stored["payload_hash"]["S"] != payload_hash:
            raise ValueError("id reused for different content or receipt disappeared")
    # Do not log the value, event, credentials, or secret material.
    print(json.dumps({"request_id": context.aws_request_id, "created": created}))
    if created and event.get("fail_after_write") is True:
        raise RuntimeError("injected failure after the durable write")
    return {"id": identifier, "status": "created" if created else "duplicate", "payload_hash": payload_hash}
