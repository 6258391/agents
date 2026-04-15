---
name: json-format
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

json-format — format json text into indented output.

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
json-format --input config.json
```

### Emit compact output

```
json-format --input data.json --indent 0
```
