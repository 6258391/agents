---
# test expects FAIL RS3.1 (one-liner has 2 sentences)
name: multi-sentence-oneliner
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

multi-sentence-oneliner — format json text into indented output. Validate shape on read.

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
multi-sentence-oneliner --input config.json
```

### Emit compact output

```
multi-sentence-oneliner --input data.json --indent 0
```
