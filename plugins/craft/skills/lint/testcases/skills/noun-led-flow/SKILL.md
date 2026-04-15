---
# test expects PENDING RS4.2 (sem rule, no bash check — flow step 3 starts with a noun)
name: noun-led-flow
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

noun-led-flow — format json text into indented output.

## Flow

1. Read input file
2. Parse JSON tree
3. File saved to disk

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
noun-led-flow --input config.json
```

### Emit compact output

```
noun-led-flow --input data.json --indent 0
```
