---
name: visual
description: "Compile MJML, screenshot at @2x, diff against Figma reference PNG, return verdict and diff image."
user-invocable: false
allowed-tools: Bash, Read
---

Run pixel-perfect visual comparison of MJML output against Figma reference PNG for one module or the full email.

1. **Test**
   - Input: mode (`module` or `full`); for module: NAME, NODE_ID, optional device (`desktop`|`mobile`, default `desktop`); for full: optional device
   - Output: stdout block containing `verdict:` tier, `diff_pct:`, `rendered:` path, `ref:` path, `diff:` path — plus the diff image file on disk
   - DO: run `scripts/test.sh module <NAME> <NODE_ID> [desktop|mobile]` for a single module wrapping `src/modules/<NAME>.mjml` + `src/_head.mjml`.
   - DO: run `scripts/test.sh full [desktop|mobile]` for the composed `src/email.mjml`.
   - DO: pass NODE_ID in Figma API format with colons (e.g. `2185:348`). The script walks ancestors to find the ref frame whose width equals `assets/ref/{device}.png` width // 2, then computes y1/y2 relative to that frame and crops the reference.
   - DO: ensure `.workspace/figma_cache/full.json` exists (run the `figma` skill's Download step first). Module mode reads node coordinates from this cache; if it is missing the script exits non-zero.
   - DO: ensure `assets/ref/desktop.png` and/or `assets/ref/mobile.png` exist at @2x before calling. The script crops from these files and cannot invent them.
   - DO: on first ever run, expect a one-time delay (~1 minute) while the script builds its venv at `$HOME/.mail-dev/venv` and downloads Chromium (~200MB) via `python -m playwright install chromium`. Let it finish. Do not retry, do not kill.
   - DO: after the script prints `diff:` path, immediately use the Read tool on that exact path to view the diff image visually before deciding whether to fix or accept.
   - WHY DO: verdict percent alone is insufficient. The same 2% can be benign anti-aliasing noise across glyph edges, or one critical element missing in a concentrated red region. Without viewing, agent cannot distinguish.
   - DO: classify the red overlay pattern when inspecting: red on glyph edges everywhere → font engine anti-aliasing residue, accept; red concentrated on one region → element wrong, fix that element; red uniform on a grid or shifted-down pattern → layout offset, fix padding/margin.
   - DO: when text wraps differently than Figma because Chromium renders the font wider, measure the Chromium render width with Playwright `getBoundingClientRect().width` against the Figma node bbox width, then apply a small negative `letter-spacing` (typically `-0.1px` to `-0.3px`) to bridge the gap.
   - WHY DO: `letter-spacing` is CSS2 and works in every email client. Measuring prevents guess-and-check iteration. Bridging font engine metric difference is the only pixel-perfect fix that does not break real clients.
   - DO: stop fixing once the verdict reaches `VERY GOOD` (under 2%). Accept any remaining residue as font anti-aliasing noise.
   - WHY DO: sub-1% diff is unreachable because Chromium and Figma render glyphs with different anti-aliasing engines. Chasing it wastes iterations.
   - DO: if the script exits non-zero, emits no `verdict:` line, or the `diff:` path does not exist on disk, report the exact stderr to the caller and stop. Do not fabricate verdict or diff percent.
   - WHY DO: downstream decisions depend on real measurements. Fabricated numbers cause silent drift.
   - DO: re-read every DO and DON'T in this file before returning output to the caller.
   - WHY DO: long iterative fix loops cause rule drift. By iteration 10 the agent has forgotten the CSS4 blacklist it read at iteration 1. Re-reading prevents silent degradation.
   - DON'T: trust the verdict tier or diff percent without reading the diff image. Instead, always Read the `diff:` path even when the verdict is EXCELLENT or VERY GOOD.
   - WHY DON'T: low percent can still hide one critical missing or wrong element buried inside benign anti-aliasing noise. The number averages; the image localizes.
   - DON'T: use any CSS4 property to close the diff, even when Chromium shows it working. Instead, change MJML structure, padding, margin, `letter-spacing`, `line-height`, or `font-weight`. The blacklist: `text-decoration-thickness`, `text-underline-offset`, `aspect-ratio`, `gap` on flex/grid, CSS custom properties (`--var`), complex `calc()`, `filter`, logical properties (`margin-inline`, `padding-block`).
   - WHY DON'T: these properties render correctly in Chromium but break in Outlook, Gmail, and Apple Mail. Trading a broken real-client render for a few diff pixels is a bad deal.
   - DON'T: guess `letter-spacing` values by trying numbers until the diff drops. Instead, measure Chromium width with Playwright `getBoundingClientRect().width`, compare to the Figma bbox width, and compute the bridge value.
   - WHY DON'T: guessing spends iterations and still leaves the value uncalibrated for other text at the same size. Measuring gives one correct value per font+size+weight combo.
   - DON'T: chase under-1% diff after reaching VERY GOOD. Instead, accept the residue and move on.
   - WHY DON'T: every extra iteration risks introducing a CSS4 hack or an over-tuned padding that drifts from the design intent.
   - DON'T: edit `scripts/test.sh`, inline a replacement Python script, or reimplement any part of the pipeline in the Bash call. Instead, invoke the bundled script exactly as shipped.
   - WHY DON'T: the bundled script handles venv setup, NODE_ID ancestor walk to matching ref frame width, y-coordinate translation, @2x crop math, `document.fonts.ready` wait, threshold 10 noise filter, and tier classification. Inline alternatives miss edge cases and silently produce wrong diffs.
   - DON'T: skip the Read-diff-image step when the verdict percent looks low. Instead, read it every single run, no exceptions.
   - WHY DON'T: the one time you skip is the one time the 2% hides a broken CTA button. The habit must be unconditional.
   - DON'T: run the script with a NODE_ID that does not exist in `.workspace/figma_cache/full.json`, or without first populating the cache via the `figma` skill's Download step. Instead, confirm cache and node id exist, then call.
   - WHY DON'T: missing cache or missing node causes the script to exit with an error the agent may retry-loop on. Fix the dependency, don't retry.
   - DON'T: proceed to the next module or declare the module done before reading the diff image for the current run. Instead, complete the read-and-classify step for every single invocation.
   - WHY DON'T: batched fix-then-verify collapses into fix-without-verify and lets regressions through.
   - DON'T: skip re-reading these rules mid-loop. Instead, re-check every DO and DON'T before returning the final verdict to the caller, and every 5 iterations during a long fix loop.
   - WHY DON'T: rule drift is the dominant failure mode in long iterative sessions. Periodic re-reads are the only defense.
