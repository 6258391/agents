---
# test expects FAIL RS3.3 (one-liner contains filler word "easily")
name: filler-oneliner
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

filler-oneliner — easily format json text into indented output.

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
filler-oneliner --input config.json
```

### Emit compact output

```
filler-oneliner --input data.json --indent 0
```
