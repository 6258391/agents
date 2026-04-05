# Next session — mail-dev continue

## Context

Project: **Marine Buyers Choice Send 3** (Honda Marine email, Figma → MJML pixel-perfect).
5/7 sections done ở **1.428% VERY GOOD** (Round 2-5 passed). Còn Footer + Mobile.
Session trước đã dài, drift khỏi instructions. Fresh start để clean.

## Load đầu session

1. `plugins/zzzz/checklist.md` — 15 rules R1-R15 + workflow phases (đã v2)
2. `plugins/zzzz/backlog.md` — cross-project defer items
3. `plugins/zzzz/marine-buyers-choice-send-3/spec.md` — project decisions + section data
4. File này (`next.md`) để biết pick up từ đâu

## State hiện tại

### Files done (không touch)

- `src/modules/00-view-online.mjml` — HTML, pixel-perfect
- `src/modules/01-hero.mjml` — PNG (extracted từ ref per R10)
- `src/modules/02-body.mjml` — HTML, pixel-perfect (dùng `'Helvetica Neue'` bridge)
- `src/modules/03-blue-art.mjml` — PNG (extracted từ ref)
- `src/modules/04-cta.mjml` — HTML với mj-raw tables, `letter-spacing: -0.15px` cho heading 17px (R15)
- `src/modules/05-gallery.mjml` — PNG (extracted từ ref)
- `src/_head.mjml` — shared mj-head (mj-font Roboto, dark mode meta, view-online media query)
- `src/email.mjml` — main compose với `<mj-include>`
- `assets/*.png` — 8 assets (hero + art + gallery + 5 icons)
- `assets/ref/desktop.png` (1200×5268) và `assets/ref/mobile.png` (828×4841) — Figma full frame exports
- `.workspace/figma_cache/full.json` — 86MB raw Figma file JSON

### Files partial (review, maybe redo)

- `src/modules/06-footer.mjml` — Agent A (killed) đã tạo file 6323 bytes nhưng **chưa test**. Review trước khi dùng, có thể cần rewrite.

### Files to delete (legacy, cleanup trong new session)

- `src/email.mjml` hiện dùng URLs `http://localhost:8000/assets/...` — cần đổi sang `../assets/...` (relative)
- Tất cả module file cùng pattern — cần đổi URL

## Pending tools (build trong session mới)

User confirmed architecture (chưa implement):

### Scripts (cross-project, ở `plugins/zzzz/scripts/`)

3 file `.sh`, **mỗi file 10-15 dòng**, self-contained, AI-only (không làm phức tạp cho human):

1. **`download-figma.sh <FILE_KEY>`**
   - curl download full file JSON
   - Output: `.workspace/figma_cache/full.json`
   - Requires: `FIGMA_TOKEN` env var

2. **`extract-figma.sh <NODE_ID>`**
   - Đọc từ cache JSON (không gọi API)
   - Dump tất cả fields của node (all styles, children, bounding box)
   - Dùng khi viết MJML section

3. **`test-visual.sh module <NAME> <Y1> <Y2> [desktop|mobile]`**
   - Hoặc `test-visual.sh full [desktop|mobile]`
   - Module mode: generate harness wrap module + _head, compile, screenshot, crop ref[y1:y2], OpenCV diff
   - Full mode: compile email.mjml, screenshot, diff vs full ref
   - AI pass y1 y2 trực tiếp (không parse comment, không config file)

### Shared venv: `$HOME/.mail-dev/venv`

- Python 3.11 (KHÔNG dùng 3.14, greenlet build fail)
- **Inline install trong mỗi .sh** (không có `requirements.txt` riêng)
- Idempotent: `python -c "import cv2" 2>/dev/null || pip install opencv-python`
- Deps: playwright==1.49.0, opencv-python==4.10.0.84, numpy==2.2.0
- `python -m playwright install chromium` (~200MB, 1 lần)

### .workspace/ per-project (đã có)

```
.workspace/
├── figma_cache/full.json    (86MB, đã download)
├── harnesses/               (empty, sẽ auto-gen mjml wrappers)
└── out/sections/            (empty, sẽ chứa screenshots + diffs)
```

### Asset URL strategy

