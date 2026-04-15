---
# test expects FAIL RS1.2 (extra block "Overview" beyond the 5 allowed)
name: extra-block
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

extra-block — format json text into indented output.

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
extra-block --input config.json
```

### Emit compact output

```
extra-block --input data.json --indent 0
```

## Overview

This tool handles JSON text.
