# Email Cutting — Checklist & Rules

Source of truth khi cắt email từ Figma sang MJML/HTML. **Load file này trước tiên ở mọi project cắt email.**

File này merge `notes.md` cũ (rules) + workflow checklist + tool gotchas. Dùng cross-project.

## Cấu trúc

- **Part 1** — Core Rules (R1-R7+): principles, reference từ workflow bên dưới
- **Part 2** — Workflow Checklist: phase 0 → 14, mỗi step cite rule khi áp dụng
- **Part 3** — Tool Gotchas: Figma API, curl, sharp, MJML quirks
- **Part 4** — Decision Log Template: format ghi decision trong `spec.md` của project

---

# PART 1 — CORE RULES

## R1. Ảnh clip trong frame — export theo khung frame

Ảnh gốc trong Figma có thể lớn hơn khung frame chứa nó (ví dụ ảnh 1152×849 trong frame 600×773). Figma hiển thị phần ảnh bị clip bởi frame bounds.

**Quy tắc**: khi export, export theo **khung frame** (kích thước frame hiển thị), không export ảnh gốc full size.

**Cách làm**: gọi Figma API `GET /v1/images` với node ID của **frame chứa** (không phải node ID của rectangle ảnh gốc).

## R2. HTML vs PNG — tiêu chí chọn

**Dựng HTML khi có ít nhất 1 yếu tố**:
- Text dài hoặc text cần selectable/accessible
- Link/button cần click được
- Nội dung cần adapt dark mode (màu chữ/nền)
- Layout đơn giản (row/column, không overlap phức tạp)
- Cần responsive reflow (desktop column → mobile stack)

**Export PNG khi có ít nhất 1 yếu tố**:
- Graphic/illustration phức tạp (gradient, shadow, blend, nhiều layer chồng)
- Element overlap lên nhau (email client không support `position: absolute` ổn định)
- Text đã tích hợp vào ảnh nghệ thuật (logo, art title)
- Không có text/link cần tương tác

**Nguyên tắc chọn**: ưu tiên HTML nếu đủ điều kiện. PNG chỉ khi HTML không dựng được hoặc không đáng công.

## R3. Data-first, setup-sau, code-cuối

**Thứ tự đúng cho AI**:
1. Pull toàn bộ design data (style values + assets list) trong 1 pass tập trung
2. Setup project (npm init, install deps, tạo folders) — dựa trên data đã biết
3. Viết code (MJML) với data sẵn trong tay

**Lý do**:
- Data-first = ít context switch, AI gom data tốt nhất khi tập trung 1 pass
- Data informs setup: biết dùng font gì, tool gì, breakpoint bao nhiêu → setup chính xác
- Setup là mechanical, không phụ thuộc, làm lúc nào cũng được
- Tránh rewrite: data trước → viết code 1 lần đúng, không phải sửa khi phát hiện sai giá trị sau

**Anti-pattern**: setup project trước → code → gặp chỗ thiếu data → pull lẻ tẻ → quên rule cũ → drift.

## R4. Alert on unusual — không tự quyết

Khi pull data từ Figma (hoặc bất kỳ nguồn nào), nếu phát hiện điều **khác với instruction user đã đưa** hoặc **không nhất quán trong design**, phải alert ngay cho human trước khi xử lý.

**Ví dụ cần alert**:
- User nói dùng 1 font (Helvetica), design thực tế có 2 font (Helvetica + Roboto)
- User nói màu brand là X, design có section dùng màu Y khác
- Design có 2 phần cùng loại nhưng giá trị khác nhau (1 button radius 4, button khác radius 8)
- Figma có property bất thường (blend mode lạ, effect phức tạp, font weight không chuẩn)
- Text content trong design khác với brief
- Font weight mới xuất hiện muộn trong quá trình pull (ví dụ đã có Roboto 700, đột nhiên section mới có Roboto 500)
- Dynamic template tokens lẫn trong text (SFMC AMPscript, Mailchimp merge tags)
- Style override kéo dài bất thường (link style bao trùm cả khối không phải link)

**Cách alert**:
1. Chỉ rõ giá trị khác thường + vị trí (section nào, node nào, character range nào)
2. Đưa 2-3 lựa chọn kèm trade-off
3. Dừng lại chờ quyết định, không tự chọn

**Anti-pattern**: tự quyết theo logic AI ("button dùng Roboto thì giữ Roboto") → sai instruction user → phải sửa lại.

## R5. Icons email luôn PNG, không bao giờ SVG

Icon/illustration nhỏ trong email HTML phải export **PNG** (ưu tiên @2x cho retina). **Không dùng SVG inline**.

**Lý do**:
- **Outlook desktop (Windows) không render SVG** — icon sẽ biến mất hoặc hiện broken image
- Outlook desktop chiếm lượng user đáng kể trong email, không đáng liều
- PNG @2x an toàn 100% mọi client
- Trade-off nhỏ: PNG không adapt dark mode màu, file lớn hơn SVG → chấp nhận được với icon nhỏ

**Khi export PNG**:
- Scale 2x (retina)
- Nền trong suốt nếu icon cần work trên nhiều màu nền
- Kích thước ảnh gốc = kích thước display × 2 (ví dụ icon 24×24 → export 48×48)

## R6. Cần human support → nhờ human, không work-around

Khi task gặp hạn chế kỹ thuật mà human chỉ cần 1 thao tác ~30s để giải quyết, **nhờ human làm**, không tự nghĩ giải pháp hacky phức tạp.

**Ví dụ**:
- Figma REST API không tạo group được → nhờ human mở Figma group tay, thay vì compositing ảnh bằng sharp
- File config cần sensitive value → nhờ human paste, thay vì đoán hoặc scrape
- Component design chưa rõ → nhờ human chụp screenshot cụ thể, thay vì guess từ description
- Ảnh cần ẩn 1 layer → nhờ human ẩn trong Figma, thay vì crop PNG post-processing
- Ảnh cần group 2 sibling node → nhờ human group trong Figma app

**Cách đề xuất**:
1. Liệt kê các option kèm trade-off (bao gồm cả option "human làm tay")
2. Nếu option human là nhanh/sạch nhất, đề xuất option đó
3. Để human chọn

**Anti-pattern**: né tránh hỏi human vì sợ phiền → code work-around dài dòng, dễ bug, hard to maintain.

## R7. Review assets sau export — dừng lại nhờ human xem

Sau khi export xong batch assets từ Figma (PNG/ảnh), **dừng lại** và nhờ human mở xem từng file trước khi viết code dùng chúng.

**Lý do**:
- AI không "nhìn" được ảnh một cách visual, chỉ biết dimensions và file size
- Ảnh export có thể chứa element không mong muốn: "view online" link, watermark, placeholder text, element bị lộ do layer ẩn chưa tắt
- Ảnh có thể bị crop sai, thiếu phần, hoặc bị trộn với layer khác
- Phát hiện sớm = re-export 1 file, rẻ; phát hiện muộn = viết code xong mới sửa, đắt

**Cách làm**:
1. Sau khi download xong batch assets, list ra file + dimensions + size
2. Yêu cầu human: "Mở từng file trong `assets/` review giúp. Báo lại file nào cần re-export hoặc sửa trong Figma."
3. Chờ human confirm OK toàn bộ → mới tiếp tục code
4. Nếu có file cần sửa: human chỉnh trong Figma hoặc file ảnh → AI re-export / re-pull nếu cần.

## R8. Backlog.md vs project files — scope rõ ràng

`plugins/zzzz/backlog.md` và `plugins/zzzz/checklist.md` (file này) là **cross-project** — shared cho mọi email project.

**Project-specific** (font mapping, content text, color tokens, URL targets, per-email overrides) → lưu trong `plugins/zzzz/{project-name}/spec.md`, **không** thêm vào backlog/checklist.

**Nếu không chắc** fact là cross-project hay project-specific → **hỏi user trước khi ghi**.

## R10. Asset crop: không tin manual crop, extract từ reference khi cần pixel-perfect

**Quy tắc**: nếu asset (PNG hero) cần crop để remove phần không mong muốn, **không tin manual crop của user** để đạt pixel-perfect alignment. Thay vào đó:

1. Export reference PNG của parent node từ Figma
2. Dùng OpenCV/Pillow extract chính xác region cần, tính bằng @2x pixel từ spec
3. Save đè lên asset

