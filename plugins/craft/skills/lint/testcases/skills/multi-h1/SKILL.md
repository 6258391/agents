---
# test expects FAIL RS1.3 (multiple H1 headings in one file)
name: multi-h1
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

# multi-h1

multi-h1 — format json text into indented output.

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
multi-h1 --input config.json
```

### Emit compact output

```
multi-h1 --input data.json --indent 0
```

# Second Tool
