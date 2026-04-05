# Tool usage lessons — data extraction cho email cutting

Bài học thực chiến từ project Marine Buyers Choice (Figma → MJML pixel-perfect).
Tập trung vào **lấy data** (Figma API, parsing, image handling). Rules chung ở `checklist.md`.

---

## 1. Figma API — download once, extract from cache

**Anti-pattern**: gọi API nhiều lần cho cùng data, mỗi lần pull riêng 1 section.
Mỗi call là 1 điểm failure (503 depth quá lớn, rate limit, network).

**Pattern đúng**:
1. `curl /v1/files/{key}` 1 lần → save `.workspace/figma_cache/full.json`
2. Mọi extract sau đọc từ local JSON (stdlib `json.load`)
3. File ~90MB nhưng offline mãi, không bao giờ stale trừ khi Figma update

**Endpoint quirks**:
- `/v1/files/{key}` — full file tree, không limit depth
- `/v1/files/{key}/nodes?ids=X&depth=N` — single nodes, depth ≤4 safe, 6+ risks `503 Service Unavailable`
- `/v1/images/{key}?ids=X&scale=2&format=png` — trả về S3 signed URLs, **expire nhanh**, download ngay
- `curl --data-urlencode "ids=..."` bắt buộc với ID instance có `;` (e.g. `I2185:348;813:1335;...`)

## 2. Extract ALL fields, never curate

**Bug số 1 tôi gặp**: extract chỉ `fontFamily`/`fontWeight`/`fontSize`, miss:
- `textCase: UPPER` → 3 buttons render wrong case
- `textDecoration: UNDERLINE` → link không có gạch chân
- `paragraphSpacing`, `letterSpacing` → spacing lệch

**Fix**: script dump **every key** trong `style` dict, không cherry-pick.

**Fields dễ miss**:
```
textCase           (UPPER/LOWER/TITLE → text-transform CSS)
textDecoration     (UNDERLINE/STRIKETHROUGH → text-decoration CSS)
letterSpacing      (thường 0.0, nhưng nếu ≠0 phải apply)
paragraphSpacing   (khoảng cách giữa đoạn)
fontPostScriptName (cho biết font file cụ thể, vd RobotoRoman-Bold vs Roboto-Bold)
opentypeFlags      (LNUM, PNUM, v.v.)
italic             (true/false)
textAlignVertical  (TOP/CENTER/BOTTOM)
```

**Rule**: khi write extract script, dump hết `style` dict via `for k, v in s.items()`, đừng list hardcoded keys.

## 3. Parse patterns (Python)

### Walk tree
```python
def walk(n):
    yield n
    for c in n.get('children', []):
        yield from walk(c)
```

### Find node by ID
```python
for n in walk(root):
    if n.get('id') == target:
        return n
```

### Sort children by y (children không theo visual order!)
```python
sorted(kids, key=lambda c: c.get('absoluteBoundingBox', {}).get('y', 0))
```

### Color convert (Figma rgba 0-1 → hex)
```python
r, g, b = (round(c[k] * 255) for k in 'rgb')
hex_str = f'#{r:02X}{g:02X}{b:02X}'
```

### Inline link ranges (characterStyleOverrides + styleOverrideTable)
```python
chars = node['characters']
cso = node.get('characterStyleOverrides', [])  # same length as chars
sot = node.get('styleOverrideTable', {})       # id → style dict

current = cso[0]; start = 0
for i in range(1, len(cso)):
    if cso[i] != current:
        if current != 0:  # 0 = default style
            print(f'[{current}] {start}-{i}: {chars[start:i]!r}')
        current = cso[i]; start = i
```

## 4. Image handling

### View images via Read tool (R11) — dùng thường xuyên
AI có thể xem PNG trực tiếp qua Read tool. **Tôi kept quên** và chuyển sang pixel dump (cv2 print values). Pixel dump chỉ dùng khi cần quantitative data. Visual inspection dùng Read tool.

**Use cases**:
- Review asset sau export (R7)
- Xem diff image sau compare (R14)
- Verify reference PNG có chứa element mong muốn không
- Debug khi diff % cao

### Extract PNG từ reference thay vì Figma frame export (R10)
**Vấn đề**: user crop manual không chính xác @2x, tạo offset 1-11 pixel → diff 24%.