**Lý do**:
- Manual crop dễ lệch 1-few pixel, tạo offset cumulative khi overlay vào email
- Tool crop user dùng có thể không chính xác @2x
- Đã xảy ra thực tế: user crop hero.png 33 display pixel (thay vì 32), lại crop cả top + bottom, tạo 11 display pixel shift → diff 24% thay vì ~0%
- Khi extract từ reference, content guaranteed match reference pixel-perfect

**Khi nào áp dụng**: bất cứ khi nào cần pixel-perfect compare giữa rendered HTML với reference Figma.

**Khi nào không cần**: demo/draft work, hoặc khi không có tooling compare.

## R13. Raw Figma JSON = source of truth, spec.md chỉ cho decisions

**Quy tắc**: **không transcribe** style values từ Figma vào `spec.md` bằng tay. Transcription bị lossy — dễ miss field. Thay vào đó:

1. Cache raw Figma JSON cho mỗi node cần dùng vào `tools/figma_cache/{node_id}.json`
2. Viết script `tools/figma_extract.py <node-id>` dump TẤT CẢ field (không curate)
3. Mỗi round trước khi viết MJML, chạy extract → dùng output làm ground truth
4. `spec.md` chỉ ghi:
   - Decisions (font mapping override, URL TODOs, classification PNG vs HTML)
   - Cross-section tokens (brand colors, font family list)
   - Section-to-node-id mapping (để chạy extract)
   - **KHÔNG** duplicate style values

**Bằng chứng cần rule này**: đã miss `textCase: UPPER` trên 3 button (bởi vì spec.md chỉ extract fontFamily/weight/size) và `textDecoration: UNDERLINE` trên View Online. Mỗi miss = rework 1 round compare.

**Workflow đúng**:
```
# Trước Round N
python tools/figma_extract.py <section-node-id>
# Đọc output, note xuống tất cả field
# Viết MJML theo đúng data extract
# Compile → screenshot → compare → view diff image
```

**Anti-pattern**: viết MJML theo spec.md → compile → diff cao → phát hiện miss field → pull lẻ tẻ → fix.

## R15. Bridge font engine width difference bằng letter-spacing (không phá CSS4)

**Quy tắc**: khi Chromium render font (đặc biệt Roboto) rộng hơn Figma cùng font/size/weight, gây text wrap khác → tạo cascade layout shift, fix bằng **letter-spacing** nhỏ (âm), không dùng CSS4.

**Cách đo chính xác**:
1. Dùng Playwright + `getBoundingClientRect().width` để measure Chromium render width của text
2. So với Figma node bbox width
3. Tính diff
4. Thử letter-spacing từ -0.1px → -0.3px, chọn value làm rendered match Figma width

**Ví dụ thực tế**: "Learn More About HondaCare®" Roboto 700 17px — Chromium = 240.14px, Figma = 236px, diff 4.14px. Letter-spacing `-0.15px` khớp.

**Lý do letter-spacing OK** (không phá R12):
- CSS2 property, support 100% email client (Gmail, Outlook, Apple Mail, etc.)
- Hiệu ứng nhỏ (sub-pixel per char) không làm text nhìn khác biệt với người dùng
- Chỉ compensate font engine metric difference, không phải design change

**Khi nào dùng**: chỉ khi font engine width diff gây layout break (wrap line sai, overflow, cascade shift). Không dùng để fine-tune vị trí pixel (đó là over-tune).

**Đo trước, tune sau**: đừng đoán letter-spacing value, đo bằng Playwright script rồi apply.

## R14. Sau mỗi compare, LOOK at diff image — không trust verdict số

**Quy tắc**: verdict "ACCEPTABLE 2%" không đủ thông tin. Cùng 2% có thể là:
- Anti-aliasing edges throughout text (benign font engine noise, accept)
- 1 vùng lớn missing/wrong element (critical, fix)
- Layout shifted (fixable)

**Hành động bắt buộc sau mỗi run compare**:
1. Đọc % + verdict (reference only, không dùng để quyết định)
2. **Dùng Read tool mở `diff_<name>.png`** để xem vùng đỏ ở đâu
3. Phân tích pattern:
   - Red trên glyph edges everywhere → font engine noise, accept
   - Red trên 1 region tập trung → element sai, fix
   - Red đều trên pattern grid → layout offset, fix
4. Quyết định: fix hay accept dựa trên nội dung diff, không phải số

**Anti-pattern**: thấy 2% → "OK acceptable" → move on. Có thể đó là 1 element quan trọng (logo, CTA) bị missing.

**Note**: `compare.py` đã print bounding boxes của top regions. Dùng kèm với visual diff để locate chính xác.

## R12. Email email client support > pixel-perfect browser — không over-tune CSS4

**Quy tắc**: khi tối ưu pixel-perfect bằng compare tool (Playwright Chromium), **không dùng CSS4/modern features** mà email client không support rộng rãi. Chấp nhận diff còn lại (sub-percent) thay vì risk broken render trên client thực.

**Blacklist cho email** (dù Chromium support):
- `text-decoration-thickness` — không support Outlook, Gmail limited
- `text-underline-offset` — không support Outlook, Gmail limited
- `aspect-ratio` — limited
- `gap` trên flex/grid — limited
- CSS custom properties (`--var`) — limited Outlook
- `calc()` phức tạp — limited
- `filter` — limited
- Logical properties (`margin-inline`, `padding-block`) — limited

**OK cho email (safe)**:
- `text-decoration: underline` (không custom thickness/offset)
- `padding`, `margin`, `border`
- `background-color`, `color`
- `font-family`, `font-size`, `font-weight`, `line-height`
- Table-based layout
- Media queries (hầu hết client)

**Nguyên tắc**: compare tool (Playwright) là **Chrome**, nhưng target là **email client**. Browser diff không phải target cuối cùng. Pass verdict "EXCELLENT" (< 0.5%) hoặc "VERY GOOD" (< 2%) là đủ — phần còn lại là font rendering engine difference không tránh được.

**Anti-pattern**: thấy 0.06% diff → chase xuống 0% bằng CSS4 → broken Outlook. Đúng là phá 1 client chính để ép đẹp 1 client browser không phải target.

## R11. AI có thể xem ảnh — dùng Read tool

Claude Code's Read tool **đọc trực tiếp file ảnh** (PNG/JPG) và present visually cho AI. Đây là feature crucial cho visual work.

**Khi nào dùng**:
- Review assets sau export (R7) — AI tự verify visually thay vì chỉ đọc dimensions
- Debug diff image khi compare thất bại — xem vùng đỏ ở đâu
- Verify reference PNG có content đúng không trước khi dùng làm target
- Kiểm tra rendered screenshot có match ý đồ thiết kế không

**Anti-pattern**: analyze ảnh bằng pixel dump (cv2 read + print values) khi có thể xem trực tiếp. Pixel dump tốt cho diagnostics quantitative, nhưng visual inspection nhanh hơn nhiều.

**Note**: Read tool có thể giới hạn kích thước/độ phân giải ảnh hiển thị cho AI. Ảnh rất lớn (>5000px) có thể bị downscale. Với ảnh đó, crop thành phần nhỏ rồi read.

## R16. spec.md chỉ chứa decisions + navigation + TODO, không transcribe data

**Quy tắc**: `spec.md` của mỗi project **KHÔNG** chứa data derivable từ Figma JSON hoặc MJML code. Chỉ chứa info không tồn tại ở nơi khác.

**GIỮ trong spec.md**:
- **Source**: Figma URL, file key, root node IDs
- **Module → Node ID mapping** (cho `test-visual.sh` lookup)
- **Decisions log** (ngày, options, chosen, WHY) — context không có trong Figma
- **Phase 2 TODOs** (URLs, merge tags, ESP info)
- **Known issues** (residue accepted, trade-offs, workarounds)
- **Asset manifest** (source node ID hoặc crop range cho traceability)
- **Session state** (progress markers, pending work)

**KHÔNG giữ trong spec.md** (derivable):
- Design tokens (colors, typography) → `extract-figma.sh <node-id>` live
- Section dimensions, padding, layout → extract live
- Text content với NBSPs → extract output `characters`
- Font weight/size cụ thể per component → extract live hoặc đọc MJML code
- Style values duplicate giữa nhiều sections

**Lý do**: Transcription lossy (đã miss textCase, textDecoration nhiều lần). Spec.md bloat 300-500 dòng = hard to navigate, easy to drift out of sync với Figma khi design update.

