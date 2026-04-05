#!/bin/bash
# Extract DOM tree from live URL via Playwright headless Chromium
# Usage: extract-website.sh <viewport-width> <url>
# Output: JSON to stdout
# First run: creates venv + installs playwright + chromium (~1 min)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$HOME/.frontend-extract"
WIDTH="$1"
URL="$2"

if [ -z "$WIDTH" ] || [ -z "$URL" ]; then
  echo "usage: extract-website.sh <viewport-width> <url>" >&2
  exit 1
fi

# Setup venv once
if [ ! -d "$VENV_DIR" ]; then
  echo "setting up extract tool..." >&2
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install -q playwright
  "$VENV_DIR/bin/python" -m playwright install chromium
fi

# Run extraction — JSON to stdout
"$VENV_DIR/bin/python" - "$WIDTH" "$URL" "$SCRIPT_DIR/extract-website.js" << 'PYEOF'
from playwright.sync_api import sync_playwright
import sys, json

width = int(sys.argv[1])
url = sys.argv[2]
js_path = sys.argv[3]

with open(js_path) as f:
    extract_js = f.read()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": width, "height": 900})
    page.goto(url, wait_until="networkidle")

    # Scroll to bottom to trigger all lazy loading
    # Max 50 steps to prevent infinite scroll traps
    page.evaluate("""async () => {
        const delay = ms => new Promise(r => setTimeout(r, ms));
        let prev = 0;
        let steps = 0;
        while (document.body.scrollHeight !== prev && steps < 50) {
            prev = document.body.scrollHeight;
            window.scrollBy(0, window.innerHeight);
            steps++;
            await delay(300);
        }
    }""")

    page.wait_for_timeout(1000)

    # Run extraction (scrolls to top internally before walking)
    result = page.evaluate(extract_js)
    print(json.dumps(result, indent=2))

    browser.close()
PYEOF
