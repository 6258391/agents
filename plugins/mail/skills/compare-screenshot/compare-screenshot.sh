#!/bin/bash

# bootstrap
VENV="$HOME/.agents/venv"
[ -d "$VENV" ] || python3 -m venv "$VENV" >&2
PY="$VENV/bin/python3"
"$PY" -c "import cv2, numpy" 2>/dev/null || "$VENV/bin/pip" install -q opencv-python-headless numpy >&2
MODE="$1"

# dispatch
case "$MODE" in
  dimensions)
    "$PY" - "$2" <<'PYDIM'
import cv2, json, sys
img = cv2.imread(sys.argv[1])
h, w = img.shape[:2]
print(json.dumps({'width': w, 'height': h}))
PYDIM
    ;;
  capture)
    HTML_PATH="$2"
    WIDTH="$3"
    HEIGHT="$4"
    OUTPUT_PATH="${HTML_PATH%.html}-screenshot.png"
    npx playwright screenshot \
      --viewport-size="${WIDTH},${HEIGHT}" \
      --full-page \
      "file://$(cd "$(dirname "$HTML_PATH")" && pwd)/$(basename "$HTML_PATH")" \
      "$OUTPUT_PATH"
    echo "$OUTPUT_PATH"
    ;;
  diff)
    SCREENSHOT_PATH="$2"
    IMAGE_REF_PATH="$3"
    DIFF_OUTPUT="${SCREENSHOT_PATH%.png}-diff.png"
    JSON_OUTPUT="${SCREENSHOT_PATH%.png}-diff.json"
    "$PY" - "$SCREENSHOT_PATH" "$IMAGE_REF_PATH" "$DIFF_OUTPUT" "$JSON_OUTPUT" <<'PYDIFF'
import cv2, json, numpy as np, sys

shot_p, ref_p, diff_out, json_out = sys.argv[1:5]
img1 = cv2.imread(shot_p)
img2 = cv2.imread(ref_p)

ref_orig = (img2.shape[1], img2.shape[0])
shot_dim = (img1.shape[1], img1.shape[0])
if ref_orig != shot_dim:
    sys.stderr.write(f"WARNING: ref {ref_orig} != shot {shot_dim}, resizing ref to match; verify viewport before trusting diff\n")
    img2 = cv2.resize(img2, shot_dim)

gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
diff = cv2.absdiff(gray1, gray2)
_, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
result = img1.copy()
zones = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    if w * h < 100: continue
    cv2.rectangle(result, (x, y), (x + w, y + h), (0, 0, 255), 2)
    mask = thresh[y:y+h, x:x+w]
    zone_shot = img1[y:y+h, x:x+w]
    zones.append({
        'x': int(x), 'y': int(y),
        'width': int(w), 'height': int(h),
        'area': int(w*h),
        'aspect_ratio': round(w/h, 2) if h else 0,
        'diff_pct': round(float(np.count_nonzero(mask)) / (w*h) * 100, 1),
        'avg_luma_shift': round(float(np.mean(diff[y:y+h, x:x+w])), 1),
        'non_white_pct': round(float(np.count_nonzero(np.any(zone_shot < 240, axis=2))) / (w*h) * 100, 1),
    })

total_diff = round(float(np.count_nonzero(thresh)) / thresh.size * 100, 1)
cv2.imwrite(diff_out, result)
with open(json_out, 'w') as f:
    json.dump({
        'total_diff_pct': total_diff,
        'shot_dims': list(shot_dim),
        'ref_dims_original': list(ref_orig),
        'zones': zones,
        'diff_image': diff_out,
    }, f, indent=2)
print(open(json_out).read())
PYDIFF
    ;;
esac