**Target size**: ~100-150 dòng cho project trung bình. Nếu > 200 dòng, review cắt data đã duplicate.

**Ví dụ Marine project**: 329 dòng → 136 dòng (60% cắt) sau refactor, zero thông tin mất.

## R9. Preserve 100% theo Figma — không paraphrase, không convert

**Quy tắc**:
- Text content: giữ nguyên 100%, bao gồm NBSP (`\xa0` → `&nbsp;`), special chars (®, ©), dynamic tokens (SFMC `%%...%%`)
- Color values: giữ format gốc (hex → hex, rgba → rgba), không convert
- Font weight: giữ số cụ thể (400, 500, 700) — không paraphrase thành "normal", "medium", "bold"
- Size: giữ px → px, không convert sang rem/em
- Spacing: giữ nguyên số

**Lý do**: paraphrase/convert tạo sai số nhỏ mà AI không detect được. Downstream consumer dùng giá trị raw. Designer approved giá trị gốc, không phải phiên bản AI "cải tiến".

---

# PART 2 — WORKFLOW CHECKLIST

13 phases (0-13) từ pre-work → delivery. Đã v2 sau khi hoàn thành project Marine Buyers Choice send-3.

## Phase 0 — Pre-work (clarify scope)

- [ ] Xác nhận thư mục làm việc, tên project folder theo convention `{brand}-{campaign}-{variant}`
- [ ] Lấy Figma URL từ user → extract `file_key` và `node-id`
- [ ] Hỏi target email client (Gmail, Outlook desktop, Apple Mail, mobile, etc.)
- [ ] Hỏi desktop width (mặc định 600) và mobile width (mặc định 414)
- [ ] Hỏi dark mode level: A (auto-invert không vỡ) / A+ (Apple đẹp, còn lại không vỡ) / B (full theme mọi client — **không khả thi 100%**, cảnh báo trade-off)
- [ ] Hỏi dynamic content / merge tags / ESP (Mailchimp / SendGrid / SFMC / Klaviyo / custom). Nếu user defer → Phase 2 TODO.
- [ ] Hỏi font stack: font Figma là gì, chấp nhận fallback Helvetica/Arial cho Outlook desktop không?
- [ ] **Hỏi content text**:
  - **Preview text** (~90 ký tự, hiện trong inbox preview ngay sau subject): user có text riêng không? Nếu không → mặc định lấy câu đầu của body paragraph.
    - **WHY phải hỏi từ đầu**: preview text không nhìn thấy trong email body, chỉ hiện ở inbox list trước khi user mở mail. Ảnh hưởng open rate. Nếu không set → client lấy random text đầu (thường là "view online", link disclaimer…) → xấu. Preview text cần **khác subject line + khác body mở đầu** để maximize info.
  - **Subject line**: có cần tôi embed vào HTML không? (thường subject set ở ESP, không ở HTML)
- [ ] **Hỏi URL targets cho tất cả link**: collect upfront hay defer phase 2?
  - Collect upfront: tốt nhất cho AI — viết MJML xong là ship, không phải pass lại
  - Defer phase 2: dùng placeholder (`#` hoặc `{{URL_X}}`), phải pass lại
  - **WHY phải hỏi từ đầu**: biết số lượng URL trước giúp plan structure (footer links có thể là text selectable hay cần riêng per-link tracking). Nếu defer, đánh dấu placeholder rõ để phase 2 grep/sed thay.
- [ ] **Cảnh báo user**: pacing — code chỉ khi 100% confident, làm chậm, không gộp bước (nếu user yêu cầu)
- [ ] **Cảnh báo security**: nếu user dán Figma token vào chat, warn token giờ trong log → nên revoke sau session
- [ ] Tạo/confirm `spec.md` trong project folder để lưu decisions

**Output phase 0**: danh sách answer + file `spec.md` trống section "Decisions".

## Phase 1 — Figma access setup

- [ ] Lưu token qua env var trong command curl, **không** ghi vào bất kỳ file nào
- [ ] Test call: `curl -s -H "X-Figma-Token: $TOKEN" "https://api.figma.com/v1/files/{key}/nodes?ids={id}"` → kiểm tra có `"name"` response không
- [ ] Nếu `403 Invalid token` → báo user revoke/regenerate, paste lại
- [ ] Nếu `404` → file_key sai hoặc không có quyền access
- [ ] Convert node-id từ URL format `615-228` sang API format `615:228`

## Phase 2 — Pull Figma structure (top-down)

- [ ] Call với `depth=2` hoặc `depth=3` ở target node (không cao hơn 4 lần đầu — tránh 503)
- [ ] Nếu `503 Service Unavailable` → depth quá lớn, giảm xuống 3-4
- [ ] Parse JSON: tìm frames (desktop, mobile, variants), identify structure
- [ ] Sort children theo `absoluteBoundingBox.y` để có thứ tự render từ trên xuống (children trong JSON không theo visual order)
- [ ] Lưu raw response vào `/tmp/figma_*.json` để tái parse không cần call lại
- [ ] Report structure cho user: table với frames + sections + sizes + y positions
- [ ] Confirm: đúng email cần cắt? có variant khác cần làm không?

**Output phase 2**: bảng structure + danh sách section, đã confirm với user.

## Phase 3 — Section classification (HTML vs PNG)

**CẢNH BÁO**: section là `INSTANCE` của component (như Marine Header, Gallery, Footer) có thể chứa **text ẩn sâu** bên trong mà pull depth ≤4 không thấy. Ví dụ: Marine Header instance chứa "View Online" text trong sub-frame. Nếu classify thành PNG sớm sẽ mất text cần làm HTML.

**Action bắt buộc**: với mọi INSTANCE section định classify PNG, **pull depth=6+ để check có text/link bên trong không**. Nếu có text → có thể phải split thành 2 section (PNG cho art + HTML cho text) hoặc reclassify toàn bộ thành HTML.


- [ ] Với mỗi section, apply [R2] → quyết định HTML hay PNG
- [ ] Cho các section không chắc → peek sâu hơn 1 level (thêm depth=5 chỉ cho section đó)
- [ ] Check xem section có **overlap** với section khác không (ví dụ Marine Header chồng lên Hero)
  - Nếu overlap + cả 2 là PNG → merge thành 1 PNG, **nhờ user group trong Figma** [R6]
  - Nếu overlap + 1 HTML 1 PNG → thường PNG phải bao cả vùng, HTML render riêng
- [ ] Report bảng classification cho user confirm trước khi pull data

**Output phase 3**: bảng classification đã approved.

## Phase 4 — Pull style values (cho HTML sections only)

- [ ] Với mỗi HTML section, call Figma API với `depth=4` đến `depth=6`:
  - Mỗi frame: size, bg fill, padding, itemSpacing (gap), layoutMode, cornerRadius
  - Text: fontFamily, fontWeight, fontSize, lineHeightPx, letterSpacing, textAlignHorizontal, fill color, `characters`
  - Text có link inline: `characterStyleOverrides` (array) + `styleOverrideTable` (dict) — parse ranges
- [ ] Pull **riêng lẻ per-section**, không pull tất cả cùng lúc (tránh 503)
- [ ] Lưu JSON response `/tmp/{section}.json` để debug
- [ ] Extract và ghi ngay vào `spec.md`:
  - Typography tokens (font + weight + size + lh)
  - Color tokens
  - Spacing/padding tokens
  - Content text (giữ nguyên NBSP, special chars)
  - Link ranges (char positions nếu có inline link)
- [ ] **Apply [R4] Alert on unusual** — mỗi section check:
  - Font family khác với user nói?
  - Font weight mới xuất hiện?
  - Color khác brand palette?
  - Dynamic token lẫn trong text?
  - Style override kéo dài bất thường?
- [ ] Dừng ở mỗi alert, không auto-decide

**Output phase 4**: `spec.md` đầy đủ design tokens + section data cho HTML.

## Phase 5 — Plan & export assets (cho PNG sections)

- [ ] Liệt kê nodes cần export: sections PNG + icons + illustrations
- [ ] Check overlap [R6] — cần nhờ user group không?
- [ ] Apply [R1] — export theo frame chứa, không phải child rectangle bên trong
- [ ] Apply [R5] — format PNG @2x
- [ ] Confirm 1 version (desktop scaled down cho mobile) vs 2 version riêng với user
- [ ] Batch call `/v1/images` với multiple IDs (1 call cho tới ~20 IDs)
- [ ] URL encode IDs có semicolon (instance refs) bằng `curl --data-urlencode`
- [ ] Download mỗi URL trả về xuống `{project}/assets/{filename}.png`
- [ ] Verify dimensions với `sips -g pixelWidth -g pixelHeight file.png` (macOS)
- [ ] Verify file size, flag file > 1MB cho phase optimization sau
- [ ] Update `spec.md` asset manifest table

