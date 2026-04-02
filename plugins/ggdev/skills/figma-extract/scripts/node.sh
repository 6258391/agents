#!/bin/bash
# Print properties of a specific Figma node by ID. Zero dependencies.
# Usage: node.sh <data.json> <node-id>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "usage: node.sh <data.json> <node-id>" >&2
  exit 1
fi

python3 - "$1" "$2" << 'PYEOF'
import json, sys

def find(node, target_id):
    if node.get("id") == target_id:
        return node
    for child in node.get("children", []):
        found = find(child, target_id)
        if found:
            return found
    return None

with open(sys.argv[1]) as f:
    data = json.load(f)

node = None
if "nodes" in data:
    for nid, ndata in data["nodes"].items():
        node = find(ndata.get("document", {}), sys.argv[2])
        if node:
            break
elif "document" in data:
    node = find(data["document"], sys.argv[2])

if not node:
    print(f"not found: {sys.argv[2]}", file=sys.stderr)
    sys.exit(1)

output = {k: v for k, v in node.items() if k != "children"}
output["children_count"] = len(node.get("children", []))
output["children_names"] = [c.get("name") for c in node.get("children", [])]
print(json.dumps(output, indent=2))
PYEOF
