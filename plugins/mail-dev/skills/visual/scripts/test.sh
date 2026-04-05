#!/bin/bash
# Usage: test-visual.sh module <NAME> <NODE_ID> [desktop|mobile]
#        test-visual.sh full [desktop|mobile]
# NODE_ID same format as extract-figma.sh ("2131:2128"). Run from project dir.
set -e

VENV="$HOME/.mail-dev/venv"
[ -d "$VENV" ] || /opt/homebrew/opt/python@3.11/bin/python3.11 -m venv "$VENV"
source "$VENV/bin/activate"
python -c "import cv2, playwright" 2>/dev/null || pip install -q playwright==1.49.0 opencv-python==4.10.0.84 numpy==2.2.0
[ -d "$HOME/Library/Caches/ms-playwright" ] || python -m playwright install chromium

mkdir -p .workspace/harnesses .workspace/out/sections dist
MODE=$1; shift

if [ "$MODE" = "module" ]; then
    NAME=$1; NODE_ID=$2; DEVICE=${3:-desktop}
    cat > .workspace/harnesses/$NAME.mjml <<EOF
<mjml>
  <mj-head><mj-include path="../../src/_head.mjml" /></mj-head>
  <mj-body width="600px" background-color="#FFFFFF">
    <mj-include path="../../src/modules/$NAME.mjml" />
  </mj-body>
</mjml>
EOF
    npx --yes mjml .workspace/harnesses/$NAME.mjml -o dist/test-$NAME.html
    TARGET=dist/test-$NAME.html
    OUT=.workspace/out/sections/$NAME.png
    DIFF=.workspace/out/sections/diff_$NAME.png
else
    DEVICE=${1:-desktop}; NODE_ID=""
    npx --yes mjml src/email.mjml -o dist/email.html
    TARGET=dist/email.html
    OUT=.workspace/out/full_$DEVICE.png
    DIFF=.workspace/out/diff_full_$DEVICE.png
fi

python - "$MODE" "$TARGET" "$OUT" "$DIFF" "$DEVICE" "$NODE_ID" << 'PYEOF'
import sys, os, json, cv2, numpy as np
from playwright.sync_api import sync_playwright
mode, target, out, diff_path, device, node_id = sys.argv[1:7]
width = 600 if device == 'desktop' else 414

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={'width': width, 'height': 100}, device_scale_factor=2)
    page = ctx.new_page()
    page.goto('file://' + os.path.abspath(target), wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(500)
    page.screenshot(path=out, full_page=True)
    br.close()

ref = cv2.imread(f'assets/ref/{device}.png')
if mode == 'module':
    doc = json.load(open('.workspace/figma_cache/full.json'))['document']
    parents = {}
    def walk(n, par=None):
        parents[n['id']] = (n, par)
        for c in n.get('children', []):
            walk(c, n)
    walk(doc)
    if node_id not in parents:
        print(f'Node {node_id} not found', file=sys.stderr); sys.exit(1)
    section = parents[node_id][0]
    ancestors = [section]
    cur = section
    while parents[cur['id']][1]:
        cur = parents[cur['id']][1]
        ancestors.append(cur)
    ref_w = ref.shape[1] // 2
    frame = next((a for a in reversed(ancestors)
                  if abs(a.get('absoluteBoundingBox', {}).get('width', 0) - ref_w) < 2), None)
    if frame is None:
        print(f'No ancestor matches ref width {ref_w}', file=sys.stderr); sys.exit(1)
    bb, fb = section['absoluteBoundingBox'], frame['absoluteBoundingBox']
    y1 = int(round(bb['y'] - fb['y']))
    y2 = y1 + int(round(bb['height']))
    ref = ref[y1*2:y2*2, :]

ren = cv2.imread(out)
ch = min(ref.shape[0], ren.shape[0])
cw = min(ref.shape[1], ren.shape[1])
a, b = ref[:ch, :cw], ren[:ch, :cw]
diff = cv2.absdiff(a, b)
gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
_, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
pct = cv2.countNonZero(mask) / (ch * cw) * 100

red = np.zeros_like(a); red[:, :, 2] = 255
mask3 = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR).astype(bool)
viz = np.where(mask3, cv2.addWeighted(a, 0.4, red, 0.6, 0), a)
cv2.imwrite(diff_path, viz)

print(f'{pct:.3f}% diff')
print(f'→ Read {diff_path} to inspect visually (do not trust number alone)')
PYEOF
