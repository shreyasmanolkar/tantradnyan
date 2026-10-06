"""Local JSON, logical-reference and inline-Python checks, NOT cfn-lint."""
import ast
import json
from pathlib import Path
import re


def check(path):
    document = json.loads(path.read_text())
    resources = document["Resources"]
    known = set(resources) | set(document.get("Parameters", {}))

    def reference(name):
        if name not in known and not name.startswith("AWS::"):
            raise ValueError(f"{path.name}: unknown logical reference {name}")

    def walk(value):
        if isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            if "Ref" in value:
                reference(value["Ref"])
            if "Fn::GetAtt" in value:
                argument = value["Fn::GetAtt"]
                reference(argument[0] if isinstance(argument, list) else argument.split(".")[0])
            if "Fn::Sub" in value:
                argument = value["Fn::Sub"]
                text, variables = (argument, {}) if isinstance(argument, str) else argument
                for token in re.findall(r"\$\{([^}]+)\}", text):
                    if not token.startswith("!") and token not in variables:
                        reference(token.split(".")[0])
            for item in value.values():
                walk(item)

    for name, resource in resources.items():
        if not resource.get("Type", "").startswith("AWS::"):
            raise ValueError(f"{name}: resource needs a type")
        depends = resource.get("DependsOn", [])
        for dependency in [depends] if isinstance(depends, str) else depends:
            reference(dependency)
    walk(document)
    for resource in resources.values():
        if resource["Type"] == "AWS::Lambda::Function":
            code = resource["Properties"]["Code"]["ZipFile"]
            ast.parse(code)
            if code != path.with_name("handler.py").read_text():
                raise ValueError("inline handler differs from its source")
    print(f"PASS: {path.name}: JSON, logical references and any inline Python")


if __name__ == "__main__":
    for name in ["serverless.json", "events.json"]:
        check(Path(__file__).with_name(name))
    print("Scope excludes CloudFormation schema, regional availability, permissions and deployment.")
