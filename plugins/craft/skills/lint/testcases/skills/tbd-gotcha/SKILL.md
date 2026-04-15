---
# test expects FAIL RS7.4 (Gotchas section is a placeholder "TBD")
name: tbd-gotcha
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

tbd-gotcha — format json text into indented output.

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
tbd-gotcha --input config.json
```

### Emit compact output

```
tbd-gotcha --input data.json --indent 0
```

## Gotchas

- TBD
