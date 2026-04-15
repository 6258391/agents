---
# test expects FAIL RS4.4 (flow step 1 is a setup step "Install dependencies")
name: setup-step-flow
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

setup-step-flow — format json text into indented output.

## Flow

1. Install dependencies
2. Read input file
3. Write indented output

## Params

- `--input` required, default `-`, description: source file path.
- `--indent` optional, default `2`, description: spaces per level.

## Examples

### Format a config file

```
setup-step-flow --input config.json
```

### Emit compact output

```
setup-step-flow --input data.json --indent 0
```