**Output phase 5**: folder `assets/` đầy đủ, manifest trong spec.md.

## Phase 6 — Review assets [R7] — **STOP, nhờ human**

- [ ] **DỪNG LẠI**. Không viết code.
- [ ] Yêu cầu user mở từng file trong `assets/` xem
- [ ] Chờ user confirm OK từng file
- [ ] Với file NG:
  - Nếu sửa được trong Figma (ẩn layer, hide element) → user sửa + AI re-export
  - Nếu sửa được thủ công (crop) → user sửa file local
  - Nếu sai nặng (wrong region, wrong node) → back to Phase 5
- [ ] Sau khi 100% assets OK → mới sang Phase 7

## Phase 7 — Setup project structure + tooling

Setup tối giản (không npm init), tất cả qua `npx` cho MJML + Python venv cho compare pipeline.

### Folder structure

- [ ] Trong project folder tạo:
  ```
  {project}/
  ├── spec.md                        (đã có từ Phase 0)
  ├── assets/                        (đã có từ Phase 5)
  │   └── ref/                       (sẽ add ở Phase 8)
  ├── src/
  │   ├── email.mjml                 (main, dùng mj-include)
  │   ├── _head.mjml                 (shared mj-head)
  │   ├── modules/                   (1 file per section)
  │   └── test-harnesses/            (1 file per module, wrap trong mjml)
  ├── dist/
  │   ├── email.html                 (full compiled)
  │   └── test/                      (per-module compiled)
  └── tools/
      ├── venv/                      (Python 3.11 venv)
      ├── requirements.txt
      ├── figma_cache/               (raw JSON cache)
      ├── out/
      │   └── sections/              (per-module screenshots + diffs)
      ├── preview_server.py          (HTTP server :8000)
      ├── screenshot.py              (Playwright full email)
      ├── screenshot_module.py       (Playwright per module)
      ├── compare.py                 (OpenCV diff full)
      ├── compare_section.py         (OpenCV diff per module)
      └── figma_extract.py           (Figma raw JSON dump)
  ```

### MJML (npx only, no npm init)

- [ ] **KHÔNG** chạy `npm init`, **KHÔNG** tạo `package.json`
- [ ] Compile bằng `npx mjml` on-demand (auto-fetch, cache 1 tuần)
- [ ] Lần đầu chạy Internet cần, sau đó offline OK
- [ ] Verify: `npx --yes mjml --version`
- **Lý do**: email là deliverable 1-off (HTML), không phải project ongoing. Tránh `node_modules/` và `package.json` rác.

### Python venv (for compare pipeline)

- [ ] **Dùng Python 3.11 CHÍNH XÁC** (Python 3.14 không tương thích với playwright/greenlet do header API thay đổi)
- [ ] Find Python 3.11: `ls /opt/homebrew/opt/ | grep python@`. Nếu không có: `brew install python@3.11`
- [ ] Create venv: `/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv tools/venv`
- [ ] Activate: `source tools/venv/bin/activate && python -V` (verify 3.11.x)
- [ ] Write `tools/requirements.txt`:
  ```
  playwright==1.49.0
  opencv-python==4.10.0.84
  numpy==2.2.0
  ```
- [ ] Install: `pip install -r tools/requirements.txt`
- [ ] Install chromium: `python -m playwright install chromium` (~200MB, one-time, cache `~/Library/Caches/ms-playwright/`)
- [ ] Verify: `python -c "import cv2, numpy; print(cv2.__version__)"`

### Tool scripts (create all at once)

- [ ] **`tools/preview_server.py`**: HTTP server serving project root at `:8000`. **PHẢI** có `allow_reuse_address = True` để tránh TIME_WAIT lỗi.
- [ ] **`tools/screenshot.py`**: Playwright full-page screenshot tại viewport 600x100 (desktop) hoặc 414x100 (mobile), DPR=2, `full_page=True`. Viewport height 100 nhỏ để content extend (tránh trailing whitespace). PHẢI gọi `page.evaluate('document.fonts.ready')` + `page.wait_for_timeout(500)` để đảm bảo Google Fonts load xong.
- [ ] **`tools/screenshot_module.py`**: Giống screenshot.py nhưng URL trỏ tới `dist/test/{module}.html` và lưu vào `tools/out/sections/{module}.png`.
- [ ] **`tools/compare.py`**: OpenCV absdiff với threshold 10, tiered verdict (EXCELLENT <0.5%, VERY GOOD <2%, ACCEPTABLE <5%, NEEDS WORK <15%, BROKEN >15%). Option B strategy (align from top, compare overlap only). Output: diff image + regions + JSON.
- [ ] **`tools/compare_section.py`**: Giống compare.py nhưng crop reference theo y-range arg, so với module screenshot.
- [ ] **`tools/figma_extract.py`**: Raw JSON dump per node ID, cache trong `tools/figma_cache/`. Print EVERY style field (không curate). Requires `FIGMA_TOKEN` env var.

### Check port availability

- [ ] Trước khi chạy preview server, check port 8000: `lsof -i :8000`
- [ ] Nếu bị chiếm (thường bởi `code-tunn` VS Code Tunnel): hỏi user kill hay đổi port. Default giữ 8000 vì hardcode trong MJML asset URLs.

### Export reference PNGs (cho compare)

- [ ] Export Figma full frames desktop + mobile @2x qua Figma API:
  - Desktop: node ID của parent frame (e.g. "Design 3")
  - Mobile: node ID của mobile variant
- [ ] Lưu `assets/ref/desktop.png` và `assets/ref/mobile.png`
- [ ] Apply **R7 review** — yêu cầu user xem reference có clean không (có "view online" nướng vào hero không, layer ẩn lộ không)
- [ ] Nếu có element cần tách ra HTML (vd view online strip), xem mục "Section split from reference" trong Phase 8

## Phase 8 — Iterative module implementation (module-first pattern)

**Không viết full email monolithic rồi test cuối**. Thay vào đó: viết 1 module → test pixel-perfect isolated → pass rồi mới sang module kế.

**Lý do module-first** (quan trọng):
- Bounded debugging: diff trong module X chỉ ảnh hưởng X, không cascade
- Smaller context per iteration (AI tập trung 1 section)
- Parallel-ready: có thể spawn agents parallel cho nhiều module
- Reusable: modules (header/footer) có thể reuse cross-project

### 8.0 — Shared head file (one-time, trước khi làm modules)

- [ ] Tạo `src/_head.mjml` chứa **các element con của mj-head** (KHÔNG wrap trong `<mj-head>` tag, vì sẽ được include vào mj-head):
  ```xml
  <mj-title>...</mj-title>
  <mj-preview>...</mj-preview>
  <mj-raw>
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
  </mj-raw>
  <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:400,500,700" />
  <mj-attributes>
    <mj-all font-family="Helvetica, Arial, sans-serif" />
    <mj-body background-color="#FFFFFF" />
  </mj-attributes>
  <mj-style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media only screen and (max-width: 480px) {
      /* mobile overrides - populate khi test mobile */
    }
  </mj-style>
  ```

### 8.1 — Main compose file

- [ ] Tạo `src/email.mjml`:
  ```xml
  <mjml>
    <mj-head>
      <mj-include path="./_head.mjml" />
    </mj-head>
    <mj-body width="600px" background-color="#FFFFFF">
      <mj-include path="./modules/00-section-name.mjml" />
      <mj-include path="./modules/01-section-name.mjml" />
      <!-- etc -->
    </mj-body>
  </mjml>
  ```
- [ ] Mỗi include uncomment khi module đó pass test.

### 8.2 — Loop cho mỗi module (apply R13, R14, R11)

**Per section (`XX-section-name`)**:

