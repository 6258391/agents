---
# test expects FAIL RS7.3 (gotcha uses "best practice" phrasing)
name: badpractice-gotcha
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

badpractice-gotcha — format json text into indented output.

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
badpractice-gotcha --input config.json
```

### Emit compact output

```
badpractice-gotcha --input data.json --indent 0
```

## Gotchas

- Use `--indent 0` instead of `--indent 2` because disk space matters.
- Best practice is using absolute paths because CWD varies.
