---
name: frontend-qa
description: "Screenshot HTML modules, compare against design images, output structured diff analysis for AI interpretation."
user-invocable: false
allowed-tools: Read, Bash
---

Screenshot HTML output and compare against design for pixel-perfect verification.

1. **Screenshot**
   - Input: HTML file path + viewport width
   - Output: PNG screenshot file
   - DO: run `${CLAUDE_SKILL_DIR}/scripts/screenshot.sh <html-path> <output-png> <viewport-width>`
   - DO: first run triggers setup (venv + playwright + chromium, one-time)
   - DON'T: compare against HTML source directly. Instead, always screenshot first.
   - WHY DON'T: HTML source doesn't show rendering issues. Only screenshots show the real output.
   - DON'T: use an existing PNG from a previous invocation. Instead, always run screenshot.sh to generate a fresh PNG in this invocation.
   - WHY DON'T: cached screenshots reflect previous build state. Comparing against stale images produces false PASS verdicts.

2. **Compare**
   - Input: design image path + screenshot path
   - Output: JSON with match_pct, verdict, per-region analysis
   - DO: run `${CLAUDE_SKILL_DIR}/scripts/compare.sh <design-path> <screenshot-path>`
   - DO: read JSON output. Verdict: "pass" (>98%), "fail" (<80%), "review" (80-98%)
   - DO: if verdict "pass" → skip to next module
   - DO: if verdict "fail" → create fix task immediately
   - DO: if verdict "review" → view design + screenshot images separately, read per-region data, judge
   - DON'T: judge from match_pct alone. Instead, use per-region color_distance and bbox to identify specific issues.
   - WHY DON'T: low match_pct may be font rendering artifacts. High match may hide critical color errors in small areas.

3. **Interpret**
   - Input: JSON regions + design image + screenshot image + spec file
   - Output: PASS or FAIL with specific CSS fix instructions
   - DO: for each region with color_distance > 10, identify the element and the correct value from spec
   - DO: for regions with color_distance < 3, note as "rendering artifact, not a real issue"
   - DO: map bbox position to spec Structure to identify which element is affected
   - DO: generate fix instructions per element in DO/DON'T/WHY DON'T format: "DO: set Y to W (from spec). DON'T: use Z (current). WHY DON'T: [specific visual mismatch]."
   - DON'T: report rendering artifacts (color_distance < 3) as failures. Instead, note and skip.
   - WHY DON'T: font rendering differs between design tool and browser. Reporting artifacts creates unnecessary fix loops.
