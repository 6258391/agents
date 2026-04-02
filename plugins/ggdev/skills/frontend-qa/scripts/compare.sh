#!/bin/bash
# Compare design image against screenshot, output structured per-region JSON
# Usage: compare.sh <design-png> <screenshot-png>
# First run: creates venv + installs opencv-python (~30s)
# Output: JSON to stdout with match_pct, verdict, and per-region analysis

VENV_DIR="$HOME/.ggdev-compare"
DESIGN="$1"
SCREENSHOT="$2"

if [ -z "$DESIGN" ] || [ -z "$SCREENSHOT" ]; then
  echo "usage: compare.sh <design-png> <screenshot-png>" >&2
  exit 1
fi

# Setup venv once
if [ ! -d "$VENV_DIR" ]; then
  echo "setting up compare tool..." >&2
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install -q opencv-python-headless numpy
fi

# Run comparison
"$VENV_DIR/bin/python" - "$DESIGN" "$SCREENSHOT" << 'PYEOF'
import cv2, numpy as np, json, sys
from collections import Counter

design = cv2.imread(sys.argv[1])
screenshot = cv2.imread(sys.argv[2])

if design is None or screenshot is None:
    print("error: cannot read images", file=sys.stderr)
    sys.exit(1)

h, w = design.shape[:2]
screenshot = cv2.resize(screenshot, (w, h))

# Compute difference
diff = cv2.absdiff(design, screenshot)
gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 25, 255, cv2.THRESH_BINARY)

# Merge nearby diffs
kernel = np.ones((5, 5), np.uint8)
merged = cv2.dilate(thresh, kernel, iterations=3)

# Find regions
contours, _ = cv2.findContours(merged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

regions = []
for c in contours:
    x, y, rw, rh = cv2.boundingRect(c)
    if rw * rh < 500:
        continue

    # Sample dominant color from each image in this region
    design_roi = design[y:y+rh, x:x+rw]
    screen_roi = screenshot[y:y+rh, x:x+rw]

    def dominant_color(roi):
        pixels = roi.reshape(-1, 3)
        counts = Counter(map(tuple, pixels))
        bgr = counts.most_common(1)[0][0]
        return f"#{bgr[2]:02x}{bgr[1]:02x}{bgr[0]:02x}"

    dc = dominant_color(design_roi)
    sc = dominant_color(screen_roi)

    # Color distance (simple euclidean in RGB)
    d_rgb = np.array([int(dc[i:i+2], 16) for i in (1, 3, 5)])
    s_rgb = np.array([int(sc[i:i+2], 16) for i in (1, 3, 5)])
    color_dist = round(float(np.linalg.norm(d_rgb - s_rgb)), 1)

    # Detect shift by finding offset of best match in region
    mask_roi = thresh[y:y+rh, x:x+rw]
    diff_pixels = np.count_nonzero(mask_roi)
    diff_pct = round(diff_pixels / (rw * rh) * 100, 1)

    regions.append({
        "id": len(regions) + 1,
        "bbox": {"x": int(x), "y": int(y), "w": int(rw), "h": int(rh)},
        "diff_pct": diff_pct,
        "design_color": dc,
        "screenshot_color": sc,
        "color_distance": color_dist,
        "position": "top" if y < h * 0.2 else "bottom" if y > h * 0.8 else "middle"
    })

# Sort by area (largest first)
regions.sort(key=lambda r: r["bbox"]["w"] * r["bbox"]["h"], reverse=True)

# Overall stats
total = thresh.size
matching = total - np.count_nonzero(thresh)
match_pct = round(matching / total * 100, 1)

# Verdict
if match_pct >= 98:
    verdict = "pass"
elif match_pct < 80:
    verdict = "fail"
else:
    verdict = "review"

result = {
    "match_pct": match_pct,
    "verdict": verdict,
    "region_count": len(regions),
    "image_size": {"w": w, "h": h},
    "regions": regions
}

print(json.dumps(result, indent=2))
PYEOF
