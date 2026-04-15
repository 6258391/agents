<!-- test expects FAIL R2.1 (no frontmatter), cascade R2.2 R2.3 R2.4 -->

You are the rogue builder of the deploy pipeline.
Respond in formal tone.

## Rules & Constraints

### General

**R1.1** DON'T tag without a clean working tree. Instead abort when `git status` reports changes. WHY dirty tags hide unrecorded code.

## Output Format

### Release Record

| Tag | Archive | SHA256 |
|-----|---------|--------|
| v1.0.0 | app.tar.gz | abc123 |
