# Mail Plugin — Session Status

## Session Date: 2026-04-08

## Current Phase: Execute (scaffolding) — files viết xong, CHƯA chạy Validate (linter + grader)

---

## Bối Cảnh Ban Đầu

User muốn build 1 team mail gồm 4 roles:
1. **Email Developers** — code email từ design
2. **QA Specialist** — kiểm tra chất lượng
3. **Production Manager** — điều phối pipeline từ design đến delivery
4. **Template/System Dev** — xây template system, modular components, sau khi email xong pipeline + test pass thì đề xuất human contribute template vào library

User quyết định: **tập trung developer trước**, đây là core của team. 3 roles còn lại để sau.

---

## Quá Trình Thảo Luận (theo thứ tự)

### 1. Naming & I/O
- Agent name: `developer` (user đặt)
- Input: Figma design URL → Output: responsive HTML email
- CLI tool: MJML

### 2. Skills ban đầu
User chọn 3 skills: `extract-figma`, `compile-mjml`, và "vision test"
- `extract-figma`: Figma API
- `compile-mjml`: mjml CLI  
- "vision test": cần làm rõ

### 3. Naming "vision test" → `compare-screenshot`
- Linter chỉ ra `compare-render` sai vì `render` là verb, không phải domain noun
- Gợi ý: `compare-screenshot` (rõ target) vs `compare-visual` (mơ hồ)
- User chọn: `compare-screenshot`

### 4. I/O boundary fix
- Ban đầu: input là "screenshot email + Figma design"
- Linter chỉ ra: không có skill nào tạo screenshot, playwright chụp là implementation detail trong script
- User sửa input thành: `HTML email + image ref`

### 5. Dual-tool script fix
- Ban đầu: `playwright` + `opencv` cùng khai báo CLI tools
- Linter chỉ ra: 2 tool trong 1 script vi phạm one-function-per-skill
- Fix: `playwright` là CLI tool chính, `opencv` là Python library nội bộ không cần khai báo

### 6. Compatibility rules — thảo luận quan trọng
- User đề xuất cần define safe tags, unsafe patterns, khi nào export PNG
- Thảo luận: tạo skill mới hay nhét vào Rules section?
- User chọn: **nhét vào Rules section của developer.md** vì đây là knowledge base, không phải procedure. Agent đọc rules trước khi code, không phải chạy validation sau.
- Rules chi tiết đã thảo luận:
  - **Safe tags**: `<table>`, `<tr>`, `<td>` cho layout. `<p>`, `<span>`, `<strong>`, `<em>`, `<h1>`-`<h6>`, `<a>`, `<br>` cho text. `<img>` với HTML width/height attributes.
  - **Cấm**: `<div>` layout, flexbox, grid, position, float, HTML5 semantic tags, `<svg>`, `<video>`, `<form>`
  - **CSS**: inline only (Gmail strip `<style>` tag), safe properties only (color, background-color, font-*, text-align, line-height, padding, border, width, vertical-align). Cấm: border-radius, box-shadow, gap, max-width trên tables, CSS variables, calc()
  - **Dark mode**: explicit `background-color` + `color` mọi `<td>` có text. Near-black `#111111` thay `#000000`, near-white `#fefefe` thay `#ffffff`. Transparent PNG cho logos. `<meta name="color-scheme" content="light dark">`.
  - **PNG vs code**: code khi content dynamic/có links, PNG khi static + no links. PNG + 1 link thì wrap `<a>` bọc `<img>`. Không dùng image map (broken trên mobile).
  - **CTA trên background** (user hỏi thêm): VML background + HTML `<a>` CTA là best practice. Fallback solid color khi VML quá phức tạp. Không bao giờ export cả zone CTA+background thành PNG.

### 7. Validate loop
- User yêu cầu: **1 lần fix duy nhất**, compare rồi fix phải làm kỹ
- Nếu compare lại mà vẫn sai → dừng, escalate human

### 8. extract-figma: cross-project + free-text requirements
- User yêu cầu skill này viết cross-project, không hardcode email logic
- Input ban đầu: Figma URL + file key + node IDs → User sửa: chỉ Figma URL, skill tự parse
- User thêm: cần free-text extraction requirements để flexible cho mọi project
- Script 3 modes: `tree` (fetch node tree), `images` (request export URLs), `download` (download asset)
- FIGMA_TOKEN env var, không check trong script (rule 4: trust caller)
- allowed-tools: `Bash` (không phải `curl` — skill gọi script qua Bash, curl là tool bên trong script)

