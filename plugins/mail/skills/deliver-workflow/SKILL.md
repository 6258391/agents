---
name: deliver-workflow
description: "Collect real content from human. Populate and validate HTML. Deliver final email."
allowed-tools: [Agent]
---

deliver-workflow — populate real content from human into final deliverable HTML.

## Flow

1. Collect real content and URLs from human.
2. Spawn `mail:developer` to populate content.
3. Spawn `mail:checker` to validate final HTML.
4. Deliver final HTML path to human.
5. Hint `/mail:retro-workflow` for session observations.

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| html_path | yes | — | Path to approved HTML from build-workflow |

## Examples

### Deliver honda email

    html_path: output/welcome.html

### Deliver default email

    html_path: output/promo.html

## Gotchas

- Verify html_path is an approved output from build-workflow instead of accepting any path because deliver-workflow assumes a completed and human-approved build.
- Collect all URLs before spawning `mail:developer` instead of mid-run because partial links produce incomplete HTML.
- Re-run `mail:checker` after content population instead of skipping because real links introduce new violations.
- Escalate checker violations to human after 1 round instead of looping because content-phase failures indicate bad copy or links requiring human correction.
- Return html_path as the handover artifact instead of inlining HTML content because compiled email HTML bloats context.
