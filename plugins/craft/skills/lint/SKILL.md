---
name: lint
description: Read agent or skill file. Check rules via bash. Emit structured checklist.
allowed-tools: [Bash]
---

lint — check prompt file into checklist report

## Flow

1. Receive target file path from caller
2. Run `./lint.sh {target}` via Bash
3. Return stdout output to caller

## Params

| name | required | default | description |
|---|---|---|---|
| target | yes | none | Path to agent or skill file |

## Examples

### lint an agent file

```bash
./lint.sh agents/agent-linter.md
```

### lint a skill file

```bash
./lint.sh skills/lint/SKILL.md
```
