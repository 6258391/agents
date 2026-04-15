---
# test expects FAIL RS2.1 (allowed-tools is empty array)
name: empty-tools
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: []
---

empty-tools — format json text into indented output.

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
empty-tools --input config.json
```

### Emit compact output

```
empty-tools --input data.json --indent 0
```
