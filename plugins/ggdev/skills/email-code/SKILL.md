---
name: email-code
description: "Code email modules using MJML from spec values. Invoke per phase: plan, code, compile, check."
user-invocable: false
allowed-tools: Read, Bash
---

Produce email HTML from specs using MJML. Each module is a self-contained MJML file — no shared layout files between agents.

1. **Plan**
   - Input: spec file + tokens
   - Output: MJML component mapping for the module
   - DO: identify all elements from spec (header, content sections, footer)
   - DO: identify dynamic variables from spec (user names, URLs, dates) → use `{{VariableName}}` pattern
   - DO: map spec Structure to MJML components (mj-section, mj-column, mj-text, mj-image, mj-button, mj-wrapper)
   - DON'T: plan raw HTML tables. Instead, plan MJML components only.
   - WHY DON'T: MJML compiles to safe tables automatically. Manual tables miss VML conditionals for Outlook.
   - DON'T: proceed to Code, Compile, or Check in this same invocation. Instead, stop after outputting the plan.
   - WHY DON'T: each phase is a separate invocation. Collapsing phases produces unreviewed output.

2. **Code**
   - Input: component mapping from Plan step
   - Output: complete .mjml file (with `<mjml>`, `<mj-head>`, `<mj-body>` wrapper). See [mjml-template.md](references/mjml-template.md) for patterns.
   - DO: write complete standalone MJML (header, content, footer all in one file)
   - DO: set global defaults in `<mj-attributes>` (font-family, font-size, colors from tokens)
   - DO: use `<mj-style inline="inline">` for link styles (Gmail requires inline)
   - DO: set `<mjml lang="en">` for accessibility
   - DO: web-safe font stacks only (Arial, Helvetica, Georgia, Verdana)
   - DO: use `{{VariableName}}` for dynamic content
   - DO: use `<mj-preview>` for preheader text
   - DO: set explicit `width` on every `<mj-image>`
   - DO: set `alt` text on every image. Decorative images get `alt=""`
   - DO: set `href` on every `<mj-button>`
   - DO: minimum font-size 16px body text (WCAG 2.2 / EAA compliance)
   - DO: minimum contrast ratio 4.5:1
   - DO: include unsubscribe link in footer
   - DO: use hex colors only, px units only
   - DON'T: put `<p>` tags inside `<mj-text>`. Instead, use separate `<mj-text>` per paragraph.
   - WHY DON'T: `<p>` inside `<mj-text>` creates double margin.
   - DON'T: rely on default padding. Instead, set `padding` explicitly on every section and column.
   - WHY DON'T: MJML default padding varies. Explicit padding ensures spec values are exact.
   - DON'T: use `<mj-section>` for background images spanning rows. Instead, use `<mj-wrapper>`.
   - WHY DON'T: `<mj-section>` background doesn't span child sections.

3. **Compile**
   - Input: complete .mjml file from Code step
   - Output: compiled .html file
   - DO: substitute all `{{VariableName}}` with sample values for preview
   - DO: run `npx mjml {module.mjml} -o {output.html}`
   - DON'T: edit compiled HTML manually. Instead, edit .mjml source and recompile.
   - WHY DON'T: manual edits break MJML's safety guarantees.
   - DON'T: run Check in the same invocation as Compile. Instead, Check is always a separate invocation after Compile completes.
   - WHY DON'T: checking immediately after compiling in the same context reuses the same mental state — the check misses what was just produced.

4. **Check**
   - Input: compiled HTML + original spec
   - Output: pass/fail verification
   - DO: verify all text content from spec exists in compiled HTML
   - DO: verify all images have alt text and absolute https:// URLs
   - DO: verify font-family is web-safe
   - DO: verify body text font-size >= 16px
   - DO: verify preheader text present
   - DO: verify unsubscribe link in footer
   - DO: verify all `{{Variables}}` are substituted (no raw `{{` remaining)
   - DON'T: check internal CSS structure of compiled HTML. Instead, trust MJML compiler.
   - WHY DON'T: MJML generates complex table/CSS that is cross-client tested.