- Dùng `../assets/hero.png` (relative) thay vì `http://localhost:8000/...`
- HTML compiled đều ở cùng depth trong `dist/` (flat, không nested subfolder)
- Không cần HTTP server — Playwright load via `file://` protocol
- Deploy: `sed 's|../assets/|https://cdn.com/assets/|g'`

## Workflow cho session mới

### Bước 1: Verify state

```bash
cd /Users/tien.h.nguyen/Repositories/agents/plugins/zzzz/marine-buyers-choice-send-3
ls .workspace/figma_cache/full.json   # confirm 86MB exists
ls src/modules/                        # 7 files (06-footer chưa test)
ls assets/ref/                         # desktop.png, mobile.png
```

### Bước 2: Write 3 scripts ngắn

Trong `plugins/zzzz/scripts/`:
- `download-figma.sh` — ~5 lines
- `extract-figma.sh` — ~15 lines (Python heredoc parse JSON)
- `test-visual.sh` — ~30-50 lines (Python heredoc với playwright + opencv)

**RULE**: mỗi script minimal, không logging thừa, không validation cho human, không idempotent check.

### Bước 3: Setup venv

```bash
/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv "$HOME/.mail-dev/venv"
```

Deps install lazy trong từng .sh.

### Bước 4: Update modules sang relative paths

Sed replace tất cả `http://localhost:8000/assets/` → `../assets/` trong src/modules/*.mjml.

### Bước 5: Regression test

Run test-visual.sh full desktop → verify vẫn ~1.428% (baseline chưa có footer).

### Bước 6: Review + fix footer module

Đọc `src/modules/06-footer.mjml` (Agent A tạo). Check content, re-extract footer data từ cache, test lại.

### Bước 7: Integrate footer, final desktop test

Uncomment footer trong email.mjml, compile full, test desktop. Target <2%.

### Bước 8: Mobile verification

Screenshot mobile viewport, compare vs mobile.png, fix media queries trong _head.mjml.

## Rules quan trọng (from checklist)

- **R9**: Preserve 100% Figma (NBSP, special chars, dynamic tokens)
- **R10**: PNG sections → extract từ reference crop, không trust Figma frame export
- **R11**: AI có thể xem ảnh qua Read tool — dùng cho R7 review + diff image inspection
- **R12**: Không dùng CSS4 (text-decoration-thickness, text-underline-offset) — email client không support
- **R13**: Raw Figma JSON = source of truth, không transcribe vào spec.md
- **R14**: LOOK at diff image sau mỗi compare, không trust verdict số
- **R15**: Bridge font engine width bằng letter-spacing (measure với Playwright, apply -0.15px kiểu)

## Anti-patterns đã học

- **Không** dùng sub-agents cho pixel-perfect iterative work (sandbox block Python)
- **Không** over-engineer scripts cho human convenience khi tool chỉ AI dùng
- **Không** đoán crop amount, **extract từ ref** guarantee pixel-perfect (R10)
- **Không** skip textCase/textDecoration khi extract (dễ miss)
- **Không** chase < 0.5% bằng CSS4 hacks — chấp nhận font engine residue

## Decisions đã chốt (không bàn lại)

- Font: Helvetica + Roboto (2 font theo designer approved)
- Dark mode: Mức A+ (Apple đẹp, Gmail/Outlook không vỡ)
- Mobile CTA: giữ 2-col (approved by client)
- URL placeholders: `href="#"` với comment `<!-- TODO phase 2: ... -->`
- 11 URLs cần trong phase 2 (liệt kê trong spec.md)
- SFMC AMPscript tokens giữ nguyên trong text
- Text case "VIEW DETAILS"/"LOCATE"/"LEARN MORE": Figma có `textCase: UPPER`, dùng `text-transform: uppercase`
- Project folder name: `mail-dev` (cho tool), `$HOME/.mail-dev/venv` cho shared venv

## Token budget warning

Session trước drift khi context dài. Session mới **giữ response ngắn**:
- Không liệt kê 5-10 options mỗi lần → decide + ask 1-2 câu
- Không architectural deep dive → code thẳng khi user đã confirm direction
- Respect "AI-only, không tiện human" instruction