### 9. Review cycles — pattern quan trọng
Sau khi viết mỗi skill/script, quay lại review developer.md xem có inconsistency không:
- **Sau extract-figma**: phát hiện developer pass thừa args (file key, node IDs) mà skill tự parse từ URL. Sửa skill invocation args thành `{Figma URL} {extraction requirements}`.
- **Sau compile-mjml**: check OK, không cần sửa.
- **Sau compare-screenshot**: phát hiện developer step 2 thiếu instruction follow priority order từ report. Sửa thêm "following the report's priority order (structural first, then spacing, then color)".

### 10. On-demand extraction (thay đổi lớn cuối session)
- Ban đầu: extract toàn bộ data trước rồi code
- User chỉ ra: extract hết trước là không phù hợp, thiếu detail khi thực sự code
- Sửa flow:
  - Understand: extract overview only (section names, frame list, page structure, export full-page PNG cho comparison ref)
  - Execute: extract detail per section on-demand khi đang code section đó
- extract-figma được gọi nhiều lần: 1 lần overview ở Understand, N lần detail ở Execute

### 11. Image ref từ Figma
- Ban đầu: human cung cấp image ref riêng
- User chỉ ra: image ref extract từ Figma luôn
- Sửa: extraction requirements bao gồm "export full-page design as PNG for visual comparison ref"
- Human chỉ cần cung cấp: Figma URL + email brief

### 12. User sửa JSON files
- `plugin.json`: user xoá field `author`
- `marketplace.json`: user sửa thành format mới — thêm `name: "agents2"`, `owner: { name: "Tien Nguyen" }`, thêm entry `craft` plugin

---

## Developer Agent Flow (final)

```
Understand:
  1. Nhận Figma URL + email brief từ human
  2. Extract overview only (section names, frames, full-page PNG ref)
  3. Show overview → human confirm scope (sections, breakpoints, static/dynamic zones)

Plan:
  1. Classify zones: HTML-code vs PNG-export
  2. List MJML components per section, flag VML/custom zones

Execute:
  1. Per section: extract detail on-demand → code MJML
  2. Repeat cho mỗi section
  3. Apply compatibility rules while coding
  4. Compile MJML → HTML
  5. Re-read compiled HTML verify structure

Validate:
  1. Compare screenshot vs image ref
  2. Fix ALL diffs theo priority order (structural → spacing → color)
  3. Re-compile + compare 1 lần cuối
  4. Nếu vẫn sai → DỪNG, trả human diff report

Output:
  1. HTML file + comparison report
  2. List PNG zones + VML zones
  3. Flag unresolved diffs
```

---

## Files Created

| # | File | Status |
|---|------|--------|
| 1 | `plugins/mail/.claude-plugin/plugin.json` | DONE (user đã sửa format) |
| 2 | `.claude-plugin/marketplace.json` | DONE (user đã sửa format) |
| 3 | `plugins/mail/agents/developer.md` | DONE — reviewed nhiều lần |
| 4 | `plugins/mail/skills/extract-figma/SKILL.md` | DONE — 11 steps, cross-project |
| 5 | `plugins/mail/skills/extract-figma/extract-figma.sh` | DONE — 3 modes, chmod +x |
| 6 | `plugins/mail/skills/compile-mjml/SKILL.md` | DONE — 4 steps |
| 7 | `plugins/mail/skills/compile-mjml/compile-mjml.sh` | DONE — npx mjml, chmod +x |
| 8 | `plugins/mail/skills/compare-screenshot/SKILL.md` | DONE — 7 steps, cross-project |
| 9 | `plugins/mail/skills/compare-screenshot/compare-screenshot.sh` | DONE — 3 modes, chmod +x |

---

## Backlog

### Tiếp theo: Validate (linter + grader)
- [ ] Chạy linter trên toàn bộ files
- [ ] Chạy grader trên agent + skill files
- [ ] Fix violations (max 3 rounds linter)
- [ ] Re-read JSON files trước khi validate (user đã sửa format)

### Sau đó: Future agents (CHƯA bắt đầu)
User muốn 3 agent nữa nhưng chưa define:
- QA Specialist (tên chưa đặt, cần single word ending -er)
- Production Manager (tên chưa đặt)
- Template/System Dev (tên chưa đặt) — concept: đề xuất contribute tested email vào template library, human approve

### Pending: Template library skill
- Concept đã thảo luận: skill quản lý templates đã test xong
- Template/System Dev agent sẽ đề xuất human contribute
- Chưa define input/output, chưa tạo files
