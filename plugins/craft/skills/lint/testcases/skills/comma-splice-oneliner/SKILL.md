---
# test expects FAIL RS3.1 (one-liner has 2 commas)
name: comma-splice-oneliner
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

comma-splice-oneliner — format raw, stream, batch json into indented output.

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
comma-splice-oneliner --input config.json
```

### Emit compact output

```
comma-splice-oneliner --input data.json --indent 0
```
