---
name: frontend-spec
description: "Analyze screenshots, ask exact values, write spec files. Invoke per phase: analyze, ask, write."
user-invocable: false
allowed-tools: Read
---

Produces structured spec files from design screenshots with human-confirmed values.

1. **Analyze**
   - Input: design image
   - Output: structure tree (elements, hierarchy, layout type, count)
   - DO: identify DOM structure and element hierarchy from screenshot
   - DO: identify text content and visual hierarchy
   - DO: identify layout type (grid, flex, stack) and element count
   - DON'T: extract or estimate exact values (colors, sizes, spacing) from the image. Instead, list elements found and ask Lead for values.
   - WHY DON'T: AI cannot reliably determine exact hex, font size, or spacing from screenshots. Estimated values require fix loops.

2. **Ask**
   - Input: structure tree from analyze phase
   - Output: list of questions for Lead, one per value needed
   - DO: ask colors per element (exact hex + CSS property + opacity if not 1)
   - DO: ask typography per element (font family, size px, weight, line-height, letter-spacing)
   - DO: ask spacing per element (padding, margin, gap in px)
   - DO: ask layout constraints per element (max-width, min-width if applicable)
   - DO: ask text content per element (exact copy for every heading, paragraph, button label, link text)
   - DO: ask assets per element (file path or URL for every image, icon, logo)
   - DO: ask borders per element if visible (width, style, color, radius)
   - DO: ask shadows per element if visible (x, y, blur, spread, color)
   - DO: ask interactions per element (hover/focus/active states, JS behavior, or "none")
   - DO: ask responsive behavior (tablet/mobile, or "none")
   - DON'T: ask about dynamic content, data sources, navigation logic, or anything outside this list. Instead, focus only on static visual values.
   - WHY DON'T: spec phase creates static visual specs. Implementation decisions belong to build phase. Extra questions waste human time.
   - DON'T: proceed to Write in this same invocation. Instead, stop after outputting questions and wait for Lead to invoke Write with confirmed values.
   - WHY DON'T: Write requires human-confirmed values. Proceeding without them forces estimating values, producing a spec that fails the build phase.

3. **Write**
   - Input: human-confirmed values from Lead
   - Output: spec file following template format
   - DO: follow [spec-template.md](references/spec-template.md). See [spec-example.md](references/spec-example.md) for a complete example.
   - DO: fill Token column using token names provided by Lead with confirmed values.
   - DO: write asset file paths as relative paths from workspace root (e.g., `assets/svg/icon.svg`, `assets/png/hero.png`). List actual files from the assets/ folder in task description.
   - DON'T: use bare file names without path prefix in Assets table. Instead, use relative paths from workspace root.
   - WHY DON'T: developer uses asset paths exactly as written in spec. Bare names like `icon.svg` produce broken images because developer doesn't know the folder.
   - DON'T: invent your own format or add sections not in the template. Instead, follow the template exactly.
   - WHY DON'T: build agent expects specific sections and table structure. Custom formats break the build pipeline.
   - DON'T: write the spec if this invocation did not receive confirmed values from Lead as input. Instead, stop and report that confirmed values are missing.
   - WHY DON'T: a spec written from estimated values propagates errors to every downstream phase.
