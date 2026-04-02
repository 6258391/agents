---
name: frontend-responsive
description: "Add responsive breakpoints to HTML modules. Analyze spec, write @media queries, verify desktop unchanged."
user-invocable: false
allowed-tools: Read
---

Add responsive CSS to existing desktop HTML modules without changing desktop appearance.

1. **Analyze**
   - Input: module HTML file + spec Responsive section + viewport config file + tablet/mobile design images (if provided)
   - Output: responsive plan (what changes at each breakpoint, with exact px values)
   - DO: read viewport config file path provided by caller for exact breakpoint px values (tablet width, mobile width)
   - DO: read spec Responsive section for tablet/mobile behavior
   - DO: if design images provided, view them for exact responsive layout
   - DO: if no design images, use spec notes + best practices from [breakpoint-strategies.md](references/breakpoint-strategies.md)
   - DON'T: change desktop CSS. Instead, only add @media queries.
   - WHY DON'T: desktop layout is pixel-perfect from frontend-developer. Changing it breaks the verified output.
   - DON'T: proceed to Adapt or Check in this same invocation. Instead, stop after outputting the responsive plan.
   - WHY DON'T: each step is a separate invocation. Collapsing steps skips the plan review and produces unreviewed breakpoint changes.

2. **Adapt**
   - Input: responsive plan from Analyze step
   - Output: module HTML file modified in-place with @media queries
   - DO: write all responsive CSS inside `/* === Responsive CSS === */` marker
   - DO: group by breakpoint, then by section
   - DO: use only overrides — never repeat unchanged properties
   - DO: keep CSS scoping under `.section-{name}`
   - DO: text readable at all sizes (min ~14px mobile)
   - DO: buttons tappable (min 44x44px mobile)
   - DO: images scale with `max-width: 100%`
   - DON'T: rewrite desktop CSS. Instead, only override properties that change at each breakpoint.
   - WHY DON'T: repeating desktop CSS doubles the file size and creates maintenance drift.
   - DON'T: add `:hover`, `:focus`, or `transition`. Instead, leave for frontend-interactive skill.
   - WHY DON'T: interactions are a separate phase with its own skill.

3. **Check**
   - Input: modified HTML file + original spec
   - Output: pass/fail verification
   - DO: verify desktop layout unchanged (no new CSS outside @media queries)
   - DO: verify all responsive CSS inside `/* === Responsive CSS === */` marker
   - DO: verify no horizontal overflow at tablet and mobile widths
   - DO: verify text readable and buttons tappable at mobile
   - DON'T: skip desktop regression check. Instead, always verify desktop first.
   - WHY DON'T: responsive changes that break desktop are worse than no responsive at all.
   - DON'T: run Check in the same invocation as Adapt. Instead, Check is always a separate invocation after Adapt completes.
   - WHY DON'T: checking immediately after adapting in the same context reuses the same mental state — the check misses what was just written.
