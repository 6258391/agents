---
# test expects FAIL RS7.1 (14 gotchas, maximum is 13)
name: fourteen-gotchas
description: "Parse JSON. Validate shape. Emit output."
allowed-tools: ["Read", "Write"]
---

fourteen-gotchas — format json text into indented output.

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
fourteen-gotchas --input config.json
```

### Emit compact output

```
fourteen-gotchas --input data.json --indent 0
```

## Gotchas

- Use `--indent 0` instead of `--indent 2` because disk space matters.
- Use file input instead of stdin because buffering differs.
- Use absolute paths instead of relative because CWD varies.
- Use UTF-8 input instead of Latin-1 because decoder assumes UTF-8.
- Use single quotes instead of double because shell interpolates tokens.
- Use trailing newline instead of bare EOF because parsers require it.
- Use LF line endings instead of CRLF because lexer rejects carriage returns.
- Use lowercase keys instead of mixed case because schema matches lowercase.
- Use arrays instead of tuples because JSON lacks tuple types.
- Use integers instead of floats because rounding drifts across runs.
- Use flat objects instead of nested because depth limits trigger errors.
- Use ASCII keys instead of Unicode because key hashing assumes ASCII.
- Use explicit null instead of missing fields because readers distinguish them.
- Use `--input file` instead of pipe because streams skip size checks.
