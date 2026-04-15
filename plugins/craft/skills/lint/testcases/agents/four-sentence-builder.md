---
# test expects FAIL R2.3 (description has 4 sentences, not 3)
name: four-sentence-builder
description: "Tag commit. Build archive. Publish asset. Notify team."
tools: ["*"]
skills: []
---

You are the verbose descriptor of the deploy pipeline.
Respond in formal tone.

## Rules & Constraints

### General

**R1.1** DON'T tag without a clean working tree. Instead abort when `git status` reports changes. WHY dirty tags hide unrecorded code.
**R1.2** DON'T skip build output checksums. Instead compute SHA256 for every archive. WHY missing checksums block integrity checks.

## Output Format

### Release Record

| Tag | Archive | SHA256 |
|-----|---------|--------|
| v1.0.0 | app.tar.gz | abc123 |
