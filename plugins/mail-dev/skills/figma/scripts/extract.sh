#!/bin/bash
# Usage: extract-figma.sh <NODE_ID>   (API format "2131:2128", run from project dir)
python3 - "$1" << 'PYEOF'
import json, sys
target = sys.argv[1]
doc = json.load(open('.workspace/figma_cache/full.json'))['document']
def walk(n):
    yield n
    for c in n.get('children', []):
        yield from walk(c)
for n in walk(doc):
    if n.get('id') == target:
        print(json.dumps(n, indent=2, ensure_ascii=False))
        sys.exit(0)
print(f'Node {target} not found', file=sys.stderr)
sys.exit(1)
PYEOF
