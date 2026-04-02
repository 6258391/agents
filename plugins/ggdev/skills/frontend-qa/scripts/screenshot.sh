#!/bin/bash
# Screenshot HTML file as PNG using Playwright headless Chromium
# Usage: screenshot.sh <html-file> <output-png> [viewport-width]
# First run: creates venv + installs playwright + chromium (~1 min)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$HOME/.ggdev-screenshot"
HTML_FILE="$1"
OUTPUT="$2"
WIDTH="${3:-1440}"

if [ -z "$HTML_FILE" ] || [ -z "$OUTPUT" ]; then
  echo "usage: screenshot.sh <html-file> <output-png> [viewport-width]" >&2
  exit 1
fi

# Setup venv once
if [ ! -d "$VENV_DIR" ]; then
  echo "setting up screenshot tool..." >&2
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install -q playwright
  "$VENV_DIR/bin/python" -m playwright install chromium
fi

# Run screenshot
"$VENV_DIR/bin/python" -c "
from playwright.sync_api import sync_playwright
import sys, os

html = os.path.abspath('$HTML_FILE')
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': $WIDTH, 'height': 800})
    page.goto(f'file://{html}')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='$OUTPUT', full_page=True)
    browser.close()
print('$OUTPUT')
"
