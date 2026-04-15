---
name: retro-workflow
description: "Scan session for observations. Classify by category. Write audit file."
allowed-tools: [Write]
---

retro-workflow — record session observations from pipeline into an audit file.

## Flow

1. Scan session for corrections, failures, and gaps.
2. Write record to `output_path`.
3. Return the file path.

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| output_path | no | `output/retro-YYYY-MM-DD.md` | Destination for the audit file |

## Examples

### Record escalation session

    output_path: output/retro-2026-04-15.md

    ## Session
    - Date: 2026-04-15
    - Profile: honda
    - HTML output: output/welcome.html

    ## Human corrections
    - [Stage 4] "CTA text doesn't match brief"
    - [Stage 5] "Footer spacing is wrong"

    ## Pipeline failure points
    - [Stage 3] Checker round 4/3 — H1.4 persisted after max rounds
    - [Stage 2] Developer round 3/2 — footer zone unresolved

    ## Rule gaps
    - Profile auto-detected as default despite honda SFMC block

### Record clean session

    output_path: output/retro-2026-04-15.md

    ## Session
    - Date: 2026-04-15
    - Profile: default
    - HTML output: output/promo.html

    ## Human corrections
    None.

    ## Pipeline failure points
    None.

    ## Rule gaps
    None.

## Gotchas

- Classify as human correction only when human explicitly stated a complaint or correction — not when leader inferred dissatisfaction from silence or approval delay.
- Classify as pipeline failure point only when a round limit was hit or leader triggered an escalation — not when a round resolved normally within limits.
- Classify as rule gap only when leader made a decision with no matching rule in any agent file — not when an existing rule covered the case ambiguously.
- Collapse multiple corrections on the same issue into one entry instead of listing each turn because repetition obscures signal.
- Scan all turns from intake to handover instead of only post-build turns because rule gaps and intake blockers occur before build starts.
- Record only what occurred instead of speculating because fabricated entries mislead the plugin author.
