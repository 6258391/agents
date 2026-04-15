---
# test expects FAIL RS4.1 (flow has 6 steps, maximum is 5)
name: six-step-flow
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

six-step-flow — format json text into indented output.

## Flow

1. Read input file
2. Parse JSON tree
3. Validate schema
4. Sort object keys
5. Apply indent level
6. Write output file

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
six-step-flow --input config.json
```

### Emit compact output

```
six-step-flow --input data.json --indent 0
```
