#!/bin/bash

MODE="$1"

case "$MODE" in
  dimensions)
    IMAGE_PATH="$2"
    python3 -c "
import cv2, json
img = cv2.imread('$IMAGE_PATH')
h, w = img.shape[:2]
print(json.dumps({'width': w, 'height': h}))
"
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
    python3 -c "
import cv2, json, numpy as np

img1 = cv2.imread('$SCREENSHOT_PATH')
img2 = cv2.imread('$IMAGE_REF_PATH')

img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

diff = cv2.absdiff(gray1, gray2)
_, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

result = img1.copy()
zones = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    if w * h < 100:
        continue
    cv2.rectangle(result, (x, y), (x + w, y + h), (0, 0, 255), 2)
    mask = thresh[y:y+h, x:x+w]
    diff_pct = round(float(np.count_nonzero(mask)) / (w * h) * 100, 1)
    zones.append({'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h), 'diff_pct': diff_pct})

total_diff = round(float(np.count_nonzero(thresh)) / thresh.size * 100, 1)

cv2.imwrite('$DIFF_OUTPUT', result)

with open('$JSON_OUTPUT', 'w') as f:
    json.dump({'total_diff_pct': total_diff, 'zones': zones, 'diff_image': '$DIFF_OUTPUT'}, f, indent=2)

print(open('$JSON_OUTPUT').read())
"
    ;;
esac
