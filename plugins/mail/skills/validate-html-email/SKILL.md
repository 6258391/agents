---
name: validate-html-email
description: "Check compiled email HTML. Load profile rule list. Emit marker compliance report."
allowed-tools: [Bash]
---

validate-html-email — check compiled email html into rule compliance checklist.

## Flow

1. Receive HTML path profile name and params
2. Load profile rule IDs from profiles directory
3. Require each rule module by ID
4. Invoke rule check with html and params
5. Emit marker report to stdout

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| HTML_PATH | yes | — | Path to compiled HTML file |
| PROFILE | yes | — | Rule profile name |
| --campaign-code | no | skip | Campaign code prefix for alias check |
| --cid | no | skip | CID value for link query check |
| --preview-text | no | skip | Preview text copied from brief |
| --title-text | no | skip | Title text copied from brief |

## Examples

### Run default profile

```bash
./validate-html-email.sh build/welcome.html default
```

### Run honda profile with params

```bash
./validate-html-email.sh build/welcome.html honda --campaign-code A03730-T03730 --cid T03730 --preview-text "Your adventure starts" --title-text "Welcome"
```
