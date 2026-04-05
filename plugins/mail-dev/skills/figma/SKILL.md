---
name: figma
description: "Download Figma file JSON once, extract any node's full raw fields from the cache."
user-invocable: false
allowed-tools: Bash
---

Fetch and read Figma design data via the REST API with zero interpretation.

1. **Download**
   - Input: Figma `FILE_KEY` (the string between `/file/` or `/design/` and the next `/` in a Figma URL). `FIGMA_TOKEN` must already be set in env.
   - Output: `.workspace/figma_cache/full.json` written under the current project directory. Report the absolute path and file size in bytes.
   - DO: run `scripts/download.sh <FILE_KEY>` exactly once per project. Re-run only when the human says the Figma source changed.
   - WHY DO: the full file is ~90MB and stable. Every extract afterwards reads from this local cache — network calls are a failure source (503, rate limit, S3 expiry).
   - DO: if `FIGMA_TOKEN` is unset, or the script exits non-zero, or the output file is missing or 0 bytes → report the exact error to the caller and stop.
   - WHY DO: `curl -sf` leaves no partial file on HTTP error, so a missing file means the call failed. Silent continuation would hand downstream a stale or absent cache.
   - DON'T: call the Figma API inline with curl, WebFetch, or any other tool. Instead, use `scripts/download.sh`.
   - WHY DON'T: the bundled script is the only sanctioned path — it pins the endpoint, header name, and cache location. Inline variants drift and break the Extract step below.
   - DON'T: pass a Figma URL, a node id, or a file name in place of `FILE_KEY`. Instead, parse the `FILE_KEY` from the URL first and pass only that.
   - WHY DON'T: the script substitutes the argument directly into the API path. A URL or node id yields a 404 and a zero-byte cache.
   - DON'T: open, parse, summarize, or paraphrase `full.json` in this step. Instead, hand off to Extract.
   - WHY DON'T: Download's only job is to land the cache. Reading it here invites cherry-picking and silently-dropped fields.

2. **Extract**
   - Input: a single Figma node id in API format with a colon, e.g. `2131:2128`. If the caller provides a URL-format id with a hyphen (e.g. `2131-2128`), convert the hyphen to a colon before passing it to the script.
   - Output: the node's full JSON dumped to stdout by the script, returned to the caller verbatim.
   - DO: run `scripts/extract.sh <NODE_ID>` from the project directory so it reads `.workspace/figma_cache/full.json`.
   - DO: re-run Extract for every iteration that needs the node's data, even if the same node was extracted earlier in the session.
   - WHY DO: memory of earlier output drifts — fields silently drop between re-reads. The raw JSON is the source of truth and must be re-fetched fresh each round (checklist R13).
   - DO: if the script exits non-zero (`Node ... not found` on stderr), or stdout is empty, or stdout is not valid JSON → report the exact stderr and stop. Do not retry with a guessed id.
   - DO: alert the caller and stop if the node contains any of these unusual signals before returning: a font family not previously seen in this project, a font weight not previously seen, a `textCase` other than `ORIGINAL`, a `textDecoration` other than `NONE`, a `blendMode` other than `NORMAL` or `PASS_THROUGH`, dynamic template tokens inside `characters` (e.g. `%%...%%`, `{{...}}`, `%%=...=%%`), or a `styleOverrideTable` range covering non-link text.
   - WHY DO: these are the exact failure modes checklist R4 requires human decision on. Proceeding silently causes rework later.
   - DON'T: extract more than one node per invocation. Instead, call Extract once per node id.
   - WHY DON'T: the script takes a single id and walks the tree once per call. Batching would require a different script and merges distinct nodes into one blob.
   - DON'T: filter, curate, rename, reorder, or drop any keys from the script output. Pass every key the script prints: `id`, `name`, `type`, `scrollBehavior`, `children`, `absoluteBoundingBox`, `absoluteRenderBounds`, `constraints`, `fills`, `strokes`, `strokeWeight`, `strokeAlign`, `effects`, `cornerRadius`, `rectangleCornerRadii`, `layoutMode`, `layoutSizingHorizontal`, `layoutSizingVertical`, `itemSpacing`, `paddingLeft`, `paddingRight`, `paddingTop`, `paddingBottom`, `characters`, `characterStyleOverrides`, `styleOverrideTable`, `style.fontFamily`, `style.fontPostScriptName`, `style.fontWeight`, `style.fontSize`, `style.lineHeightPx`, `style.lineHeightPercent`, `style.lineHeightUnit`, `style.letterSpacing`, `style.paragraphSpacing`, `style.textCase`, `style.textDecoration`, `style.textAlignHorizontal`, `style.textAlignVertical`, `style.italic`, `style.opentypeFlags`, and any additional keys the script emits. Instead, return the script's stdout unchanged.
   - WHY DON'T: every curated extract in this project's history has dropped a field that later broke render (`textCase: UPPER` missed on 3 buttons, `textDecoration: UNDERLINE` missed on a link). Full pass-through is the only safe mode.
   - DON'T: convert values to a different unit or format. Keep `px` as `px`, `rgba(0-1)` as `rgba(0-1)`, font weight as the numeric value, hex as hex, and preserve `\xa0` (NBSP), curly quotes, `®`, `©`, em-dash, en-dash, and any `%%...%%` / `{{...}}` tokens byte-for-byte in `characters`. Instead, return the JSON exactly as printed.
   - WHY DON'T: checklist R9 — downstream consumers (MJML writer, QA) use the raw values. Any conversion is lossy and silently wrong.
   - DON'T: write the output to `spec.md`, a scratch file, or any intermediate doc. Instead, return it only to the caller who invoked the Skill.
   - WHY DON'T: checklist R13 — `spec.md` holds decisions, not transcribed data. Transcription is where fields disappear.
   - DON'T: add commentary, interpretation, measurements, or suggestions around the JSON. Instead, return only: the script exit status, the node id that was extracted, and the raw JSON.
   - WHY DON'T: commentary is scope creep. Interpretation happens in a later role.
   - DON'T: modify `scripts/download.sh`, `scripts/extract.sh`, or replace them with inline Python/curl. Instead, use the bundled scripts as-is.
   - WHY DON'T: inline replacements drop fields the bundled walker preserves and break the shared cache contract.

Before returning output from either step, re-read every DO and DON'T line in this file and verify the output complies with each one. If any rule is violated, fix the output or stop and report — do not return partial or "best effort" data.
