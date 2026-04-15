---
# test expects FAIL RS4.3 (flow step 3 exceeds 8 words)
name: long-step-flow
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

long-step-flow — format json text into indented output.

## Flow

1. Read input file
2. Parse JSON tree
3. Write the fully indented and properly formatted JSON output to disk

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
long-step-flow --input config.json
```

### Emit compact output

```
long-step-flow --input data.json --indent 0
```
