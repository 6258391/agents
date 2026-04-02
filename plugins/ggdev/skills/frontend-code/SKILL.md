---
name: frontend-code
description: "Code HTML+CSS modules from spec values. Plan implementation, write semantic HTML with scoped CSS, verify against spec."
user-invocable: false
allowed-tools: Read
---

Produce pixel-perfect HTML module files from spec values and design tokens.

1. **Plan**
   - Input: spec file + tokens.md + shared.css
   - Output: implementation plan (structure → CSS mapping)
   - DO: read spec Structure section to understand element hierarchy
   - DO: map spec Colors/Typography values to token names from tokens.md
   - DO: identify which CSS variables exist in shared.css
   - DON'T: start coding before reading all inputs. Instead, read spec + tokens + shared.css first.
   - WHY DON'T: coding without full context causes wrong variable names and missing elements.
   - DON'T: proceed to Code or Check in this same invocation. Instead, stop after outputting the plan.
   - WHY DON'T: each step is a separate invocation. Collapsing steps skips the plan review checkpoint and produces unreviewed output.

2. **Code**
   - Input: implementation plan from Plan step
   - Output: single HTML file with scoped CSS. See [output-template.md](references/output-template.md) for file structure.
   - DO: write semantic HTML (header, nav, main, section, footer, article)
   - DO: scope ALL CSS under `.section-{name}`
   - DO: use `var(--token-name)` from shared.css — never hardcode hex values
   - DO: use spec values exactly (18px is not 20px)
   - DO: link shared.css in `<head>`
   - DO: use assets from spec Assets table with exact file paths
   - DO: CSS property order: layout → size → typography → visual
   - DO: use CSS Grid for 2D layout, Flexbox for 1D alignment
   - DON'T: write reset, `:root`, or `body` CSS. Instead, these live in shared.css.
   - WHY DON'T: duplicate global CSS conflicts with shared.css and breaks other modules.
   - DON'T: write `@media` queries. Instead, leave `/* === Responsive CSS === */` marker.
   - WHY DON'T: responsive is a separate phase handled by a later frontend-developer invocation.
   - DON'T: write `:hover`, `:focus`, `:active`, `transition`. Instead, leave `/* === Interaction CSS === */` marker.
   - WHY DON'T: interactions are a separate phase handled by a later frontend-developer invocation.
   - DON'T: add elements not in spec Structure. Instead, reproduce exactly what spec describes.
   - WHY DON'T: extra elements break pixel-perfect match and add untested code.
   - DON'T: use external URLs for assets. Instead, use local file paths from spec Assets table.
   - WHY DON'T: external URLs break offline rendering and add dependencies.

3. **Check**
   - Input: completed HTML file + original spec
   - Output: pass/fail verification
   - DO: verify every element in spec Structure exists in HTML
   - DO: verify every color uses `var()` matching token name from spec
   - DO: verify spacing matches spec exactly (px precision)
   - DO: verify `<link rel="stylesheet" href="shared.css">` present
   - DO: verify all CSS scoped under `.section-{name}`
   - DO: verify assets from spec used with correct paths
   - DON'T: skip verification. Instead, check every spec section against output.
   - WHY DON'T: unverified output triggers QA failure → fix loop. Self-check saves a full cycle.
   - DON'T: run Check in the same invocation as Code. Instead, Check is always a separate invocation after Code completes.
   - WHY DON'T: running Check immediately after Code in the same context reuses the same mental state that produced errors — the check finds nothing.
