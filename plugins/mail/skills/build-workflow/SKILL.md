---
name: build-workflow
description: "Run intake and pre-check. Build and validate email. Loop until human approves."
allowed-tools: [Agent]
---

build-workflow — run email production stages from intake into approved HTML.

## Flow

1. Run intake and flag blockers to human.
2. Spawn `mail:developer` to build and compare.
3. Spawn `mail:checker` to validate output.
4. Present result to human for review.
5. Fix and re-check until human approves.

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| figma_url | yes | — | Figma file URL for the email design |
| profile | yes | — | Client profile name |
| honda_params | no | pending | Honda campaign parameters |

## Examples

### Build honda email

    figma_url: https://figma.com/file/abc123
    profile: honda

### Build default email

    figma_url: https://figma.com/file/xyz789
    profile: default

## Gotchas

- Flag missing Figma URL or unresolved profile to human before spawning `mail:developer` instead of proceeding because developer cannot build without these inputs.
- Treat honda_params as pending instead of blocking at intake because checker phase 2 surfaces which params remain missing.
- Loop `mail:developer` visual compare up to 2 rounds instead of continuing indefinitely because infinite fix loops waste time on problems needing human judgment.
- Loop `mail:checker` fix rounds up to 3 instead of continuing indefinitely because violations surviving 3 rounds signal a rule or source problem not a tweak.
- Resume from existing session artifacts instead of restarting from intake because redundant extraction wastes API calls.
- Pass profile and all known params in every agent brief instead of relying on prior context because sub-agents start without access to prior state.