1. **Extract raw data từ Figma** (per R13):
   ```bash
   FIGMA_TOKEN=<token> python tools/figma_extract.py <section-node-id>
   ```
   Đọc output cẩn thận: EVERY style field. Note các field dễ miss:
   - `textCase`: UPPER/LOWER/TITLE → dùng `text-transform`
   - `textDecoration`: UNDERLINE → dùng `text-decoration: underline`
   - `fontPostScriptName`: xác định font variant chính xác
   - `layoutMode` VERTICAL vs HORIZONTAL: ảnh hưởng HTML structure
   - `opentypeFlags` LNUM/PNUM: thường không cần áp dụng trong HTML

2. **Viết module file** `src/modules/XX-section-name.mjml`:
   - **Chỉ chứa** `<mj-section>` top-level (không wrap `<mjml>` hay `<mj-body>`)
   - Dùng `<mj-text>`, `<mj-button>`, `<mj-image>` cho patterns đơn giản
   - Dùng `<mj-raw>` + HTML table cho layout phức tạp (2-col cards, absolute positioning social banner)
   - Comment đầu file: section name, dimensions desktop+mobile, y range trong reference

3. **Tạo test harness** `src/test-harnesses/XX-section-name.test.mjml`:
   ```xml
   <mjml>
     <mj-head>
       <mj-include path="../_head.mjml" />
     </mj-head>
     <mj-body width="600px" background-color="#FFFFFF">
       <mj-include path="../modules/XX-section-name.mjml" />
     </mj-body>
   </mjml>
   ```

4. **Compile standalone**:
   ```bash
   npx --yes mjml src/test-harnesses/XX-section-name.test.mjml -o dist/test/XX-section-name.html
   ```

5. **Screenshot** (server phải đang chạy):
   ```bash
   python tools/preview_server.py > /tmp/server.log 2>&1 &
   sleep 2
   python tools/screenshot_module.py XX-section-name desktop
   ```

6. **Compare với cropped reference**:
   ```bash
   python tools/compare_section.py XX-section-name <y1> <y2>
   ```
   (y1, y2 lấy từ Phase 2 structure report)

7. **View diff image** (per R14, MANDATORY):
   Dùng Read tool xem `tools/out/sections/diff_XX-section-name.png` visually — đừng chỉ tin verdict %.

8. **Iterate fix tới VERY GOOD (<2%)**:
   - Red overlay trên glyph edges everywhere → font engine residue, ACCEPT
   - Red trên 1 region tập trung → element sai vị trí/giá trị, FIX
   - Layout shifted → padding/margin sai, FIX
   - Text wrap khác → font engine width diff → apply letter-spacing per R15

### 8.3 — Patterns per section type

**PNG section** (hero, blue art, gallery):
- Apply R10: extract từ reference crop, KHÔNG trust Figma frame export alone
  ```python
  ref = cv2.imread('assets/ref/desktop.png')
  section = ref[y1:y2, :]
  cv2.imwrite('assets/section-name.png', section)
  ```
- Backup Figma export với `.figma-export.bak` suffix
- MJML: `<mj-image src="http://localhost:8000/assets/section.png" width="600px" padding="0" />`

**HTML simple text section** (body paragraph):
- `<mj-section padding="T R B L">` + `<mj-column>` + `<mj-text>` + `<mj-button>`
- Text content: preserve NBSPs `&nbsp;`, curly quotes, special chars per R9
- Button: `text-transform="uppercase"` nếu Figma có textCase UPPER (dễ miss!)

**HTML complex layout** (2-col cards, icon+text absolute):
- Dùng `<mj-raw>` + hand-written HTML table (mj-column không control được gap giữa columns)
- Pattern 2-col với gap: `<td card1><td gap><td card2>` trong cùng 1 `<tr>`
- Vertical heading (icon top, text bottom): nested table với 2 rows
- Button text-link: `<td>text</td><td>icon</td>` trong 1 row

**Footer with inline links in paragraph**:
- 1 big `<td>` với font styles, `<a>` tags inline cho mỗi link range
- Preserve character ranges chính xác theo `styleOverrideTable` từ Figma
- Dynamic tokens (SFMC `%%...%%`) giữ literal trong text

### 8.4 — Font engine bridging (per R15)

Khi text wrap khác Figma (Chromium render wider/narrower):

1. Measure chính xác bằng Playwright:
   ```python
   page.evaluate('document.getElementById("t").getBoundingClientRect().width')
   ```
2. So với Figma bbox width
3. Tính letter-spacing cần thiết: thử -0.1 đến -0.3px
4. Apply `letter-spacing: -0.15px;` inline trên text cần fix (chỉ element đó, không global)
5. Re-screenshot, re-compare

### 8.5 — Chấp nhận font engine residue

Sub-pixel glyph anti-aliasing khác giữa Chromium và Figma là **không thể fix 100%**. Accept nếu:
- Diff < 2% (VERY GOOD)
- Diff chỉ ở edge glyph (không phải misaligned elements)
- View diff image chỉ thấy thin red lines quanh chữ, không thấy block diff lớn

**KHÔNG over-tune** bằng CSS4 (`text-decoration-thickness`, `text-underline-offset`) per R12.

## Phase 9 — Full compose + final desktop/mobile test

Sau khi TẤT CẢ modules pass test riêng → compose lại full email và test cuối.

### 9.1 — Compose full email

- [ ] Uncomment tất cả `<mj-include>` trong `src/email.mjml`
- [ ] Compile: `npx --yes mjml src/email.mjml -o dist/email.html`
- [ ] Check MJML warnings nếu có
- [ ] Inspect `dist/email.html`:
  - Có `<!--[if mso]>` conditional comments không (MSO)?
  - Inline CSS trên mọi element?
  - Table-based layout?
  - File size (thường 5-15KB cho email normal)

### 9.2 — Full desktop test

- [ ] Screenshot full: `python tools/screenshot.py desktop`
- [ ] Compare full: `python tools/compare.py assets/ref/desktop.png tools/out/rendered_desktop.png`
- [ ] View diff image (R14)
- [ ] Diff thường SẼ TĂNG một chút so với từng module test riêng (cumulative), nhưng phải vẫn VERY GOOD (<2%)
- [ ] Nếu regression > 5% → có vấn đề ở boundary giữa sections (margin collapse, background bleed). Debug từng cặp section.

### 9.3 — Full mobile test

- [ ] Screenshot: `python tools/screenshot.py mobile`
- [ ] Compare: `python tools/compare.py assets/ref/mobile.png tools/out/rendered_mobile.png`
- [ ] View diff image
- [ ] Mobile thường có diff cao hơn desktop một chút do mobile có responsive media queries cần verify
- [ ] Fix các issue mobile-specific trong `_head.mjml` mj-style block (media queries)
- [ ] **Không** sửa mj-body để fix mobile — dùng media query CSS

### 9.4 — Regression check desktop sau mobile fix

- [ ] Mỗi lần sửa mobile CSS, verify desktop không bị ảnh hưởng
- [ ] Re-run desktop compare
- [ ] Media query `@media (max-width: 480px)` chỉ áp dụng trên mobile nên desktop phải unchanged

## Phase 10 — Cross-client manual test

Playwright Chromium là **1 engine**, email client thật dùng engine khác. Pixel-perfect browser ≠ pixel-perfect email client. Phải test thực.

### 10.1 — Tools

- **Free**: send thử tới nhiều email account test (Gmail, iCloud, Outlook.com, Yahoo)
- **Paid**: Litmus, Email on Acid (render preview trên 50+ clients)
- **Hybrid**: Putsmail (free SendGrid-based) để send quick test

### 10.2 — Target matrix (priority order)

| Client | Engine | Priority | Check |
|---|---|---|---|
| Apple Mail macOS | WebKit | Reference (pixel-perfect target) | Layout + dark mode |
| Apple Mail iOS | WebKit | High | Mobile layout + dark mode |
| Gmail web (Chrome) | Chromium | High | Layout, auto-invert dark |
| Gmail app iOS/Android | Custom | High | Mobile layout, limited CSS |
| Outlook.com (web) | Edge/Chromium | Medium | Layout + dark mode (Outlook.com hỗ trợ) |
| Outlook desktop Windows | Word engine | Medium | Font fallback, image breaking, MSO conditional |
| Yahoo Mail | Custom | Low | Layout |

### 10.3 — Per-client checklist

- [ ] **Layout**: section thứ tự đúng, không có section missing, no broken table
- [ ] **Font**: 
  - Apple/iOS: custom fonts load (Roboto etc.)
  - Outlook desktop: fallback Helvetica/Arial render đẹp không
  - Gmail app: có thể strip font-face, check fallback
