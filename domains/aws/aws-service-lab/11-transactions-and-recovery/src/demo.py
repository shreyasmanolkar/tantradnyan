"""Print the worked example and deliberate failure as a JSON trace."""
import json
from model import demo

if __name__ == "__main__":
    print(json.dumps(demo(), indent=2, sort_keys=True))
