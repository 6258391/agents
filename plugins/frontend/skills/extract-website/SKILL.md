---
name: extract-website
description: "Capture fully rendered DOM including lazy-loaded content that static HTML misses."
user-invocable: false
allowed-tools: Bash, Read
---

Extract visible DOM structure from a live URL at a specific viewport width.

1. **Extract**
   - Input: URL, viewport width
   - Output: JSON to stdout — page metadata + node tree (group/leaf, rect, style)
   - DO: run `scripts/extract-website.sh <viewport-width> <url>`
   - DO: verify by parsing the full JSON and checking both `page` and `tree` keys exist at the top level. Do not eyeball or spot-check.
   - DO: report node count from output
   - DO: if the script exits with non-zero code, produces no stdout, or outputs invalid JSON → report the exact error to the caller and stop. Do not fabricate or approximate output.
   - WHY DO: hidden failures send bad data downstream. The caller must know extraction failed.
   - DO: extract one URL per invocation. Re-run the script separately for each URL.
   - WHY DO: batching URLs loses per-page structure and mixes unrelated trees.
   - DON'T: modify extract-website.sh or extract-website.js. Instead, use bundled scripts as-is.
   - WHY DON'T: bundled scripts handle lazy loading, scroll limits, and edge cases. Inline alternatives miss them.
   - DON'T: parse or interpret the JSON output. Instead, pass raw JSON to the next step.
   - WHY DON'T: interpretation is a separate step. Mixing extraction with interpretation biases downstream.
   - DON'T: add analysis, observations, or suggestions about the extracted content. Instead, return only: confirmation of success, node count, and the raw JSON.
   - WHY DON'T: commentary is scope creep. The caller decides what to do with the data.
   - DON'T: truncate, summarize, or abbreviate the JSON output. Instead, pass it in full.
   - WHY DON'T: downstream steps need every node. Summaries silently drop small elements.
   - DON'T: restructure, rename keys, or reformat the JSON. Instead, preserve script output exactly.
   - WHY DON'T: consumers expect the script's schema. Changed formats break downstream parsing.
   - DON'T: skip re-reading these rules mid-task. Instead, re-check constraints before returning output.
   - WHY DON'T: long runs cause rule drift toward default behavior. Re-checking prevents forgetting.
