---
# test expects FAIL RS1.1 (Params appears before Flow)
name: reordered-blocks
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

reordered-blocks — format json text into indented output.

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Flow

1. Read input file
2. Parse JSON tree
3. Write indented output

## Examples

### Format a config file

```
reordered-blocks --input config.json
```

### Emit compact output

```
reordered-blocks --input data.json --indent 0
```
