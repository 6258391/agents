---
# test expects FAIL RS6.1 (4 examples, maximum is 3)
name: four-example
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

four-example — format json text into indented output.

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
four-example --input config.json
```

### Adjust indent level

```
four-example --input data.json --indent 4
```

### Emit compact output

```
four-example --input data.json --indent 0
```

### Read from stdin

```
four-example --input -
```
