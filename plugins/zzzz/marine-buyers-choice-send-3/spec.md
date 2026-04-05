# Marine Buyers Choice — Send 3 — Spec

Chỉ chứa decisions + navigation + TODO. Style values dùng `extract-figma.sh` để lấy live từ Figma JSON (R13, R16).

## Source

- Figma file: "Marine Buyers Choice Email (Copy)"
- File key: `uOOBcqtjzyzMHV7yrj4HPi`
- Main section: `2131:2128` (Send 3-Designs)
- Desktop root: `2131:2129` (Design 3, 600×2634)
- Mobile root: `2161:862` (Mobile, 414×2420.31)

## Modules

Map module file → Figma node ID. `test-visual.sh module <name> <node-id>` dùng để auto-compute y-range.

| Module | Node ID desktop | Node ID mobile | Type |
|---|---|---|---|
| 00-view-online | `I2131:2263;1303:660` | `I2160:737;1303:663` | HTML |
| 01-hero | `2131:2130` | TBD | PNG (crop ref[64:1546]) |
| 02-body | `2131:2235` | `2161:867` | HTML |
| 03-blue-art | `2131:2238` | TBD | PNG (crop ref[2070:2910]) |
| 04-cta | `2131:2245` | `2161:906` | HTML |
| 05-gallery | `2131:2261` | TBD | PNG (crop ref[3272:3884]) |
| 06-footer | `2185:348` | `2161:1127` | HTML |

## Decisions

### 2026-04-05: 2 fonts Helvetica + Roboto
- Designer confirmed, client approved. Preserve 100% per R9.
- Trade-off: Outlook desktop Roboto fallback Helvetica — accepted.

### 2026-04-05: Helvetica Neue font stack cho body text
- Chromium `Helvetica` → Helvetica plain, khác Figma render via Helvetica Neue.
- Fix: `font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif` match text wrapping.

### 2026-04-05: Mobile CTA giữ 2-col (không stack)
- Client approved design.
- Implementation: card Roboto 700 17px với `letter-spacing: -0.15px` để fit 236px text width (R15 bridge cho Chromium render wider).

### 2026-04-05: Dark mode Mức A+
- Meta `color-scheme` + media query `@media (prefers-color-scheme: dark)`.
- Apple Mail / Outlook.com: full theme support.
- Gmail / Outlook desktop: auto-invert không vỡ (accept).
- Mức B (full cross-client) không khả thi, xem `backlog.md`.

### 2026-04-05: Hero PNG crop từ reference thay Figma frame export (R10)
- Bug: user manual crop imprecise (cắt 33px top+bottom) → offset 11 display pixels → diff 24%.
- Fix: `ref[64:1546]` (Frame 1 - view online strip 64@2x) = pixel-perfect alignment.
- Cùng strategy áp dụng cho blue-art, gallery.

### 2026-04-05: View Online là HTML section riêng (#0), không baked vào Hero PNG
- Phát hiện muộn: text nằm trong `Marine Header` instance → `Frame 12` sub-frame, pull depth=3 ban đầu không thấy.
- Tách thành section 00-view-online HTML → text selectable, link clickable, dark mode adapt.
- Hero PNG sau crop không còn view online strip.

### 2026-04-05: textCase UPPER trên 3 buttons + 1 footer heading
- Phát hiện muộn: extract ban đầu chỉ lấy fontFamily/Weight/Size, miss `textCase: UPPER`.
- Affects: "View Details", "Locate", "learn more" (3 buttons), "STAY CONNECTED" heading.
- Fix: `text-transform: uppercase` CSS. Figma `characters` giữ mixed case (Figma render UPPER on top).

### 2026-04-05: textDecoration UNDERLINE cho View Online + footer inline links
- Phát hiện muộn cùng lý do textCase.
- 6 text ranges với underline: View Online (desktop+mobile), 5 footer inline links.
- Fix: `text-decoration: underline` (không dùng CSS4 `text-decoration-thickness` per R12).

## Phase 2 TODO — 11 URLs

User cung cấp sau. Grep `TODO phase 2` trong `src/modules/` để locate exact position.

**View online**:
1. "View Online" (top bar, view-in-browser URL)

**Buttons**:
2. "View Details" (Body section)
3. "Locate" (Find a Dealer, CTA col 1)
4. "learn more" (HondaCare, CTA col 2)

**Social icons**:
5. Facebook (footer social banner)
6. Instagram (footer social banner)

**Footer inline links**:
7. "Privacy Notice"
8. "MyGarage account"
9. "Unsubscribe from emails like these"
10. "Unsubscribe from All AHM"
11. "Contact us. Or you may write to us at: …" (kéo dài tới hết text, có thể là mailto)

### Dynamic content
- ESP: **Salesforce Marketing Cloud** (phát hiện qua AMPscript syntax trong footer text)
- Tokens preserved literal trong source (R9):
  - `%%=format(Now(),"yyyy")=` — copyright year
  - `%%CAMPAIGNCODE%%`
  - `%%OFFERCODE%%`
- Deploy lên SFMC → tokens tự render
- Phase 1 không xử lý dynamic content

## Known issues — accepted residue

- **Body text ~1% pixel diff**: Chromium Helvetica Neue vs Figma Helvetica render sub-pixel khác. Accept per R12 (không over-tune CSS4).
- **CTA card 2 heading ~0.3% diff**: letter-spacing -0.15px approximation cho font width bridge. Accept.
- **View Online bar ~0.06% diff**: font engine glyph edge anti-aliasing. Accept.
- **Outlook desktop font fallback**: Roboto không load → hiện Helvetica. Chưa verify manual. Tracked in `backlog.md` item 4.

## Assets

| File | Size | Source | Status |
|---|---|---|---|
| `hero.png` | 2.6M | crop ref[64:1546] | OK, cần compress |
| `blue-art.png` | 913K | crop ref[2070:2910] | OK, cần compress |
| `gallery.png` | 1.0M | crop ref[3272:3884] | OK, cần compress |
| `icon-search.png` | 1.3K | node `2131:2249` | OK |
| `icon-shield.png` | 1.2K | node `2131:2256` | OK |
| `icon-arrow-right.png` | 410B | node `I2131:2253;1302:579` | OK |
| `icon-facebook.png` | 1.7K | node `I2185:348;813:1335;813:1082` | OK |
| `icon-instagram.png` | 2.3K | node `I2185:348;813:1335;1001:3553` | OK |
| `ref/desktop.png` | 4.6M | Figma export Design 3 @2x | Reference only |
| `ref/mobile.png` | 2.5M | Figma export Mobile @2x | Reference only |

Total assets ~13MB pre-compress. Target < 3MB after compression.

## Session state

- Desktop rounds 1-5 complete, 1.428% VERY GOOD baseline (5 modules).
- Footer module (06) — Agent A đã write `src/modules/06-footer.mjml` nhưng **chưa test**. Review + re-test cần thiết.
- Mobile — chưa verify. Cần test `test-visual.sh full mobile` + fix media queries trong `_head.mjml`.

## Delivery TODO

1. Complete footer module (Round 6)
2. Full mobile regression pass
3. Compress assets (tinypng / squoosh)
4. Replace 11 URLs + asset URLs
5. Manual cross-client test
6. Handoff package (HTML + compressed assets + deployment notes)
