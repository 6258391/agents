---
name: extract-figma
description: "Analyze Figma nodes. Emit layout geometry. Export image assets."
allowed-tools: [Bash]
---

extract-figma — classify Figma email nodes into exports and layout facts.

## Flow

1. Run `extract-figma.sh tree FILE_KEY IDS`.
2. Run `extract-figma.sh analyze FILE_KEY IDS`.
3. Run `extract-figma.sh structure FILE_KEY IDS`.
4. Run `extract-figma.sh images FILE_KEY IDS FORMAT SCALE`.
5. Run `extract-figma.sh download URL OUTPUT_PATH`.

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| FILE_KEY | yes | — | Figma file key from the URL |
| IDS | yes | — | Node IDs in colon format |
| URL | yes | — | Image URL from `images` output |
| OUTPUT_PATH | yes | — | Local file path to save to |
| FORMAT | no | png | Export format: png, svg |
| SCALE | no | 2 | Export scale: 1, 2, 3 |

## Examples

### Analyze email and extract assets

```bash
extract-figma.sh tree abc123def 2038:650,2050:202
extract-figma.sh analyze abc123def 2038:650,2050:202
extract-figma.sh structure abc123def 2038:650,2050:202
extract-figma.sh images abc123def 2038:651,2038:660,2038:661 png 2
extract-figma.sh download https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/xxx.png ./assets/hero.png
```

### Extract icons as SVG

```bash
extract-figma.sh tree abc123def 0:1
extract-figma.sh images abc123def 42:100 svg 1
extract-figma.sh download https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/abc123.svg ./assets/search-icon.svg
```

## Gotchas

- Use an exported `FIGMA_TOKEN` instead of implicit auth because all subcommands require it.
- Use `tree` for bulk fetching instead of per-node calls because Figma rate-limits per token.
- Run `images` once with all IDs then loop `download` per URL instead of repeated `images` calls because each `images` call is one API hit regardless of ID count.
- Download URLs from `images` promptly instead of caching them because they are S3 presigned URLs that expire.
- Decide NEEDS REVIEW items by reading the mini-tree instead of exporting preview images because node names and dimensions reveal grouping faster than visual inspection.
- Run `structure` after `tree` instead of standalone because it reads the cached JSON and skips the API call.
- Treat `!oob-parent` together with `!overflow` children as a composite-image signal instead of reconstructing layout because children escaping the parent frame cannot be expressed in email HTML.
- Use `[HIDDEN]` tags in `tree` to decide render scope instead of re-checking visibility because `structure` and `analyze` already filter hidden nodes.
- Diagnose from the `curl exit=N http=CODE url=...` line on stderr instead of assuming token or quota because every subcommand emits that specific diagnostic on failure.
