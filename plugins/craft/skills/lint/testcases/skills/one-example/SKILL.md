---
# test expects FAIL RS6.1 (only 1 example, minimum is 2)
name: one-example
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

one-example — format json text into indented output.

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
one-example --input config.json
```
