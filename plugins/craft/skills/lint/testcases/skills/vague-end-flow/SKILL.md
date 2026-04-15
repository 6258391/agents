---
# test expects FAIL RS4.6 (flow ends with vague action "Finalize")
name: vague-end-flow
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

vague-end-flow — format json text into indented output.

## Flow

1. Read input file
2. Parse JSON tree
3. Finalize output

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
vague-end-flow --input config.json
```

### Emit compact output

```
vague-end-flow --input data.json --indent 0
```
