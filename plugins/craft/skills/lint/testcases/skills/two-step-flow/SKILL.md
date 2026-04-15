---
# test expects FAIL RS4.1 (flow has only 2 steps, minimum is 3)
name: two-step-flow
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

two-step-flow — format json text into indented output.

## Flow

1. Read input file
2. Write indented output

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
two-step-flow --input config.json
```

### Emit compact output

```
two-step-flow --input data.json --indent 0
```