- [ ] **Images**: load đúng URL (production hoặc localhost?), responsive scale trên mobile
- [ ] **Links**: click được, `href` đúng
- [ ] **Buttons**: clickable area đủ rộng, text uppercase render đúng
- [ ] **Dark mode**: 
  - Apple Mail: media query áp dụng, màu override hoạt động
  - Gmail app: auto-invert có làm vỡ logo/background không
  - Outlook desktop: auto-invert xấu? (không fix được, chấp nhận hoặc tune)
- [ ] **Mobile**: responsive 414 hoạt động, text readable
- [ ] **Preview text**: hiện đúng trong inbox preview

### 10.4 — Common issues + fixes

| Issue | Client | Fix |
|---|---|---|
| Font rendered as Times New Roman | Outlook desktop | Check font-family fallback chain, ensure Arial/Helvetica có trong list |
| Image cropped / wrong size | Outlook desktop | Thêm `width` attribute trên `<img>`, không chỉ CSS |
| Spacing khác desktop | Outlook | MSO conditional needed cho padding-specific |
| Link không clickable | Gmail app | Check `<a>` wrapping, avoid nested `<a>` |
| Dark mode xấu | Gmail | Fallback image logo with light border |
| Button cut off | mobile narrow | Media query giảm padding |

### 10.5 — Report issues found

- [ ] Mỗi issue: client + mô tả + screenshot + severity (block/major/minor)
- [ ] Quyết fix phase này hay phase sau
- [ ] Update `spec.md` Known Issues section

## Phase 11 — Asset optimization

Sau khi pixel-perfect pass + client test pass, optimize size trước khi ship.

### 11.1 — Targets

- **HTML text alone** < 102KB (Gmail clips tại threshold này)
- **Mỗi image** < 200KB (reasonable; email total ~1-2MB OK với most clients)
- **Total email size** < 5MB (hard limit some clients)

### 11.2 — Image compression

- [ ] List current asset sizes: `ls -lh assets/*.png`
- [ ] Flag files > 500KB
- [ ] Tools (chọn 1):
  - **Online**: squoosh.app (interactive, visual), tinypng.com (bulk, lossy)
  - **CLI**: `brew install pngquant` → `pngquant --quality=65-80 --ext .png --force assets/*.png`
  - **Node**: `npm install imagemin-cli imagemin-pngquant` → batch
- [ ] Compress **in place** hoặc lưu `.optimized.png` bên cạnh (tuỳ strategy)
- [ ] Re-compare sau compress: compression có thể giảm % match (từ 99% xuống 97%) nhưng visually identical
- [ ] Verify accept trade-off (R14: view diff image)

### 11.3 — HTML minification

- [ ] MJML output có whitespace/comments → có thể minify
- [ ] `npx --yes html-minifier-terser --collapse-whitespace --remove-comments dist/email.html -o dist/email.min.html`
- [ ] Verify min.html still renders: `npx playwright` test hoặc manual preview
- [ ] Decide: ship min hay non-min tuỳ ESP preference

### 11.4 — Total size check

- [ ] `wc -c dist/email.html` → HTML text size
- [ ] `du -sh assets/` → total assets
- [ ] Nếu > threshold, thêm compression round

### 11.5 — Consider hosted vs inline

- **Inline assets** (base64 trong HTML): tăng HTML size, nhưng không cần CDN
- **Hosted assets** (URL trong HTML): HTML nhỏ, cần upload assets tới CDN/SFMC
- Phần lớn ESP muốn hosted. Check với ESP.

## Phase 12 — Placeholder replacement strategy

Prepare workflow để replace placeholders trước ship.

### 12.1 — Asset URL replacement

HTML có `http://localhost:8000/assets/...` cho dev. Cần replace thành production.

**Approach 1 — sed**:
```bash
# Backup first
cp dist/email.html dist/email.html.bak
# Replace
sed -i '' 's|http://localhost:8000/assets/|https://cdn.example.com/campaign-2026/|g' dist/email.html
```

**Approach 2 — template variable**:
- Source dùng `{{ASSET_BASE}}/hero.png`
- Script Python replace từ config file

**Approach 3 — MJML variable** (advanced):
- Dùng `mjml-utils` hoặc template engine trước compile

### 12.2 — Link URL replacement

11+ placeholder `href="#"` với HTML comment `<!-- TODO phase 2: <description> -->`.

**Grep ra danh sách**:
```bash
grep -n 'TODO phase 2' dist/email.html
```

**Script Python** đọc CSV/JSON mapping description → URL, tìm từng comment và replace:
```python
# pseudocode
for line in html_lines:
    if 'TODO phase 2:' in line:
        description = extract_description(line)
        url = mapping[description]
        line = line.replace('href="#"', f'href="{url}"')
```

### 12.3 — Dynamic content / merge tags

Nếu ESP = SFMC: AMPscript tokens đã trong source (preserve per R9). No action.

Nếu ESP = Mailchimp/SendGrid/Klaviyo: add merge tags theo syntax ESP.
- Mailchimp: `*|FNAME|*`
- SendGrid/Handlebars: `{{first_name}}`
- Klaviyo: `{{ first_name|default:'' }}`

Location: thường chỉ 1-2 chỗ (greeting header, sign-off). Manual add hoặc template variable.

### 12.4 — Final test sau replacement

- [ ] Repeat Phase 9 (compare pipeline) với URLs mới
- [ ] Repeat Phase 10 (client test) với URLs mới
- [ ] Verify mọi link click đúng target
- [ ] Verify assets load từ production URL

## Phase 13 — Delivery handoff

### 13.1 — Package files

Tuỳ ESP requirement, package các file sau:

**Standalone HTML delivery**:
- `dist/email.html` (final, replaced URLs)
- `assets/*.png` (compressed)
- README.txt với deployment instructions

**SFMC package**:
- `dist/email.html` với AMPscript tokens
- Upload assets tới SFMC portal trước
- Configure asset URLs trong email HTML theo SFMC format

**Litmus/test package**:
- `dist/email.html`
- Instructions để chạy test

### 13.2 — Documentation cho handoff

- [ ] Update `spec.md` final section "Delivery":
  - ESP target
  - Asset URL base
  - URL mapping (description → final URL)
  - Deployment steps
- [ ] Any known issues từ Phase 10 chưa fix
- [ ] Merge tag / dynamic content notes

### 13.3 — Cleanup

- [ ] Remove backup files: `*.bak`, `*.figma-export.bak`, `*.user-cropped.bak`
- [ ] Decide gitignore: `tools/venv/`, `tools/figma_cache/`, `tools/out/`, `/tmp/figma_*.json`, `node_modules/` nếu có
- [ ] Archive Figma cache nếu cần reproducibility (optional)
- [ ] Decide final commit structure nếu repo

### 13.4 — Retrospective

- [ ] Note các learning mới vào `checklist.md` (cross-project) hoặc `spec.md` (project-specific)
- [ ] Note tool gotchas gặp phải vào Part 3
- [ ] Update memory với preferences mới từ user feedback

---

# PART 3 — TOOL GOTCHAS

## Figma REST API

### Authentication
- Header: `X-Figma-Token: figd_...`
- Token read-only, scope file content + images + comments
- Không thể modify file structure qua REST API — human phải mở Figma app
- Lỗi `403 Invalid token`: revoked, typo, expired
- Lỗi `404`: file_key sai hoặc token không có access file

### Query params
- `depth` parameter: tree depth to return
  - depth=2: frames level (nhanh, ít data)
  - depth=4-5: section children với style (đủ cho style extraction)
  - depth=6+: **rủi ro 503 Service Unavailable** với file lớn
  - Khi 503 → giảm depth và query từng node riêng thay vì cả cây
- `ids=a,b,c`: batch node fetch — cân nhắc giới hạn node per call
- `scale=2&format=png`: export options cho `/v1/images`

### Response parsing
- `absoluteBoundingBox`: `{x, y, width, height}` — tọa độ tuyệt đối trong canvas
- `children`: array — **không theo visual order**, phải sort theo `y` để có thứ tự render
- `fills`: array of fill objects, filter `type == "SOLID"` và `visible != false`
- Color: `{r, g, b, a}` trong range 0-1, convert ×255 rồi hex
- Text style — **pull TẤT CẢ các field này, không skip**:
  - `style.fontFamily`, `style.fontWeight`, `style.fontSize`
  - `style.lineHeightPx` (tuyệt đối) hoặc `style.lineHeightPercent` (relative)
  - `style.letterSpacing`, `style.textAlignHorizontal`, `style.textAlignVertical`
  - **`style.textDecoration`** (UNDERLINE / STRIKETHROUGH / NONE) — dễ miss, ảnh hưởng render
  - `style.textCase` (UPPER / LOWER / TITLE) — ảnh hưởng render
  - `style.italic` — ảnh hưởng render
  - Font fill color (từ `fills[]` của text node)
