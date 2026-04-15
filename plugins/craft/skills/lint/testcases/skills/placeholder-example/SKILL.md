---
# test expects FAIL RS6.4 (example uses placeholder "<your-file>")
name: placeholder-example
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

placeholder-example — format json text into indented output.

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
placeholder-example --input config.json
```

### Adjust indent level

```
placeholder-example --input <your-file> --indent 4
```