**Fix**: crop từ reference PNG đã download:
```python
ref = cv2.imread('assets/ref/desktop.png')
section = ref[y1:y2, :]  # y1, y2 là @2x pixel
cv2.imwrite('assets/section.png', section)
```
Guaranteed pixel-perfect align với reference vì content giống nhau byte-for-byte.

### Measure text width với Playwright (cho R15 letter-spacing bridge)
Khi Chromium render font wider hơn Figma, gây text wrap khác:
```python
page.set_content('<div id="t" style="font: 700 17px Roboto; display: inline-block">Text</div>')
page.evaluate('document.fonts.ready')
page.wait_for_timeout(500)
width = page.evaluate('document.getElementById("t").getBoundingClientRect().width')
```
So với Figma bbox width → tính `letter-spacing` negative nhỏ (~-0.15px) để fit.

## 5. Text content extraction — preserve 100%

**Giữ nguyên** (không sanitize/convert):
- NBSP: Python repr `\xa0` → HTML `&nbsp;`
- Curly quotes: `'` (U+2019) khác với `'` (U+0027 apostrophe)
- Special chars: `®`, `©`, `—` (em-dash), `–` (en-dash)
- Dynamic tokens: `%%=format(Now(),"yyyy")=`, `%%CAMPAIGNCODE%%`, `{{first_name}}` — giữ literal, ESP sẽ render khi deploy

Python string với NBSP look like: `'Last call\xa0to save!'`. Check repr chứ đừng nhìn printed output (NBSP invisible).

## 6. Playwright screenshot patterns

### Viewport nhỏ + full_page = content fit
```python
ctx = browser.new_context(
    viewport={'width': 600, 'height': 100},  # nhỏ!
    device_scale_factor=2  # @2x
)
page = ctx.new_page()
page.goto(url, wait_until='networkidle')
page.evaluate('document.fonts.ready')  # CRITICAL cho Google Fonts
page.wait_for_timeout(500)              # safety buffer
page.screenshot(path=out, full_page=True)
```

**Tại sao viewport height nhỏ**: `full_page=True` screenshot toàn bộ scroll height. Nếu viewport height lớn (default 720) và content ngắn, screenshot bao gồm whitespace trailing. Viewport 100 + full_page → chỉ capture content.

**Tại sao `document.fonts.ready`**: Playwright `networkidle` không đủ cho Google Fonts. Không wait → font chưa load → render Arial fallback → diff cao.

## 7. OpenCV diff template

```python
ref = cv2.imread(ref_path)
ren = cv2.imread(ren_path)
ch = min(ref.shape[0], ren.shape[0])
cw = min(ref.shape[1], ren.shape[1])
a, b = ref[:ch, :cw], ren[:ch, :cw]

diff = cv2.absdiff(a, b)
gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
_, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)  # 10 = noise threshold
diff_pct = cv2.countNonZero(mask) / (cw * ch) * 100

# Red overlay viz
red = np.zeros_like(a); red[:, :, 2] = 255
mask3 = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR).astype(bool)
viz = np.where(mask3, cv2.addWeighted(a, 0.4, red, 0.6, 0), a)
cv2.imwrite('diff.png', viz)

# Find diff region bounding boxes
kernel = np.ones((5, 5), np.uint8)
dilated = cv2.dilate(mask, kernel, iterations=2)
contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
regions = [cv2.boundingRect(c) for c in contours if cv2.boundingRect(c)[2] * cv2.boundingRect(c)[3] >= 100]
```

**Threshold 10**: under 10 intensity difference = imperceptible, ignore noise.
**Dilate kernel 5x5**: merge nearby diff pixels vào 1 region để có bounding box meaningful.

## 8. Tool anti-patterns (đã học đau)

### Không transcribe raw data vào intermediate files
Mỗi transcription = cơ hội miss field (đã miss textCase, textDecoration).
Fix: raw JSON = source of truth, extract on-demand.

### Không dùng sub-agents cho iterative sandboxed work
Sub-agents không chạy được Python trong sandbox. Kill cả 2 agents tôi spawn.
Dùng agents cho: research, static analysis, independent writing main verify được.
**Không dùng** cho: iterative test-debug cần runtime.

### Không trust verdict % — always view diff image (R14)
2% có thể là:
- Anti-aliasing everywhere (accept)
- 1 critical element sai (fix ngay)
Không nhìn diff image = không biết.

