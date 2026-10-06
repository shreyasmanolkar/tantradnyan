"""Render one inspectable CloudFormation template; makes no AWS calls."""
import argparse
import json
from pathlib import Path


def template():
    prefix = "${AWS::StackName}-handler"
    sub = lambda value: {"Fn::Sub": value}
    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "Disposable Lambda/DynamoDB conditional-write learning lab. No public endpoint or event source.",
        "Resources": {
            "Receipts": {"Type": "AWS::DynamoDB::Table", "DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete",
                "Properties": {"BillingMode": "PAY_PER_REQUEST",
                    "AttributeDefinitions": [{"AttributeName": "PK", "AttributeType": "S"}],
                    "KeySchema": [{"AttributeName": "PK", "KeyType": "HASH"}],
                    "SSESpecification": {"SSEEnabled": True}}},
            "Logs": {"Type": "AWS::Logs::LogGroup", "DeletionPolicy": "Delete", "UpdateReplacePolicy": "Delete",
                "Properties": {"LogGroupName": sub("/aws/lambda/" + prefix), "RetentionInDays": 1}},
            "ExecutionRole": {"Type": "AWS::IAM::Role", "Properties": {
                "AssumeRolePolicyDocument": {"Version": "2012-10-17", "Statement": [{"Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]},
                "Policies": [{"PolicyName": "ReceiptAndLogs", "PolicyDocument": {"Version": "2012-10-17", "Statement": [
                    {"Effect": "Allow", "Action": ["dynamodb:PutItem", "dynamodb:GetItem"],
                        "Resource": {"Fn::GetAtt": ["Receipts", "Arn"]}},
                    {"Effect": "Allow", "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
                        "Resource": sub("arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/" + prefix + ":*")}
                ]}}]}},
            "Function": {"Type": "AWS::Lambda::Function", "DependsOn": "Logs", "Properties": {
                "FunctionName": sub(prefix), "Runtime": "python3.13", "Handler": "index.handler",
                "Role": {"Fn::GetAtt": ["ExecutionRole", "Arn"]}, "Timeout": 10, "MemorySize": 128,
                "Environment": {"Variables": {"TABLE_NAME": {"Ref": "Receipts"}}},
                "Code": {"ZipFile": Path(__file__).with_name("handler.py").read_text()}}}
        },
        "Outputs": {"TableName": {"Value": {"Ref": "Receipts"}},
                    "FunctionName": {"Value": {"Ref": "Function"}},
                    "LogGroup": {"Value": {"Ref": "Logs"}}}
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check committed template freshness without writing")
    args = parser.parse_args()
    path = Path(__file__).with_name("serverless.json")
    expected = json.dumps(template(), indent=2) + "\n"
    if args.check:
        if not path.exists() or path.read_text() != expected:
            raise SystemExit("Stale serverless.json: run python3 cloud/build_template.py")
        print("PASS: serverless.json matches the template and handler sources.")
    else:
        path.write_text(expected)
        print(f"Rendered {path.name}; inspect it before planning a change set.")
