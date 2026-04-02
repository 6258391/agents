#!/bin/bash
# Print Figma node tree: name, type, id per node. Zero dependencies.
# Usage: tree.sh <data.json>

if [ -z "$1" ]; then
  echo "usage: tree.sh <data.json>" >&2
  exit 1
fi

python3 - "$1" << 'PYEOF'
import json, sys

def print_tree(node, indent=0):
    print(f"{'  ' * indent}{node.get('name', '?')} ({node.get('type', '?')}) [{node.get('id', '?')}]")
    for child in node.get("children", []):
        print_tree(child, indent + 1)

with open(sys.argv[1]) as f:
    data = json.load(f)

if "nodes" in data:
    for nid, ndata in data["nodes"].items():
        print_tree(ndata.get("document", {}))
elif "document" in data:
    print_tree(data["document"])
PYEOF