- **Anti-pattern**: chỉ extract fontFamily/Weight/Size cho nhanh. Miss textDecoration → underline không hiện → phải debug lại.
- Auto-layout frame: `layoutMode` (`VERTICAL`/`HORIZONTAL`), `paddingTop/Right/Bottom/Left`, `itemSpacing`
- Frame không auto-layout: `layoutMode == None` → children position qua `absoluteBoundingBox`
- Corner radius: `cornerRadius` (scalar) hoặc `rectangleCornerRadii` (array)
- Instance nodes (type `INSTANCE`): có children với ID compound `I{parent}:{child};{instance}`

### Text inline styles (links, bold ranges)
- `characters`: string full text
- `characterStyleOverrides`: array cùng length với `characters`, mỗi phần tử là style ID (hoặc 0 = default)
- `styleOverrideTable`: dict `{id: styleObject}` — lookup style từ override ID
- Parse ranges: loop qua `characterStyleOverrides`, gom các vị trí liên tiếp cùng ID
- Ranges với ID != 0 → là vùng có style khác (link, bold, underline)

### Image export
- `GET /v1/images/{key}?ids=X,Y,Z&format=png&scale=2`
- Response: `{images: {nodeId: signedS3URL}}` — URL có expiry
- Download ngay sau khi nhận URL
- Node ID với semicolon (instance): phải URL encode → dùng `curl --data-urlencode "ids=..."`

## curl

- `-s`: silent (no progress bar)
- `-H "Header: value"`: custom header
- `-G --data-urlencode "key=value"`: convert POST body sang GET query với encode tự động — cần cho ID có `;`, `:`, space
- `--data "key=value"`: raw data, không encode
- `-o file`: write output to file
- Timeout mặc định không có → với file lớn nên thêm `--max-time 60`

## Python

### Version constraint
- **DÙNG Python 3.11 cho venv**, KHÔNG dùng 3.13/3.14
- **Lý do**: `greenlet` (dependency của playwright) chưa có wheel cho 3.14 tại 2026-04, build từ source fail do `_PyInterpreterFrame` / `Py_C_RECURSION_LIMIT` API thay đổi trong cpython 3.14
- Check sẵn có: `ls /opt/homebrew/opt/ | grep python@` — thường có 3.11 và 3.14 song song
- Nếu không có 3.11: `brew install python@3.11`
- Tạo venv: `/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv tools/venv`

### JSON parsing
- `json.load(open('/tmp/file.json'))`: parse JSON response
- Recursive walk: generator pattern `def walk(n): yield n; for c in n.get('children', []): yield from walk(c)`
- Avoid walrus operator `:=` trong inline expressions — syntax tricky trong comprehensions (gây SyntaxError trong nested conditional)

### HTTP server (socketserver)
- **PHẢI** set `allow_reuse_address = True` trên TCPServer subclass, nếu không sẽ "Address already in use" do TIME_WAIT state sau khi kill process cũ:
  ```python
  class ReusableTCPServer(socketserver.TCPServer):
      allow_reuse_address = True
  ```

## Playwright (Python)

### Viewport + screenshot patterns
- Viewport height **nhỏ** (e.g. 100) kết hợp `full_page=True` → screenshot extend to content height. Không set height lớn hoặc default 720 — sẽ thừa whitespace trailing nếu content ngắn hơn viewport.
- `device_scale_factor=2` cho Retina equivalent (DPR=2). Khớp với Figma export @2x.
- **PHẢI** wait fonts load trước screenshot cho pixel-perfect compare:
  ```python
  page.goto(url, wait_until='networkidle')
  page.evaluate('document.fonts.ready')
  page.wait_for_timeout(500)  # extra safety cho Google Fonts
  page.screenshot(path=out, full_page=True)
  ```

### Measure text width (cho letter-spacing bridge R15)
```python
page.set_content('<div id="t" style="font: 700 17px Roboto; white-space: nowrap; display: inline-block">Text here</div>')
page.evaluate('document.fonts.ready')
page.wait_for_timeout(500)
width = page.evaluate('document.getElementById("t").getBoundingClientRect().width')
```
Dùng để so với Figma bbox width, tính letter-spacing cần apply.

### Chromium install
- `python -m playwright install chromium` — ~200MB, one-time
- Cache tại `~/Library/Caches/ms-playwright/chromium-*/`
- Run background task (không block terminal)

## OpenCV

### Diff pattern
```python
ref = cv2.imread(ref_path)
ren = cv2.imread(ren_path)
# Align from top, crop to common
ch, cw = min(ref.shape[0], ren.shape[0]), min(ref.shape[1], ren.shape[1])
a, b = ref[:ch, :cw], ren[:ch, :cw]
diff = cv2.absdiff(a, b)
dg = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
_, mask = cv2.threshold(dg, 10, 255, cv2.THRESH_BINARY)
diff_pixels = cv2.countNonZero(mask)
```

### Tier verdict (dùng thay cho single threshold pass/fail)
- < 0.5%: EXCELLENT (likely chỉ anti-aliasing)
- < 2%: VERY GOOD (check spot lớn)
- < 5%: ACCEPTABLE (fix regions rõ rệt)
- < 15%: NEEDS WORK
- ≥ 15%: BROKEN

### Region finding (cho bounding boxes)
```python
kernel = np.ones((5, 5), np.uint8)
dilated = cv2.dilate(mask, kernel, iterations=2)  # merge nearby diff pixels
contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
regions = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    if w * h >= 100:  # filter noise
        regions.append((x, y, w, h, w*h))
regions.sort(key=lambda r: -r[4])
```

### Visualization
- Red overlay trên vùng diff: `np.where(mask3, cv2.addWeighted(ref, 0.4, red, 0.6, 0), ref)`
- Green bounding boxes cho top regions: `cv2.rectangle(viz, (x,y), (x+w,y+h), (0,255,0), 2)`
- Save diff image → user xem qua Read tool (R14)

## macOS tools

- `sips -g pixelWidth -g pixelHeight file.png`: lấy dimensions PNG (built-in, không cần cài)
- `sips -s format png -z 600 file.png`: resize
- `file file.png`: info basic

## npm / packages

- **Rule user**: không write package.json direct, chỉ qua `npm install package_name`
- `mjml`: CLI tool, install via `npm install mjml` (local) hoặc `npm install -g mjml` (global)
- `sharp`: image manipulation (composite, resize, compress) — chỉ cài khi cần
- `imagemin-cli` + plugins: compress PNG/JPG

## MJML

### Compile
- `npx --yes mjml src/email.mjml -o dist/email.html` (no package.json needed)
- `--yes` để skip prompt "install mjml?"
- First run downloads mjml package (~20s), subsequent runs use cache

### mj-include (module composition)
- `<mj-include path="./modules/section.mjml" />` — inline include content
- Path **relative to file**, không phải CWD
- Include file **KHÔNG wrap** trong `<mjml>` tag — chỉ nội dung cần include
- Với mj-head: include file chứa các element con (`<mj-title>`, `<mj-style>`, etc.) KHÔNG wrap trong `<mj-head>`
- Test include path trước khi build module pipeline — 1 path sai hỏng nhiều file

### mj-head essentials
- Dark mode: cần `<mj-raw>` chứa `<meta name="color-scheme" content="light dark">` và `<meta name="supported-color-schemes" content="light dark">`
- `<mj-style>` với `:root { color-scheme: light dark; supported-color-schemes: light dark; }` + `@media (prefers-color-scheme: dark) {}`
- Font custom: `<mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:400,500,700" />` — chỉ Apple Mail/iOS/Outlook.com load được
- `<mj-attributes>` để set default font-family cho mj-all (fallback nếu text element không specify)

### mj-section gotchas
- Không có padding mặc định — set rõ (`padding="0"` nếu không muốn padding)
- `background-color` apply trên section wrapper, không phải mj-column
- `css-class` attribute add class cho main wrapper div (dùng media query target mobile override)

