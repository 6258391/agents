---
name: compare-screenshot
description: "Capture email screenshot. Compare against image ref. Return diff report."
allowed-tools: [Bash, Read]
---

## Steps

1. Receive the HTML file path and image ref path from the parent agent. DON'T: search for HTML files or image refs in the working directory. WHY: the agent knows which files it produced — searching risks comparing the wrong pair.
2. Run `compare-screenshot.sh dimensions {image ref path}` to read the image ref width and height via opencv. Parse the JSON output (`{"width": w, "height": h}`) to get the viewport dimensions for the next step. DON'T: ask the caller to provide viewport dimensions separately. WHY: the image ref already defines the target dimensions — parsing them automatically eliminates one input and prevents mismatch between ref size and viewport size.
3. Run `compare-screenshot.sh capture {HTML file path} {width} {height}` to launch Playwright, set viewport to the ref dimensions, open the HTML file locally, and capture a full-page screenshot. Capture the screenshot file path from stdout for the next step. DON'T: use a default viewport size like 1280x800. WHY: the screenshot must match the ref dimensions exactly — any size difference produces false diffs on every pixel row.
4. Run `compare-screenshot.sh diff {screenshot path} {image ref path}` to generate a diff image with opencv highlighting mismatched zones in red, and output a JSON metadata file with per-zone coordinates, bounding boxes, and pixel difference percentage. DON'T: rely on overall pixel diff percentage alone. WHY: a 2% overall diff can hide a 100% diff in one small critical zone — per-zone breakdown pinpoints exactly where to fix.
5. Read the diff image using AI vision to interpret each highlighted zone: identify what is different (spacing, color, font size, alignment, missing element) and describe the expected vs actual values. DON'T: report raw pixel coordinates without human-readable interpretation. WHY: the agent fixing the code needs to know "padding-top is 20px, should be 32px" not "zone at y:340-360 differs by 42%".
6. Compose a markdown comparison report with sections: overall pass/fail, diff image path, per-zone breakdown (location, what differs, expected vs actual, suggested fix), and priority order (structural fixes first, then spacing, then color). DON'T: list zones in random order. WHY: structural fixes can resolve spacing diffs downstream — fixing spacing first wastes effort on diffs that disappear after a structural fix.
7. Return the markdown report path and diff image path to the parent agent. DON'T: inline the report content. WHY: the report may be large with embedded image references — inlining bloats agent context when it only needs the path to read on demand.
