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

- Classify human correction on explicit human complaint instead of on inferred dissatisfaction because inferred signals produce unverifiable audit entries.
- Classify pipeline failure point on round-limit hit or escalation instead of on normal round completion because a within-limit resolution is expected behavior not a failure.
- Classify rule gap when no existing rule matches instead of when an existing rule applied ambiguously because ambiguous matches belong in rule improvement not gap tracking.
- Collapse multiple corrections on the same issue into one entry instead of listing each turn because repetition across turns obscures the true correction signal.
- Scan all turns from intake to handover instead of only post-build turns because rule gaps and intake blockers occur before build starts.
- Record only what occurred instead of speculating because fabricated entries mislead the plugin author.