### mj-column gotchas
- **KHÔNG có gap giữa columns** trong 1 section — MJML distribute space theo width proportions
- Nếu cần gap giữa 2-col layout → dùng `<mj-raw>` + HTML table với `<td>gap</td>` cell
- Column stack trên mobile mặc định — để prevent stack, dùng `<mj-group>` thay (nhưng hạn chế với Outlook)

### mj-button gotchas
- Hỗ trợ `text-transform="uppercase"` attribute — dùng cho Figma textCase UPPER
- `inner-padding` = padding bên trong button (giữa border và text). `padding` = padding ngoài (giữa button và sibling elements)
- `width` attribute set pixel width. Nếu không set, button auto-size theo content.
- Line-height phải match font-size để height tính chính xác: height = font-size + inner-padding-top + inner-padding-bottom

### mj-text gotchas
- Default padding có (10px 25px) — override bằng `padding="0"` nếu cần
- `align` attribute = text-align
- Inline HTML inside mj-text: `<a>`, `<span>`, `<br>` đều được. Inline CSS trong style attribute hoạt động.

### mj-raw (escape hatch)
- Dùng cho HTML table hand-written khi MJML abstractions không đủ control
- Content inside mj-raw KHÔNG qua MJML processing — pure HTML
- Thích hợp cho: 2-col cards with gap, absolute positioning layouts, complex table structures, footer with inline links

### mj-image gotchas
- `width="600px"` set display width
- Browser auto compute height theo aspect ratio của source image
- `padding="0"` remove default padding
- `alt` attribute quan trọng cho accessibility

## Port conflicts

- **Port 8000** thường bị chiếm bởi `code-tunn` (VS Code Tunnel process)
- Check: `lsof -i :8000`
- Options: user kill code-tunn (mất remote dev tunnel), hoặc dùng port khác
- Default giữ 8000 vì hardcode trong MJML asset URLs — nếu đổi port phải sed-replace

## Font rendering

### Figma "Helvetica" → Helvetica Neue trên macOS
- Figma store PostScriptName "Helvetica" nhưng macOS Figma app thường render qua Helvetica Neue (system font)
- Chromium Playwright nếu set `font-family: Helvetica` → có thể load Helvetica plain hoặc Neue tuỳ system
- **Fix**: dùng stack `'Helvetica Neue', Helvetica, Arial, sans-serif` để ưu tiên Neue match Figma render

### Roboto width difference Figma vs Chromium
- Cùng "Roboto 700 17px", Figma và Chromium render width hơi khác (~1.5-2% wider trong Chromium)
- Cause: font engine metric difference, có thể liên quan đến kerning/hinting
- **Fix**: dùng `letter-spacing` negative (-0.1 to -0.2px) để shrink Chromium render match Figma (R15)
- Measure bằng Playwright `getBoundingClientRect().width` trước khi tune

## Security

- Token/secret từ user trong chat → sẽ lưu trong conversation log
- Warn user: "sau session revoke token" ngay khi nhận
- **Không bao giờ** write token vào file (.env, config, source code)
- Dùng env var inline trong command: `TOKEN=xxx curl -H "X-Figma-Token: $TOKEN" ...`
- Hoặc quote inline: `curl -H "X-Figma-Token: figd_..." ...` — hơi lộ trong history nhưng không persist file

---

# PART 4 — DECISION LOG TEMPLATE

Template để ghi decisions trong `{project}/spec.md` section "Decisions". Mỗi decision quan trọng (font choice, layout, color override, URL TODO, format quyết) nên có entry.

```markdown
### Decision: {chủ đề}
- **Date**: YYYY-MM-DD
- **Options**:
  - A) ... (trade-off)
  - B) ... (trade-off)
  - C) ... (trade-off)
- **Chosen**: B
- **Decided by**: designer | client | user | AI recommendation (specify ai recommend nếu AI)
- **Reasoning**: tại sao
- **Status**: confirmed | tentative | needs-verify
- **Related**: link tới section trong spec.md hoặc rule R# nếu có
```

**Ví dụ**:

```markdown
### Decision: Button font family
- **Date**: 2026-04-05
- **Options**:
  - A) Giữ Roboto theo Figma (Outlook desktop fallback Helvetica)
  - B) Đổi hết về Helvetica (đồng bộ, không match Figma)
- **Chosen**: A
- **Decided by**: designer (confirmed 2 font family, client approved)
- **Reasoning**: design đã được client duyệt, không đổi
- **Status**: confirmed
- **Related**: spec.md Typography section, rule R9 (preserve 100%)
```

---

# APPENDIX — Hướng dẫn sử dụng file này

## Khi bắt đầu 1 email project mới

1. Load `checklist.md` (file này) vào context
2. Load `backlog.md` (các item defer cho phase sau)
3. Tạo `{project-name}/spec.md` mới
4. Đi theo workflow Phase 0 → 12
5. Khi gặp rule từ Part 1, áp dụng
6. Khi gặp tool issue, check Part 3 trước
7. Khi có decision quan trọng, ghi vào spec.md theo template Part 4

## Khi học được điều mới

- **Rule cross-project mới** → thêm vào Part 1 (R8, R9, ...)
- **Step workflow thiếu** → update Part 2 phase tương ứng
- **Tool gotcha mới** → update Part 3
- **Project-specific decision** → ghi vào `{project}/spec.md`, KHÔNG vào file này
- **Nếu không chắc cross-project hay project-specific** → hỏi user trước khi ghi

---

# PART 5 — PARALLEL AGENTS PATTERN

Khi project đủ lớn, chia work giữa nhiều agents chạy song song giảm wall time. Pattern sau dựa trên kinh nghiệm Marine Buyers Choice send-3:

## Khi nào dùng parallel agents

**DÙNG** khi:
- Có ≥ 2 task độc lập, file ownership tách bạch (không cùng edit 1 file)
- Mỗi task đủ lớn (> 5 phút work) để justify setup overhead
- Main orchestrator đã có tooling (compare pipeline, extract script) sẵn sàng

**KHÔNG dùng** khi:
- Task nhỏ, sequential, tightly coupled
- Chưa có tooling sẵn — setup cost > parallelism benefit
- Các task cần share state liên tục (agents không share context)

## File ownership rule

**NGHIÊM TÚC** ấn định mỗi agent chỉ được edit 1 set file. Nếu agent cần touch file ngoài ownership → STOP và report, không tự quyết.

Ví dụ split cho email cutting:
- **Agent A**: 1 module file (`src/modules/XX-section.mjml`) + test harness
- **Agent B**: `src/_head.mjml` mj-style (media queries cho responsive)
- **Main**: `src/email.mjml` (integrate sau)

Không overlap → no conflict → parallel safe.

## Prompt structure cho agent

Mỗi agent prompt phải có:

1. **Identity**: "You are Agent X. Goal: ..."
2. **Working directory** (absolute path)
3. **Read files FIRST** list (checklist, spec, existing examples)
4. **Task spec** (output expected, criteria pass)
5. **Workflow steps** (numbered, concrete commands)
6. **File ownership** STRICT (may create/edit vs MUST NOT touch)
7. **Tools available** (scripts, viewing capabilities)
8. **Report format** (what to return at end)
9. **Constraints** (R12, R13, R14, etc.)
10. **Escalation rule**: "Nếu hit blocker, STOP và report, không guess"

## Common pitfalls

- **Token leak**: agents nhận Figma token in prompt → token trong agent logs. Warn user, revoke sau session.
- **Shared server**: nếu 2 agents đều start preview_server.py → port conflict. 1 agent check `lsof -i :8000` trước, chỉ start nếu chưa có.
- **Cache conflict**: figma_cache/ có thể corrupt nếu 2 agents write concurrent. Nếu vậy, cho mỗi agent cache sub-folder.
- **Main context gap**: agents không see main's ongoing context. Prompt phải self-contained.

## Integration sau agents

Sau khi tất cả agents complete:

1. **Review reports**: mỗi agent return status, key findings
2. **Verify outputs**: read files agents created, sanity check
3. **Integrate**: main combines agent outputs (e.g. add mj-include line cho footer module)
4. **Regression test**: compile full + compare — verify nothing broken
5. **Fix residue**: nếu có issues ở boundaries agents không thấy

## Escalation policy

Nếu 1 agent fail:
- **Option A**: retry với prompt bổ sung info
- **Option B**: main take over task manually
- **Option C**: hỏi user quyết định (default: stop và hỏi, không tự retry)
