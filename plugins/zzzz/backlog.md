# Backlog

Các hạng mục để lại phase sau, sau khi email light mode + dark mode Mức A+ đã hoàn thành và test manual.

## 1. Dynamic content / Merge tags

**Trạng thái**: chưa làm, phase sau.

**Nội dung**: thay placeholder tĩnh bằng biến động theo ESP (Mailchimp `*|FNAME|*`, SendGrid/Handlebars `{{first_name}}`, Klaviyo, v.v.).

**Điều kiện bắt đầu**: email đã test manual full trên các client chính.

**Cần user cung cấp**: tên ESP sẽ dùng, danh sách biến cần merge.

## 2. Dark mode Mức B — full theme cross-client

**Trạng thái**: không làm ở phase 1 vì không khả thi 100%.

**Giới hạn kỹ thuật**:
- Gmail app (đặc biệt GANGA - non-Google account) không hỗ trợ `@media (prefers-color-scheme)`
- Outlook desktop Windows không có CSS dark mode, chỉ auto-invert
- Logo swap technique không reliable cross-client

**Phase 1 đang làm (Mức A+)**:
- Meta `color-scheme` + media query cho Apple Mail / Outlook.com
- Ảnh PNG nền trong suốt để Gmail/Outlook desktop auto-invert không vỡ

**Điều kiện cân nhắc phase sau**: nếu cần full dark theme cho Gmail/Outlook desktop → cần design dark version riêng + chấp nhận fallback xấu ở một số client.

## 3. Header: export PNG hay dựng HTML — hỏi user từng dự án

**Quy tắc**: header thường chỉ có logo → mặc định export nguyên instance thành 1 PNG (đơn giản, đủ dùng).

**Khi nào cần hỏi lại user**: mỗi dự án mới, confirm header có cần:
- Link click được (logo → homepage)?
- Menu/nav text selectable?
- Nhiều phần tử động (tên user, badge...)?

Nếu có bất kỳ yêu cầu trên → dựng HTML thay vì PNG.

## 4. Font fallback — Outlook desktop

**Trạng thái**: chưa cần action. Phase 1 dùng Helvetica theo Figma.

**Lý do vào backlog**: Outlook desktop không load web font. Hiện Helvetica là web-safe nên Outlook sẽ render được. Nhưng nếu phase sau đổi sang font custom (Google Font hoặc font thương mại), cần plan fallback stack cho Outlook.

**Action khi xảy ra**: define fallback stack `{custom-font}, Helvetica, Arial, sans-serif` + test trên Outlook desktop.
