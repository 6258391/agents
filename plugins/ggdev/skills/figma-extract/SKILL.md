---
name: figma-extract
description: "Export screenshots and find exact values from Figma REST API. Invoke per phase: export, find."
user-invocable: false
allowed-tools: Bash
---

Extract design data from Figma via REST API. Requires FIGMA_TOKEN environment variable.

1. **Export**
   - Input: Figma file key + node IDs (supports multiple: ?ids=6163:6444,6163:6454,6163:6552)
   - Output: PNGs + SVGs in dirs specified by invoke prompt, data.json in .figma/ hidden folder
   - DO: curl GET /files/{key}/nodes?ids={id1,id2,id3} → batch multiple nodes in 1 call → save to {dir}/.figma/data.json
   - DO: run `${CLAUDE_SKILL_DIR}/scripts/tree.sh {dir}/.figma/data.json` to print tree structure. Read output to identify frame IDs and asset IDs.
   - DO: curl GET /images/{key}?ids={frame_ids}&format=png&scale=2 → download PNGs
   - DO: curl GET /images/{key}?ids={asset_ids}&format=svg → download SVGs. If any return null, retry those with format=png&scale=2 as fallback.
   - DON'T: share .figma/ path with agents. Instead, only share PNG/SVG paths in task descriptions.
   - WHY DON'T: agents reading raw Figma data will guess values instead of asking Lead.
   - DON'T: write inline scripts to fetch or process data. Instead, use curl and tree.sh as specified.
   - WHY DON'T: inline scripts miss error handling and rate limiting that curl handles natively.

2. **Find**
   - Input: data.json path + list of questions from agents
   - Output: candidate values with Figma source for human confirmation + unanswered questions
   - DO: run `${CLAUDE_SKILL_DIR}/scripts/tree.sh {data.json}` to locate nodes matching question element names
   - DO: run `${CLAUDE_SKILL_DIR}/scripts/node.sh {data.json} {node-id}` for each matched node to get exact properties
   - DO: compile candidate values with Figma source reference
   - DO: mark questions with no matching node as unanswered
   - DON'T: write inline scripts to extract node data. Instead, use tree.sh and node.sh as specified.
   - WHY DON'T: inline scripts extract partial data and take more round trips. Bundled scripts are tested against real Figma API responses.
   - DON'T: present candidate values as final answers. Instead, present for human confirmation.
   - WHY DON'T: Figma node names may not match agent element names exactly. Human must verify correctness.
