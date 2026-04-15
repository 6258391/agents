---
# test expects FAIL RS3.2 (one-liner does not match formula "<name> — verb input into output")
name: freeform-oneliner
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

freeform-oneliner converts files fast.

## Flow

1. Read input file
2. Parse JSON tree
3. Write indented output

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
freeform-oneliner --input config.json
```

### Emit compact output

```
freeform-oneliner --input data.json --indent 0
```
