"""SDK-boundary fake checks. No AWS calls and no boto3 installation required."""
from copy import deepcopy
import importlib.util
import io
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch
from contextlib import redirect_stdout


spec = importlib.util.spec_from_file_location("cloud_handler", Path(__file__).with_name("handler.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ConditionalFailure(Exception):
    pass


class FakeDynamoDB:
    exceptions = types.SimpleNamespace(ConditionalCheckFailedException=ConditionalFailure)

    def __init__(self):
        self.items = {}

    def put_item(self, TableName, Item, ConditionExpression):
        if ConditionExpression != "attribute_not_exists(PK)":
            raise AssertionError("create-only predicate required")
        key = Item["PK"]["S"]
        if key in self.items:
            raise ConditionalFailure()
        self.items[key] = deepcopy(Item)

    def get_item(self, TableName, Key, ConsistentRead):
        if ConsistentRead is not True:
            raise AssertionError("read current receipt")
        return {"Item": deepcopy(self.items.get(Key["PK"]["S"]))}


class HandlerTests(unittest.TestCase):
    def setUp(self):
        self.client = FakeDynamoDB()
        sdk = types.SimpleNamespace(client=lambda service: self.client)
        self.modules = patch.dict(sys.modules, {"boto3": sdk})
        self.env = patch.dict(os.environ, {"TABLE_NAME": "synthetic"})
        self.modules.start()
        self.env.start()
        self.addCleanup(self.modules.stop)
        self.addCleanup(self.env.stop)
        self.context = types.SimpleNamespace(aws_request_id="synthetic-request")

    def call(self, event):
        with redirect_stdout(io.StringIO()):
            return module.handler(event, self.context)

    def test_same_id_and_content_is_one_record(self):
        self.assertEqual(self.call({"id": "x", "value": "a"})["status"], "created")
        self.assertEqual(self.call({"id": "x", "value": "a"})["status"], "duplicate")
        self.assertEqual(len(self.client.items), 1)

    def test_fail_after_write_then_retry(self):
        with self.assertRaises(RuntimeError):
            self.call({"id": "x", "value": "a", "fail_after_write": True})
        self.assertEqual(self.call({"id": "x", "value": "a"})["status"], "duplicate")

    def test_id_conflict_is_rejected(self):
        self.call({"id": "x", "value": "a"})
        with self.assertRaises(ValueError):
            self.call({"id": "x", "value": "b"})

    def test_bounded_input(self):
        with self.assertRaises(ValueError):
            self.call({"id": "", "value": "a"})
        with self.assertRaises(ValueError):
            self.call({"id": "x", "value": "🙂" * 4096})


if __name__ == "__main__":
    unittest.main()
