---
name: frontend-interactive
description: "Add hover/focus/active states, transitions, and Web Components to HTML modules. Analyze spec interactions, implement CSS states and JS behavior, verify."
user-invocable: false
allowed-tools: Read
---

Add interaction behavior to existing HTML modules without changing layout CSS.

1. **Analyze**
   - Input: module HTML file + spec Interactions section + hover design image (if provided)
   - Output: interaction plan (CSS states + JS components needed)
   - DO: read spec Interactions section for expected behavior
   - DO: if hover design provided, view it for exact hover states
   - DO: identify which interactions are CSS-only vs JS-required
   - DON'T: change layout CSS (grid, flexbox, widths, heights, margins, paddings). Instead, only add interaction-specific CSS.
   - WHY DON'T: layout is owned by frontend-developer. Changing it breaks pixel-perfect desktop and responsive CSS.
   - DON'T: proceed to Implement or Check in this same invocation. Instead, stop after outputting the interaction plan.
   - WHY DON'T: each step is a separate invocation. Collapsing steps skips the plan review and produces unreviewed JS/CSS behavior.

2. **Implement**
   - Input: interaction plan from Analyze step
   - Output: module HTML file modified in-place with interaction CSS + JS
   - DO: write CSS states (`:hover`, `:focus`, `:active`) inside `/* === Interaction CSS === */` marker
   - DO: always add `:focus` states on interactive elements for accessibility
   - DO: use only `transform` + `opacity` for transitions (GPU-accelerated, 60fps)
   - DO: write Web Components as Custom Elements with `connectedCallback`
   - DO: add `<script>` before `</body>` for Web Component definitions
   - DO: add Custom Element display rules (default `display: inline` needs override)
   - DON'T: animate `width`, `height`, `margin`, `padding`. Instead, use `transform` for movement and `opacity` for visibility.
   - WHY DON'T: layout property animations cause reflow, dropping below 60fps.
   - DON'T: use external JS libraries. Instead, use vanilla Web Components.
   - WHY DON'T: external dependencies add load time and break offline rendering.
   - DON'T: modify existing HTML structure. Instead, only add `data-*` attributes and wrap with Custom Elements where needed.
   - WHY DON'T: structural changes may break frontend-developer's semantic HTML and responsive CSS.

3. **Check**
   - Input: modified HTML file + original spec
   - Output: pass/fail verification
   - DO: verify all spec Interactions implemented
   - DO: verify `:focus` states on every interactive element
   - DO: verify transitions use only `transform` + `opacity`
   - DO: verify Custom Elements have correct display property
   - DO: verify existing layout unchanged
   - DO: verify `<script>` before `</body>`
   - DON'T: skip focus state check. Instead, verify every clickable element has visible focus indicator.
   - WHY DON'T: missing focus states fail accessibility audits and break keyboard navigation.
   - DON'T: run Check in the same invocation as Implement. Instead, Check is always a separate invocation after Implement completes.
   - WHY DON'T: checking immediately after implementing in the same context reuses the same mental state — the check misses what was just written.