### Không over-engineer AI-only tools
Scripts chỉ AI dùng → không cần:
- Pretty logging
- Progress bars
- Idempotent checks
- Error message cho user

Chỉ cần: làm việc, return data.

### Không chase sub-1% bằng CSS4 (R12)
`text-decoration-thickness`, `text-underline-offset` đẹp trên Chromium nhưng break Outlook. Trade vài pixel cho broken client = bad deal.

### Không đoán khi có thể measure
Letter-spacing cần bao nhiêu → **measure bằng Playwright**, không đoán.
Y-range trong reference → **đọc từ Figma JSON**, không count bằng mắt.

## 9. Proven sequence cho data extraction

```
1. Download full Figma JSON 1 lần
   └─ curl /v1/files/{key} → .workspace/figma_cache/full.json

2. Parse structure top-down
   └─ depth 2-3 first, tìm frames
   └─ Sort children theo y để có visual order

3. Report + confirm với user
   └─ Bảng sections, sizes, positions
   └─ Classify PNG vs HTML

4. PNG sections → crop from reference
   └─ Export Figma full frame @2x vào assets/ref/
   └─ cv2 crop theo y-range → assets/section.png

5. HTML sections → extract all fields per node
   └─ Dump full style dict (không curate)
   └─ Check textCase, textDecoration, letterSpacing mỗi lần
   └─ Alert nếu gặp unusual (R4)

6. Write MJML with extracted values
   └─ Preserve text 100% (NBSP, quotes, tokens)
   └─ Apply text-transform cho textCase UPPER
   └─ Apply text-decoration cho textDecoration UNDERLINE

7. Screenshot via Playwright
   └─ viewport small, full_page, document.fonts.ready

8. OpenCV diff
   └─ absdiff, threshold 10, dilate 5x5
   └─ Output diff image

9. View diff image (R14)
   └─ Read tool trực tiếp

10. Fix → iterate
    └─ Font width off? → measure + letter-spacing bridge (R15)
    └─ Element sai vị trí → check padding/margin
    └─ Text wrong case → check textCase
    └─ Text no underline → check textDecoration
```

## 10. Command templates đã verified

```bash
# Download full file
FIGMA_TOKEN=figd_xxx
curl -sS -H "X-Figma-Token: $FIGMA_TOKEN" \
    "https://api.figma.com/v1/files/$FILE_KEY" \
    -o .workspace/figma_cache/full.json
```

```bash
# Export PNG assets (batch, multiple IDs)
curl -sG -H "X-Figma-Token: $FIGMA_TOKEN" \
    --data-urlencode "ids=2131:2130,2131:2238,I2185:348;813:1335" \
    --data "scale=2" --data "format=png" \
    "https://api.figma.com/v1/images/$FILE_KEY" > images.json
# parse S3 URLs from images.json, curl download each
```

```bash
# Verify dimensions (macOS)
sips -g pixelWidth -g pixelHeight file.png
```

```bash
# Test port free
lsof -i :8000
```

```python
# Inline Python parse pattern
import json
d = json.load(open('.workspace/figma_cache/full.json'))
def walk(n):
    yield n
    for c in n.get('children', []):
        yield from walk(c)
for n in walk(d['document']):
    if n.get('name') == 'Frame 6956':
        # extract fields
        pass
```

## 11. Environment gotchas

- **Python 3.14 incompatible với playwright**: greenlet build fail do `_PyInterpreterFrame` / `Py_C_RECURSION_LIMIT` API đổi. Dùng **3.11** cho venv.
- **TCPServer TIME_WAIT**: `allow_reuse_address = True` bắt buộc.
- **Port 8000 conflict code-tunn**: VS Code Tunnel dùng 8000. Check `lsof -i :8000`.
- **Chromium install**: `python -m playwright install chromium` ~200MB, 1 lần.
- **Sub-agent sandbox Python block**: sub-agents không chạy được playwright/opencv. Confirmed tại 2026-04-05.

---

## Sử dụng file này

- Load khi bắt đầu email project mới, song song với `checklist.md`
- Áp dụng patterns cho data extraction phase (Phase 4 + Phase 5 trong checklist workflow)
- Update khi gặp tool gotcha mới (anti-pattern hoặc proven pattern)
