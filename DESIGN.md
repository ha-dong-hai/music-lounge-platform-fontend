---
name: MusicLounge
description: Sàn đặt vé phòng trà Sài Gòn, in như một tờ chương trình ca nhạc.
colors:
  stock: "#F3EEE6"
  ink: "#231A15"
  ink-soft: "#4A3E35"
  ink-mute: "#65584D"
  board: "#14110F"
  espresso: "#231A15"
  espresso-soft: "#1F1A16"
  lamp: "#F2EAE0"
  cream: "#F2EAE0"
  cream-mute: "#B3A899"
  brand-on-dark: "#F3EEE6"
  stamp: "#9B2A23"
  ember: "#C9A45C"
  page: "#FBF8F3"
  card: "#FBF8F3"
  sunken: "#EDE6DB"
  line: "#DAD0C2"
  line-strong: "#231A15"
  brand: "#231A15"
  brand-hover: "#14110F"
  brand-text: "#231A15"
  on-brand: "#F2EAE0"
  danger: "#B3261E"
  success: "#266340"
  warning: "#794F00"
typography:
  display: { fontFamily: "'Anton', 'Be Vietnam Pro', sans-serif", fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 400, lineHeight: 0.95, letterSpacing: "0" }
  headline: { fontFamily: "'Anton', 'Be Vietnam Pro', sans-serif", fontSize: "3rem", fontWeight: 400, lineHeight: 1.05, letterSpacing: "0" }
  title-display: { fontFamily: "'Anton', 'Be Vietnam Pro', sans-serif", fontSize: "1.875rem", fontWeight: 400, lineHeight: 1 }
  title: { fontFamily: "'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif", fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em" }
  body: { fontFamily: "'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6, fontFeature: "tnum" }
  label: { fontFamily: "'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600 }
  data: { fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "0.875rem", fontWeight: 400, fontFeature: "tnum" }
rounded: { xs: "1px", sm: "2px", md: "2px", lg: "3px", xl: "3px", 2xl: "4px", 3xl: "4px" }
spacing: { gutter: "16px", gutter-desktop: "32px", row: "12px", card-gap: "20px", heading-gap: "28px", section: "96px" }
components:
  button-primary: { backgroundColor: "{colors.ink}", textColor: "{colors.cream}", typography: "{typography.label}", padding: "0 20px", height: "44px" }
  button-primary-hover: { backgroundColor: "{colors.brand-hover}" }
  button-outline: { backgroundColor: "transparent", textColor: "{colors.ink}", typography: "{typography.label}", padding: "0 20px", height: "44px" }
  button-outline-hover: { backgroundColor: "{colors.ink}", textColor: "{colors.cream}" }
  button-book: { backgroundColor: "{colors.stock}", textColor: "{colors.ink}", typography: "{typography.title-display}", padding: "0 20px", height: "44px" }
  button-book-hover: { backgroundColor: "{colors.lamp}" }
  chip: { backgroundColor: "{colors.card}", textColor: "{colors.ink}", padding: "0 12px", height: "40px" }
  input-search: { backgroundColor: "{colors.card}", textColor: "{colors.ink}", padding: "10px 44px", height: "44px" }
  board-row: { backgroundColor: "{colors.espresso}", textColor: "{colors.cream}", padding: "12px 16px" }
  status-live: { backgroundColor: "{colors.ember}", textColor: "{colors.board}", padding: "0 10px", height: "30px" }
  status-onsale: { backgroundColor: "transparent", textColor: "{colors.lamp}", padding: "0 10px", height: "30px" }
  lounge-card: { backgroundColor: "{colors.stock}", textColor: "{colors.ink}", padding: "16px" }
  lounge-card-lit: { backgroundColor: "{colors.espresso}", textColor: "{colors.cream}", padding: "16px" }
  ticket-stub: { backgroundColor: "{colors.card}", textColor: "{colors.ink}", padding: "32px 24px" }
---

> **Bảng màu "Sơn then và lụa ngà" — chủ dự án chọn 30/09/2026** trong 5 bảng dựng thử trên trang thật, thay bản vàng hoa
> cúc #F4C542 + tím than #26215A (bị nhận xét sặc sỡ, chối mắt). Căn cứ: `reports/Bảng màu sang trọng phòng trà.md`
> (repo backend). Nền lụa ngà gần cụm "kem + serif + đất nung" mà máy hay sinh ra — KHÔNG kèm chữ serif và đất nung.

# Design System: MusicLounge

## Overview

**Creative North Star: "Tờ chương trình ca nhạc"**

Mỗi đêm của Sài Gòn in thành một tờ chương trình: nền lụa ngà phủ trang, mực nâu đen cho chữ, bảng giờ diễn đen nâu ấm của sơn then,
đường kẻ và giờ diễn; một "bảng giờ diễn" mặt mực đậm kiểu bảng khởi hành, giờ bằng ô chữ lật, mỗi dòng là một phòng
trà xếp theo giờ lên sân khấu; dòng nào được chọn thì mở ra thành hộp đèn mica sáng ấm. Dấu mộc cao su đỏ chỉ đóng lên
lời hứa về tiền; cuống vé răng cưa chở các cam kết; góc giấy cắt vuông. Màu vàng thếp chỉ nói một điều: đang diễn.
Hai lời hứa ngang nhau (khám phá theo phòng trà, tiền minh bạch) cùng in trên một tờ giấy, không lời hứa nào là trang trí.

Hệ này thay hệ "Sáng ấm" cũ (nền kem + serif) nhưng **giữ nguyên tên token** để 61 trang đổi thế giới cùng lúc: các
tên cũ `brand`, `espresso`, `cream` giờ trỏ vào mực và ánh đèn. Mọi cặp chữ/nền trong `src/index.css` đã được tính
đạt WCAG 2.2 AA (22/22 cặp, 30/09).

**Key Characteristics:**
- Lụa ngà (Persuade) hoặc lụa trắng ngà (Operate) + mực nâu đen; không đen thuần, không xám trung tính. Giao diện gần như không màu — ẢNH sân khấu mang màu.
- Phân cấp bằng CỠ chữ khối, không bằng đậm nhạt; số liệu thẳng cột (tabular-nums mặc định).
- Góc gần như vuông; viền mực 2px thay cho bóng; bóng chỉ là tờ giấy nằm trên bàn.
- Ba màu có luật dùng hẹp: vàng thếp = đang diễn, đỏ son = tiền, quầng sáng = có diễn đêm nay. Nhấn + ánh kim cộng lại dưới ~10% diện tích.
- Mọi chữ và số truy được về dữ liệu thật; khối nào cũng có đủ trạng thái tải / lỗi / trống / có dữ liệu.

## Colors

Hai vật liệu (giấy và mực) cộng ba tín hiệu có chủ quyền riêng.

### Primary
- **Lụa ngà** (stock): phủ trang ở màn công khai (trang chủ, thẻ phòng trà tắt đèn, nút Đặt chỗ trên bảng).
- **Mực nâu đen** (ink, cũng là brand / espresso / line-strong / brand-text): chữ, viền in 2px, nút chính, khối đậm có chủ đích (thead bảng tuần, chân trang, thanh bên).
- **Mặt bảng giờ** (board, cũng là brand-hover): nền khung bảng giờ diễn, ô chữ lật, ô ảnh trống — đậm hơn mực một nấc.
- **Ánh đèn mica** (lamp / cream / on-brand): chữ "sáng đèn" trên khối mực, mặt ô chữ lật, nền nút Đặt chỗ khi rê.

### Secondary
- **Chữ phụ trên mực** (cream-mute): nhãn cột, chú thích, liên kết chân trang trên nền mực.
- **Lụa ngà làm chữ** (brand-on-dark): số thứ tự line-up, giờ trong danh sách buổi ở hộp đèn.
- **Mực nhạt** (ink-soft, ink-mute): chữ phụ, quận/huyện, placeholder trên giấy.

### Tertiary (tín hiệu)
- **Dấu mộc đỏ** (stamp): chỉ trạng thái và lời hứa về tiền — giữ hộ, đã hoàn, đã quyết toán, sao kê.
- **Vàng thếp** (ember): chỉ buổi đang diễn — nhãn "Đang diễn", viền dòng bảng, ô chữ lật của dòng đó.

### Neutral
- **Giấy trắng** (page, card): nền mặc định của màn vận hành; tờ giấy nổi (cuống vé, chip, ô tìm kiếm, menu thả).
- **Giấy ánh mực** (sunken): ô nhập, hàng được chọn trong menu. **Đường kẻ mực nhạt** (line): viền menu thả, vạch chia.
- **Trạng thái hệ thống** (danger, success, warning; `danger-soft` = color-mix 12% danger trên card): lỗi, thành công, cảnh báo — không thay cho stamp/ember.

### Named Rules
**The Ember-Is-Live Rule.** Vàng thếp chỉ xuất hiện khi buổi diễn có status `Ongoing`. Không dùng cho khuyến mãi, nút, hover hay "sắp diễn".

**The Stamp-Is-Money Rule.** Đỏ mộc chỉ nói về tiền. Câu không phải về tiền thì không được đóng dấu, tô đỏ hay rê chuột ra đỏ.

**The No-Stamp-On-Navy Rule.** Dấu mộc không bao giờ đặt trên khối mực (đỏ son trên sơn then ~2:1). Trên nền mực, lời hứa về tiền in bằng chữ mono màu cream-mute.

## Typography

**Display Font:** Anton (fallback Be Vietnam Pro) — tiêu đề khối hẹp của tờ chương trình, chỉ một độ đậm 400.
**Body Font:** Be Vietnam Pro 400/500/600/700 — chữ thân, nhãn, nút chức năng, h3.
**Label/Mono Font:** JetBrains Mono 400/600 — giờ, số tiền, số sê-ri, ngày trong bảng. Dữ liệu, không trang trí.
**Hand Font:** Patrick Hand 400 (`font-hand`, 02/10/2026) — CHỈ chữ viết trên ảnh Polaroid (chú thích, mặt sau ảnh).
Chủ dự án chọn trong 8 font có phân vùng tiếng Việt; Caveat bị loại vì không có dấu.

Cả bốn tự host qua @fontsource trong `src/main.jsx` (có phân vùng tiếng Việt), không gọi Google Fonts lúc chạy.

### Hierarchy
- **Display** (Anton 400, clamp(3rem, 8vw, 6rem), 0.95): một tiêu đề trang duy nhất, ví dụ "Đêm nay ở Sài Gòn".
- **Headline** (Anton 400, 2.25rem → 3rem từ sm, 1.05, text-wrap balance): tiêu đề khối (h2), gạch chân mực 2px.
- **Title-display** (Anton 400, 1.25–1.875rem, leading 1): tên phòng trà, giá trong hộp đèn, nhãn trạng thái, chữ nút Đặt chỗ.
- **Title** (Be Vietnam Pro 700, 1.125rem, -0.01em): h3, nhãn nhóm, tiêu đề thẻ nhỏ.
- **Body** (Be Vietnam Pro 400, 1rem, 1.6, max-w-prose): câu giải thích, câu "giá gồm gì".
- **Label** (Be Vietnam Pro 600, 0.875rem): nút, liên kết hành động, menu. Nhãn cột 0.75rem, chữ thường.
- **Data** (JetBrains Mono, 0.75–1.125rem): dòng phụ ngày/số phòng trà sáng đèn, giờ, giá trong danh sách, số đếm chip.

### Named Rules
**The Size-Not-Weight Rule.** Anton chỉ có một độ đậm; phân cấp bằng cỡ. Dưới ~20px không dùng Anton (chữ khối hẹp bết lại) — chuyển sang Be Vietnam Pro 700.

**The Mono-Is-Data Rule.** JetBrains Mono chỉ cho giá trị đo được (giờ, tiền, ngày, số đếm). Không dùng làm "phong cách" cho câu chữ.

**The Hand-Is-On-Photo Rule.** Chữ viết tay chỉ xuất hiện TRÊN tấm ảnh Polaroid (người ta ghi lên ảnh thật). Không dùng cho
tiêu đề, nút, nhãn, giá — ở đó nó chỉ là trang trí và khó đọc.

### Ảnh Polaroid (02/10/2026)
Giấy `card`, viền 4% ba cạnh + dải đáy dày, góc VUÔNG (Cut-Paper Rule), `shadow-lift`, nghiêng cố định theo vị trí ảnh
(-2,5° / 3° / -4° / 1,8° — không ngẫu nhiên). Chữ trên dải đáy: `font-hand`, một dòng. Mặt sau: giấy `stock`, chú thích
đầy đủ + tên nơi + số thứ tự mono; chỉ có khi có chú thích. Xấp (`XapPolaroid`, khung xem của BoAnh): tấm trên cùng + 2
tấm lộ mép; kéo ngang > 110px hoặc vuốt nhanh để sang ảnh; chạm để lật; mọi thao tác có nút tương đương (Ảnh trước/sau,
"Lật xem chữ sau ảnh" aria-pressed). Giảm chuyển động: không bay, không xoay lật — đổi tức thì.

### Không gian và chỗ ngồi: Sơ đồ 3D ⇄ Tham quan 360° (03/10/2026)
Trang phòng trà, một khối, KHÁCH TỰ CHỌN cách xem (`KhongGianPhongTra`): tablist APG (mũi tên/Home/End, roving tabindex),
nút chuyển dạng phân đoạn viền mực 2px, đang chọn = khối mực chữ lamp. Chỉ in cách xem có dữ liệu; một cách xem thì không
in nút chuyển. Mỗi lúc chỉ dựng MỘT cảnh WebGL. Sơ đồ 3D (`SoDoCho3D`): dựng nổi từ sơ đồ 2D của chủ phòng trà (mặt sàn
16:9) trên sàn gỗ tối; mỗi khu là TẤM THẢM màu layoutColor (giảm bão hoà ~45%, tối đi) bày bàn ghế thật — Kenney Furniture
Kit CC0, `public/models/noi-that/`, vật liệu ghi đè sang gỗ nâu/nệm ngà/đồng thau. Kiểu bàn ghế đoán theo tên khu: "bar" →
quầy + ghế cao, "sofa" → 2 sofa + bàn trà, còn lại → bàn tròn 4 ghế; số bộ theo sức chứa nhưng không vượt số bộ vừa thảm (thẻ
khu ghi rõ là minh hoạ, sức chứa thật là con số). Camera vừa khít cụm khu. Nhãn tên khu HTML bám khu, kéo xoay/cuộn phóng to
(không lật xuống sàn), chạm thảm hoặc bàn ghế = chọn khu; danh sách khu dạng nút aria-pressed bên cạnh là đường tương đương.

**Chọn khu khi mua vé (MLACP-556, 03/10/2026).** Tab "Vé và chỗ ngồi" của buổi diễn: khối "Chọn khu" cùng tablist
2D / 3D / 360° + danh sách khu (tên, còn bao nhiêu, khoảng giá). MỘT trạng thái chọn cho cả ba view và danh sách; chọn
khu chỉ lọc hạng vé, giữ chỗ/thanh toán đi đường cũ. Bán theo KHU, không có ghế số. 2D cắt khung vừa cụm khu (tỉ lệ kẹp
1,2–2). 360° chỉ vẽ điểm "Khu" (hotspot Zone, chủ phòng trà đặt ở trang Tour 360°) của khu ĐANG BÁN trong buổi đó; ở
trang phòng trà điểm Khu ẩn. Khu đang chọn = nhãn nền lamp chữ board ở cả 3D lẫn 360°.

**The Real-Furniture Rule.** Sơ đồ 3D không dùng khối màu bão hoà hay cột trụ làm ghế (chủ dự án loại 03/10: "xấu… 3D vậy
không được"). Không vẽ sân khấu/đồ trang trí khi dữ liệu không có vị trí — vẽ vào là bịa bố cục phòng trà.

### Thành phần kỹ thuật số (03/10/2026)
Mặt chữ "bảng điện" DUY NHẤT là ô chữ lật `KyTuLat` — không dựng chữ chấm LED (cần mask gradient trang trí).
- **Nhãn Đang diễn** (`NhanDangDien`, 3 cỡ): khối vàng thếp + sóng âm 4 thanh, nhảy 4 nhịp (~4,4 giây) rồi đứng yên.
- **Đang lên sân khấu** (`BangLenSanKhau`): chỉ buổi Ongoing; ai đang hát / kế tiếp theo setTime thật, cập nhật 30 giây;
  không tiết mục nào có giờ thì không in.
- **Bộ đếm người xem** (`BoDemNguoiXem`): CHỈ trang xem trực tuyến, lật khi SignalR báo đổi; không aria-live.
- **Đếm ngược tới giờ diễn** (`DemNguocGioDien`): CHỈ vé đã thanh toán, cập nhật mỗi phút. Vạch quét QR (`.vach-quet`) 3 lượt rồi tắt.

**The No-Pressure-Clock Rule.** Đồng hồ đếm ngược và số người đang xem KHÔNG BAO GIỜ ở trang bán vé (fake urgency) —
chỉ sau khi mua hoặc trong trang xem. Mọi chuyển động tự chạy dừng trước 5 giây hoặc có nút dừng (WCAG 2.2.2).

### Bìa đĩa + đĩa than 3D (03/10/2026)
Đầu trang buổi diễn: ảnh buổi diễn (hoặc ảnh phòng trà) là BÌA ĐĨA vuông HTML (`BiaDia`, hiện ngay); đĩa than three.js
(`DiaThanCanvas`, tải lười, gói riêng) nằm sau bìa, ló nửa nhãn ra. Nhãn đĩa giấy `lamp` in tên buổi (Anton), phòng trà,
ngày giờ (mono) — vẽ bằng canvas 2D; KHÔNG dán ảnh lên đĩa (Firebase Storage không trả CORS → WebGL không đọc được ảnh).
Số dải rãnh = số tiết mục. Ánh đèn: hai vệt quạt đứng yên trên mặt đĩa (đĩa quay bên dưới), lớp bóng clearcoat, nghiêng
nghỉ nhẹ. Tương tác: kéo ngang = quay có quán tính (ma sát theo THỜI GIAN, tối đa 30 rad/s); rê chuột = đĩa trượt ra + nghiêng
theo con trỏ; nút "Quay/Dừng đĩa" (aria-pressed). Đang diễn: tự quay 33⅓ vòng/phút + viền vàng thếp quanh nhãn — nút đó là
nút DỪNG của WCAG 2.2.2. Giảm chuyển động: không tự quay/trượt/nghiêng; kéo vẫn quay. Chỉ vẽ khi có chuyển động, dừng
khi khuất hoặc tab ẩn. Không có WebGL → chỉ còn bìa.

## Layout

Khung trang `max-w-[1440px]`, lề 16px điện thoại / 32px từ sm; đầu trang 40px → 56px, cuối 80px. Các khối cách
nhau 96px (`mt-24`); mỗi khối mở bằng tiêu đề khối (h2 + liên kết phụ căn phải) trên đường mực 2px, cách nội dung 28px.
Lưới thẻ: 1 → 2 (sm) → 4 (lg) cột, khe 20px; cuống vé 3 cột từ md, khe 24px. Breakpoint theo Tailwind mặc định; menu
chính hiện từ xl (1280px), ô tìm kiếm từ md.

Bảng giờ diễn chiếm trọn chiều ngang ngay dưới tiêu đề. Máy tính: một hàng 7 cột cố định
`7.5rem 3.5rem minmax(0,1.4fr) minmax(0,1.2fr) 7.5rem 7rem 9rem` dùng chung cho hàng tiêu đề và mọi dòng (cột cuối rộng
cố định để tiêu đề không lệch dữ liệu). Điện thoại: giờ + trạng thái trên, tên phòng trà cả dòng, người hát + nút dưới.

**The Fixed-Grid Numbers Rule.** Body bật `font-variant-numeric: tabular-nums` toàn cục; giờ và tiền luôn thẳng cột.

## Elevation & Depth

Phẳng như giấy in; chiều sâu chủ yếu đến từ viền mực và đổi nền (lụa ngà ↔ khối sơn then). Ba bóng, tông mực, không đen thuần:

- **shadow-soft**: tờ giấy nằm sát bàn — dự trữ cho thẻ/khung nhỏ.
- **shadow-lift**: tờ giấy nhấc lên — khung bảng giờ diễn, cuống vé cam kết, menu thả của đầu trang.
- **shadow-glow**: quầng sáng BÊN TRONG hộp đèn mica (inset) + bóng dưới — chỉ dòng bảng đang mở và thẻ phòng trà có diễn đêm nay. Tên phòng trà đang mở thêm quầng chữ `0 0 18px` màu lamp 55%.

**The Lit-Only Glow Rule.** Quầng sáng là tín hiệu "có diễn đêm nay", không phải hiệu ứng nhấn. Thứ không sáng đèn thì không được phát sáng.

## Shapes

Giấy cắt vuông: thang bo góc bị ghi đè còn 1–4px để mọi lớp `rounded-*` rải trong mã cũ vuông lại; `rounded-full`
giữ cho ảnh đại diện và chấm. Viền in: 2px mực cho thẻ, nút viền, bảng, chip; 3px mực cho khung bảng giờ diễn; 1px
lamp 10–15% cho dòng bảng và vạch chia trên nền mực. Cuống vé có răng cưa trên/dưới vẽ bằng `mask` (lỗ tròn 7px, bước
22px) — kỹ thuật cắt, không phải dải màu. Dấu mộc là SVG tròn hai vòng, chữ chạy theo vòng, xoay -12° đến -14°.

**The Cut-Paper Rule.** Không bo góc quá 4px cho bất cứ thứ gì có góc.

## Components

### Buttons
- **Chính** (ink / cream, cao 44px, 600): Đăng ký, Thử lại trên giấy. Hover sang brand-hover.
- **Viền** (viền mực 2px, trong suốt): Vé của tôi, Tìm và lọc, Theo dõi. Hover lật thành khối mực chữ cream.
- **Đặt chỗ** (stock / ink, Anton, 44px; bản lớn 52px trong hộp đèn): chỉ trên nền mực. Hover sang lamp. Chưa đăng nhập thì kèm dòng 11px "Cần đăng nhập để đặt".
- **Focus**: viền 2px mực, lệch 2px (toàn cục); trên nền mực dùng outline lamp. Mọi đích bấm ≥ 44px.
- **Cuống đặt vé** (`CuongDatVe`, 02/10/2026): hành động đặt vé trên MỘT DÒNG buổi diễn (danh sách, lịch tuần, các buổi
  đêm nay trên bảng). Nửa giá (mono, giấy viền 2px) + đường xé (khuyết bán nguyệt 9px trên/dưới bằng mask, hàng lỗ đục
  chấm tròn) + nửa hành động (Anton + mũi tên dấu luyến, khối mực; trên bảng tối thì khối giấy). Góc ngoài bo 3px. Đang diễn → nửa vàng thếp "Xem buổi diễn", không
  giá. Đã diễn → nút viền mảnh, không giá, không răng cưa. Cao 48px.
- **Liên kết mũi tên** (`LienKetMuiTen`): liên kết ĐỨNG RIÊNG ("Mọi phòng trà", quay lại, "Chỉ đường"): chữ 600 + mũi tên
  dấu luyến (`MuiTenLuyen`: nét cong thuôn như dấu luyến trên khuông nhạc), rê chuột thì trượt tới êm 0,3s. Không đóng ô:
  ô vuông viền + mũi tên thẳng bị chủ dự án chê "cứng nhắc" (02/10). Ngoài trang → mũi tên chéo + "(mở ở thẻ mới)" sr-only.

**The Hover-Row-Has-Gutter Rule.** Hàng nào đổi nền khi rê chuột (hover:bg-*) phải có lề ngang (tối thiểu px-3, sm:px-4)
— không thì ảnh và nút chạm mép nền, trông dính sát (chủ dự án 03/10/2026). Bảng thì lề nằm ở ô (p-4).

**The Underline-Is-For-Prose Rule.** Gạch dưới CHỈ cho liên kết nằm trong câu văn (WCAG 2.2 G183). Hành động đứng riêng
không bao giờ là chữ gạch dưới: dẫn tới tiền → Cuống đặt vé; điều hướng → Liên kết mũi tên; `<button>` mở/thu gọn → nút
Viền. Căn cứ + trang thật đã đối chiếu: `reports/Nút hành động thay chữ gạch dưới.md` (repo backend). Mới áp cho trang
chủ, trang phòng trà, trang buổi diễn (02/10); các chỗ còn lại chờ chủ dự án duyệt bản mẫu.

### Chips
Tìm theo gu: nền card, viền mực 2px, cao 40px, chữ 500; số đếm mono. Hover lật thành khối mực.

### Inputs / Fields
Ô tìm kiếm đầu trang: nền card, viền mực 2px, cao 44px, icon trái, nút xoá phải; focus = vòng 2px mực lệch 2px trên nền stock. Menu gợi ý: card, viền line, shadow-lift.

### Navigation
Đầu trang dính trên nền stock, gạch chân mực 2px; wordmark "MusicLounge" bằng Anton (một component duy nhất, tone ink/lamp). Menu chính chữ 600, hover/đang ở = gạch chân 2px lệch 6px. Chân trang là khối mực, chữ cream-mute, hover lamp; không số điện thoại/email chưa xác nhận.

### Bảng giờ diễn (signature)
Khung board, viền mực 3px, shadow-lift, mỗi dòng một phòng trà theo giờ buổi sớm nhất ("+N buổi nữa đêm nay").
Dòng tắt: espresso 40%, hover 70%. Dòng mở (hộp đèn): espresso + shadow-glow, mở ra ảnh không gian 16:9 (nếu có thật),
line-up đánh số, giá kèm câu giá gồm gì, nút Đặt chỗ lớn, danh sách mọi buổi đêm nay. Dòng đầu mở sẵn. Trạng thái:
"Đang diễn" (khối ember) hoặc "Mở bán" (viền lamp 60%) — chỉ in trạng thái có trường dữ liệu. Dấu mộc "Giữ hộ tới khi
diễn" đóng lấn mép trên-phải bảng, trên giấy, chỉ từ md.
**Trạng thái:** tải = 3 dòng khung với ô lật `--:--` + thanh pulse; lỗi = câu nói thật + nút Thử lại; trống = bảng vẫn in,
ô lật "ĐÊM NAY CHƯA CÓ PHÒNG TRÀ NÀO LÊN ĐÈN" + đêm gần nhất có diễn; dữ liệu = các dòng.

### Ô chữ lật
Mỗi ký tự một thẻ mono 600, vạch ngang board 70% giữa ô; tone lamp (mặc định), ember (đang diễn), ink. Trạng thái
không dùng ô lật (vạch ngang cắt chữ nhỏ).

### Thẻ phòng trà
Giấy stock, viền mực 2px, ảnh 4:3 có viền mực 1px trong lề 12px, tên Anton, quận kèm MapPin, số đêm diễn sắp tới
(mono). Có diễn đêm nay → thẻ sáng đèn (espresso + shadow-glow, chữ lamp, "Có diễn đêm nay"). Nút Theo dõi viền 2px /
đầy khi đang theo dõi; chưa đăng nhập → "Đăng nhập để theo dõi". Tải = 4 ô pulse ink 5%; lỗi = khung viền + Thử lại; trống = câu nói thật.

### Lịch tuần, cuống vé, ô ảnh trống
- **Lịch bảy ngày tới**: bảng viền mực 2px, thead khối mực, ngày + giờ mono, vạch đậm khi sang ngày mới, cuộn ngang dưới 640px.
- **Cuống vé cam kết**: card răng cưa + shadow-lift, tiêu đề Anton, một câu đã đối chiếu backend, dấu mộc 84px trong dòng chảy (không absolute).
- **Ô ảnh trống** (CoverFallback): khối board, khuông nhạc 5 dòng màu lamp 25% + nốt nhạc; nhãn "Chưa có ảnh". Không gradient.

### Chuyển động
Một điểm chữ ký mỗi màn: ô chữ lật lật MỘT LẦN khi vào khung nhìn (0.32s/ký tự, trễ 45ms mỗi ký tự, 120ms mỗi dòng).
Hộp đèn mở/đóng 0.38s theo chiều cao. Rê chuột có độ trễ ý định 250ms (chuột chỉ mở, bấm/Enter mở ngay và bật/tắt).
Mọi đường cong dùng ease-out-soft; không nảy. `prefers-reduced-motion`: hiện thẳng trạng thái cuối, chỉ còn mờ dần.

## Do's and Don'ts

### Do:
- **Do** lấy màu, font, bóng, bo góc từ token trong `src/index.css`; không mã hex hay `bg-gray`/`bg-black` trong component.
- **Do** cho mọi khối đủ bốn trạng thái tải / lỗi / trống / có dữ liệu; trống vẫn in khung và nói thật, kèm lối đi tiếp.
- **Do** nói trước khi cần đăng nhập, ngay trên nút.
- **Do** in giá kèm câu nói rõ giá gồm gì; số tiền bằng JetBrains Mono.

### Don't:
- **Don't** dùng gradient trang trí (ngoại lệ duy nhất: mask răng cưa / lỗ đục của cuống vé, không hiện thành dải màu).
- **Don't** dùng kính mờ, `backdrop-blur` hay nền trong suốt nhoè.
- **Don't** đặt nhãn chữ hoa giãn chữ (kicker/eyebrow) trên tiêu đề.
- **Don't** in con số trong cam kết mà hệ thống không hứa ("100%", "24 giờ"), hay số gây áp lực ("còn N vé", đếm ngược).
- **Don't** in trạng thái không có trường dữ liệu (không "Đổi giờ", "Hết vé" khi DTO không có).
- **Don't** bịa kênh liên hệ (số điện thoại, email) hay liên kết `href="#"`.
- **Don't** dùng ember ngoài buổi đang diễn, stamp ngoài tiền, dấu mộc trên nền mực, shadow-glow ngoài thứ sáng đèn.

## Màn vận hành (Chủ phòng trà / Nhân viên / Admin) — CHUYỂN CƠ HỌC 30/09, LÀM LẠI THEO THÀNH PHẦN CHUNG 01/10/2026

> 35 trang vận hành đã được đưa vào thế giới mới bằng chuyển đổi CƠ HỌC, không phải thiết kế lại từng trang như lối đi
> của khán giả. Nói rõ để không ai tưởng chúng đã qua cùng một quy trình.

**Đã làm (máy + mắt):** đổi tên màu cũ sang token mới, bỏ bo tròn / kính mờ / bóng mặc định / chuyển sắc / nhãn chữ hoa
giãn cách, đổi màu mặc định Tailwind và mã hex cứng sang token, thay hộp xác nhận tự dựng bằng `HopXacNhan` (qua
`ConfirmModal`, giữ nguyên cách gọi), thay 15 ảnh chữ cái của api.dicebear.com bằng `utils/anhChuCai.js` (không gửi tên
người dùng ra dịch vụ ngoài). Sửa tay: đầu trang buổi diễn của Admin, thẻ gói dịch vụ (chữ tiếng Anh). Toàn bộ `src/`
nay nằm dưới cổng `kiem:the-gioi`, nợ = 0, khối tên màu cũ trong `index.css` đã xoá.

**Chưa làm (việc tiếp theo, theo quy trình 7 bước — mỗi loại trang một mẫu, chủ dự án duyệt rồi mới nhân rộng):**
- Bảng dữ liệu: theo `reports/Form lọc vé và màn vận hành.md` — cột đầu là tên người đọc được, số và tiền căn phải, đơn vị ở
  đầu cột, `<th scope>` + `<caption>`, `aria-sort` chỉ trên cột đang xếp, phân trang (không cuộn vô hạn), 1–2 thao tác
  hiện trên dòng.
- Nhãn trạng thái: chữ + biểu tượng, tối đa ~5–6 kiểu, không bấm được.
- Thao tác tiền / xoá: `HopXacNhan` nói rõ đối tượng và hệ quả (hiện nhiều chỗ còn truyền câu chung chung).
- Dấu mộc cho trạng thái tiền ở sổ cái / quyết toán / hoàn tiền; ember cho buổi đang diễn ở màn nhân viên.

**Đã làm thêm 01/10/2026 (không cần duyệt bố cục — logic và chữ):**
- Thao tác tiền / không hoàn tác được: hoàn tiền (3 đường), quyết toán, gỡ nội dung bị báo cáo, xác nhận đã nhận tiền ủng hộ,
  từ chối kiểm duyệt — mỗi cái có `HopXacNhan` nói đúng hậu quả, câu chữ đối chiếu handler (kiểm: `scratchpad/kiem_*.mjs`,
  mã cũ thì đỏ). Câu xác nhận nào nói sai hậu quả thì sửa theo backend (vd. xoá thể loại: backend TỪ CHỐI khi đang dùng).
- Chữ tiếng Anh: đã quét theo mẫu và danh sách từ; sửa "Name (EN)", "N/A", "Name match", "Created", "Approve/Reject", "show",
  "donate", "scene/hotspot" (trang tour: "điểm đứng" / "điểm bấm"). Khoá nội bộ (`'donate'`, `'scene'`) giữ nguyên.
- Tiền đồng không dùng biểu tượng đô-la (`Banknote`).
- Biểu đồ: `chartTokens.js` theo bảng màu hiện hành; ba nguồn là ba độ đậm của mực (`--color-ink`, `--color-chart-2`,
  `--color-chart-3`), mỗi màu >= 3:1 trên nền thẻ (WCAG 1.4.11). Không mượn ember hay son cho chuỗi dữ liệu.

**Làm lại 01/10/2026 — thành phần dùng chung (trang vận hành KHÔNG tự dựng lại những thứ này):**
- Nút: 44px, năm kiểu — chính (đặc mực), phụ (viền 2px), xoá (viền son), đồng ý, cảnh báo; nút xác nhận trong hộp thoại
  hậu quả nặng thì đặc màu (đỏ/xanh). Nút chỉ có biểu tượng 44×44, luôn có `aria-label` nêu đối tượng. Lớp sẵn:
  `components/bang/DauTrang.jsx` (`NUT_CHINH`, `NUT_PHU`, `NUT_BIEU_TUONG`, `NUT_BIEU_TUONG_XOA`).
- Đầu trang: tiêu đề = đúng tên mục trên thanh trái; không đặt biểu tượng trước tiêu đề.
- Nhóm tab lọc: `NhomTab` (role="group" + aria-pressed, 44px, số đếm tuỳ chọn) — không phải tablist.
- Tải / lỗi / rỗng: `KhungTai`, `TrangLoiTai`. Lỗi tải KHÔNG bao giờ được vẽ thành "chưa có…" (25 trang đã sửa).
- Danh sách lớn: `useDanhSachMayChu` + `PhanTrang` (+ `BangDuLieu` cho bảng, `ChipBoLoc` cho bộ lọc đang áp); trang và
  bộ lọc nằm trên URL.
- Hộp thoại: `components/shared/HopThoai.jsx` (Radix Dialog) — role=dialog, giữ tiêu điểm, Esc, trả tiêu điểm; tiêu đề hiển
  thị bọc `TieuDeHop`. Hộp xác nhận hành động khó hoàn tác vẫn dùng `HopXacNhan`.
- Chip bật/tắt (thể loại, chế độ vẽ…): 44px, viền 2px, `aria-pressed`.

- Ô số liệu: `OChiSo` (nhãn, số, dòng phụ "so với cái gì"); ô bấm để lọc là nút `aria-pressed`, ô chỉ đọc là `<div>`;
  biểu tượng chỉ trang trí, không tô màu. Ô cần chú ý dùng `canChuY` (viền + chữ son) kèm chữ.
- Ô nhập form vận hành: 44px, viền 2px mực, vòng tiêu điểm rõ; nhãn `text-sm font-semibold text-ink` (không còn chữ nhỏ xám).
- Bảng danh sách đầy đủ (không phân trang máy chủ): dùng lớp `components/bang/lopBangHep.js` (`HEP`) — dưới 768px mỗi dòng
  xếp thành khối có nhãn cột, role bảng tường minh. Bảng phân trang máy chủ dùng `BangDuLieu` (cùng lớp đó).
- Danh sách bị backend cắt (pageSize kẹp 100 / chỉ lấy N mục gần nhất) phải NÓI ra ("100 buổi gần nhất trên N…"), câu báo
  nằm ngoài trạng thái trống. Chỗ cắt còn lại chờ backend có tham số lọc (`format`, `follows/lounges/status`).
- Menu thả xuống ở đầu trang (ngôn ngữ, tài khoản, chuông): nút có `aria-expanded`, Esc đóng.

**Cố ý không làm:** chuyển hàng loạt 35 đầu trang sang `DauTrang` — đo 01/10 thấy 34/35 trang đã cùng kiểu tiêu đề + dòng
mô tả, nút đã 44px; đổi cấu trúc không đổi gì người dùng thấy mà có rủi ro hồi quy. Chỉ sửa chỗ lệch thật (Phát trực tuyến
thiếu mô tả, Gói dịch vụ không xuống dòng). Trang mới thì dùng `DauTrang`.

**Còn lại (chờ backend deploy, xem `kb/facts/be/loc-phan-trang-may-chu-2026-10-01.md`):** gỡ lọc phía trình duyệt ở Phát
trực tuyến / Đơn gọi món / nghệ sĩ; `keyword` cho Admin khiếu nại, phòng trà, buổi diễn, danh sách phòng trà công khai;
`allStatuses=true` để thêm lại "Tất cả" ở Admin Phòng trà; trái tim theo dõi qua `/follows/lounges/status`.

## Danh sách lựa chọn dài: thu gọn, không in hết (30/09/2026)

> Chủ dự án: khối "Tìm theo gu" in hết mọi lựa chọn, "nếu có quá nhiều option thì sao". Căn cứ: `reports/Thu gọn danh
> sách lựa chọn dài.md` (repo backend). Mẫu chuẩn: `src/components/program/NhomGu.jsx` + `src/utils/nhomGu.js`.

- Từ 8 mục trở xuống: in hết. Nhiều hơn: hiện 6 mục đáng thấy nhất (xếp theo độ phổ biến), phần còn lại ẩn.
- Mở bằng một dòng chữ gạch chân có dấu cộng, ghi SỐ mục ẩn và tên nhóm ("Xem thêm 24 tâm trạng"). Không làm nó thành một
  ô nhãn: người dùng nhầm nút mở rộng với một lựa chọn.
- Mở tại chỗ, không chuyển động, không tự cuộn trang. Các mục hiện sẵn không đổi chỗ; phần mở thêm xếp theo bảng chữ cái.
- Trên 20 mục: khi đã mở có ô "Tìm trong danh sách", tìm được khi gõ không dấu.
- KHÔNG dùng hàng cuộn ngang, vùng cuộn lồng hay dropdown cho việc này.
- Trợ năng: `<button aria-expanded aria-controls>`; mục ẩn không dựng ra DOM; nút ở yên một chỗ để focus không rơi khi thu gọn.
- Giới hạn đã biết: các ngưỡng 6 / 8 / 20 suy từ nghiên cứu bộ lọc thương mại điện tử, chưa có số đo của chính trang này.
  "Độ phổ biến" hiện là số buổi diễn sắp tới (dòng nhạc) hoặc thứ tự danh mục của backend (tâm trạng, không gian) vì
  chưa có dữ liệu lượt bấm.

## Trang phòng trà: bộ ảnh, lịch diễn, đoạn văn dài, danh sách (30/09/2026)

> Căn cứ: `reports/Trang phòng trà ảnh và lịch diễn.md` (repo backend). Mẫu chuẩn: `src/pages/lounge/`,
> `src/components/lounge/BoAnh.jsx`, `LichDienPhongTra.jsx`, `src/components/shared/DoanVanDai.jsx`, `src/utils/lichPhongTra.js`.
> Bộ kiểm: `kiem_phong_tra.mjs` (dữ liệu nhỏ, lớn, trống, lỗi giả lập ở tầng mạng; 1440 và 390px).

**Thứ tự trang địa điểm:** tên + địa chỉ + bộ ảnh (khối sơn then) → LỊCH DIỄN → giới thiệu và chỗ ngồi → tham quan 360°.
Lịch diễn là thứ người ta vào trang địa điểm để tìm; không đặt nó dưới phần "cộng đồng" hay sau giới thiệu.

**Bộ ảnh (mọi nơi có nhiều ảnh):**
- KHÔNG tự chuyển ảnh. Nút trước/sau là nút thật, luôn hiện, 48px, nằm dưới ảnh chứ không đè lên ảnh.
- Ảnh nhỏ thay cho chấm tròn; kèm bộ đếm "3 / 12". Tới 10 ảnh in hết ảnh nhỏ; nhiều hơn in 9 + ô "+N" mở lớp phủ có đủ mọi ảnh.
- Điện thoại: vuốt ngang + bộ đếm + "Xem tất cả N ảnh"; không in dải ảnh nhỏ.
- Lớp phủ là `<dialog>` của trình duyệt (giữ focus, Esc đóng, trả focus về nút đã mở).
- Không có ảnh: ô "Chưa có ảnh". Cấm ảnh kho, cấm ảnh của nơi khác.

**Lịch diễn của một địa điểm:** danh sách dọc, gần nhất trước, buổi đang diễn đứng đầu, không có nút sắp xếp, không băng
chuyền ngang. In sẵn 20 buổi (tới 24 thì in hết), còn lại "Xem thêm N buổi diễn". Đêm đã diễn nằm trong khối đóng sẵn.
Chưa có buổi nào: nói thật và mời theo dõi. Lỗi tải là trạng thái riêng có "Thử lại".

**Đoạn văn người dùng nhập:** ngắn thì in hết. Chỉ cắt (6 dòng) khi phần bị giấu từ 3 dòng trở lên, đo chiều cao thật.
Nút `<button aria-expanded>` ngay sau đoạn văn, nhãn tự mô tả ("Đọc tiếp phần giới thiệu"). Không cắt đoạn có liên kết.

**Danh sách dài các thẻ (phòng trà, về sau là buổi diễn):** in từng đợt 24 thẻ + nút "Xem thêm N …" ghi số; không cuộn vô
hạn. Từ khoá, bộ lọc và số thẻ đã mở nằm trong địa chỉ trang để Quay lại không mất chỗ. Tìm được khi gõ không dấu. 0 kết
quả: gọi tên từ khoá + một nút bấm được để đi tiếp. Tới 8 mục thì không in ô tìm kiếm.

**Không bịa dữ liệu:** trường nào API không trả thì KHÔNG in gì thay cho nó — không nhãn dòng nhạc mặc định, không câu
giới thiệu giữ chỗ, không "0 người theo dõi". Một con số chỉ có một nguồn trên một trang.

**Vòng focus trên khối tối** lấy màu ánh đèn (`src/index.css`); vòng màu mực trên sơn then là vô hình.

**Giới hạn đã biết:** các ngưỡng 20 / 24 (lịch), 10 (ảnh nhỏ), 6 và 3 dòng (đoạn văn), 24 (thẻ) lấy từ quan sát DICE,
Ticketmaster và nghiên cứu Baymard, NN/g trên thương mại điện tử — chưa có số đo của chính trang này. Chữ thay thế của ảnh
không có chú thích chỉ định danh ("ảnh 3 trên 12"), chưa mô tả nội dung. Danh sách phòng trà tải hết về trình duyệt (trần
500) vì API chưa có tham số tìm theo tên.

## Form, danh sách có bộ lọc, vé và xác nhận (30/09/2026)

> Căn cứ: `reports/Form lọc vé và màn vận hành.md` (repo backend). Mẫu chuẩn: `src/components/auth/`,
> `src/pages/home/ShowSearchPage.jsx` + `src/utils/boLocBuoiDien.js`, `src/components/program/DongBuoiDien.jsx`,
> `src/pages/user/TicketDetailPage.jsx`, `src/components/shared/HopXacNhan.jsx`, `src/pages/payment/PaymentResultPage.jsx`.
> Bộ kiểm: `kiem_tai_khoan.mjs`, `kiem_buoi_dien.mjs`, `kiem_ve.mjs`.

**Ô nhập (mọi form):**
- Nhãn luôn nhìn thấy phía trên ô. KHÔNG dùng chữ mẫu trong ô thay nhãn hay làm ví dụ (biến mất khi gõ, bị tưởng là đã điền).
- Gợi ý / luật của ô in TRƯỚC ô và luôn hiện, kể cả khi đang có lỗi. Lỗi in dưới ô, nối bằng `aria-describedby`; ô lỗi có `aria-invalid`.
- Viền ô là mực 2px (đường kẻ nhạt không đủ 3:1 cho ranh giới một điều khiển).
- Kiểm khi RỜI ô (`mode: 'onTouched'`), gỡ lỗi ngay khi gõ lại cho đúng. Không báo lỗi giữa lúc đang gõ.
- Không chặn dán, không giới hạn ký tự ở ô mật khẩu; `autocomplete` đúng (`username`, `current-password`, `new-password`, `one-time-code`).
- Nút Hiện/Ẩn mật khẩu bằng CHỮ, mang tên ô. Mật khẩu: chỉ luật độ dài của backend (15–64), không bịa luật thành phần ký tự.
- Mã một lần: MỘT ô (`inputmode="numeric"`), không phải sáu ô.
- Nút gửi không bị làm mờ để "chặn": bấm được, thiếu gì thì báo bằng chữ. Khi đang gửi thì khoá và ghi "Đang …".
- Thông báo đăng nhập / quên mật khẩu KHÔNG được tiết lộ tài khoản có tồn tại hay không (in nguyên câu của backend).

**Danh sách có bộ lọc:**
- Bộ lọc, từ khoá, sắp xếp, số trang nằm trong ĐỊA CHỈ TRANG, theo ID. Giá trị hỏng trong địa chỉ bị bỏ qua, không làm sập.
- Màn lớn: cột lọc bên trái luôn mở. Màn nhỏ: nút "Bộ lọc (n)" mở `<dialog>`, đóng bằng nút ghi số kết quả.
- Ô chọn là checkbox / radio thật trong `<fieldset><legend>`. Áp ngay; riêng ô số áp khi rời ô hoặc Enter.
- Bộ lọc đang áp in thành hàng nút gỡ + "Xoá tất cả". Mục đang chọn không bao giờ bị giấu trong phần thu gọn.
- Khoảng vô lý (đến < từ) báo lỗi tại ô và KHÔNG gửi lên máy chủ.
- Buổi diễn mặc định xếp theo ngày diễn gần nhất. Mốc ngày nhanh (Hôm nay, Cuối tuần này…) đứng trước khoảng ngày tự chọn.
- Một dòng buổi diễn (`DongBuoiDien`) dùng cho mọi danh sách buổi diễn: ngày giờ → tên, người hát → phòng trà → giá → đi tiếp.
  Không lưới thẻ, không băng chuyền ngang, không hiệu ứng phình thẻ khi rê chuột.

**Vé và mã QR:**
- Mã QR: ô ĐEN trên nền TRẮNG, lề trống quanh mã ≥ 4 ô (24px), kèm đúng chuỗi mã bằng chữ để đọc tay. Không đảo màu, không lồng logo.
- Chỉ vé tại chỗ đã thanh toán mới có mã. Trạng thái khác nói rõ vì sao không có mã.
- Trạng thái vé lấy từ `src/utils/trangThaiVe.js` (một nguồn). Dấu mộc chỉ cho trạng thái tiền.

**Thao tác khó hoàn tác hoặc đụng tới tiền:** luôn qua `HopXacNhan` — nói rõ đối tượng và hệ quả, nút mang tên hành động,
focus ban đầu ở lựa chọn an toàn, Esc là "không làm". Không hỏi xác nhận cho thao tác thường (hỏi mọi thứ thì không ai đọc).

**Trang kết quả (thanh toán, gửi form):** dòng đầu là trạng thái bằng chữ ("Đã xong" / "Chưa xong" / "Đang chờ"), rồi tiêu
đề, rồi mục "Tiếp theo" nói điều gì xảy ra kế và khi nào. Liên kết nằm ngoài khối `role="status"`. Không hứa điều hệ thống
không có cơ chế thực hiện.

**Màu trạng thái:** chỉ ba màu ngữ nghĩa `danger`, `success`, `warning` + mực; luôn kèm chữ (và biểu tượng nếu có).
Không dùng bảng màu mặc định của Tailwind (`red-500`, `gray-200`…) — cổng `kiem-token` chặn.

**Giới hạn đã biết:** nghiên cứu nền là của Mỹ và châu Âu, đo trên trang mua sắm; chưa có số đo của người dùng Việt Nam.
Ô "nhập lại mật khẩu" ở trang đặt lại mật khẩu còn giữ (nguồn mâu thuẫn: GOV.UK bảo bỏ, OWASP bảo giữ). Backend chưa trả
trạng thái lượt chuyển vé đang chờ nên trang vé chỉ nhớ lượt chuyển trong phiên.

## Trang nghệ sĩ, sao kê tiền ủng hộ, tài khoản (30/09/2026, đợt 2)

**Chữ trên màn hình phải khớp việc backend làm.** Mỗi câu nói về hậu quả ("sẽ mở khiếu nại", "xoá ngay", "quản trị
viên sẽ nhận cảnh báo") được đối chiếu với handler trước khi viết, và chú thích trong tệp ghi tên handler. Đợt này sửa:
"xoá dữ liệu" báo là *yêu cầu* trong khi backend xoá **ngay** và đóng tài khoản; trang xác nhận của nghệ sĩ hỏi chung
một câu cho hai mục đích khác nhau (`BankAccount` và `DonationReceipt`).

**Tên trường và giá trị gửi đi phải lấy từ DTO, không đoán.** Hai lỗi chặn chức năng tìm được khi làm lại giao diện:
- `PreferencesTab` đọc `preferredGenreIds` (không tồn tại; DTO trả `favouriteGenreIds`) → trang luôn hiện trống và bấm Lưu
  xoá sạch sở thích (PUT ghi đè). Kiểm bằng `kiem_so_thich.mjs`: đặt qua API → mở trang → Lưu → đọc lại; đột biến tên
  trường cũ thì đỏ ("MẤT DỮ LIỆU").
- `IdentityTab` gửi `HouseholdBusiness` / `Individual`; enum chỉ nhận `HouseholdOrIndividual` / `Enterprise` (API trả 400).
Form ghi đè toàn bộ mà tải dữ liệu cũ hỏng thì **không hiện form** — chỉ báo lỗi và nút thử lại.

**Bảng tiền có dòng tổng thì các dòng chính phải cộng ra tổng.** Sao kê: ba dòng chính (nền tảng giữ · phòng trà giữ ·
phòng trà báo đã chuyển) chia hết phần của nghệ sĩ; dòng "trong đó" thụt vào, chữ nhỏ hơn, là tập con của dòng ngay trên.
Số khác đơn vị (tiền khán giả trả, chưa trừ phí) nằm ngoài bảng. Số tiền canh phải, chữ đơn cách.

**Lỗi tải ≠ rỗng ≠ không tồn tại.** Ba trạng thái in ba câu khác nhau; lỗi tải luôn có nút "Thử lại" và `role="alert"`.
Không `toast` thay cho trạng thái lỗi của trang (toast tự biến mất, trang còn lại nói sai).

**Nút bật/tắt** mang `aria-pressed` và có dấu hiệu ngoài màu (biểu tượng ✓/✕ hoặc nền đặc). **Lựa chọn một trong nhiều**
là nhóm radio trong `fieldset` + `legend`. **Nút gửi không bị khoá** khi form chưa đủ: bấm thì báo lỗi dưới đúng mục thiếu
và đưa focus tới đó (GOV.UK: nút khoá không nói vì sao).

**Không lồng phần tử tương tác:** dòng danh sách có nút riêng thì tên là liên kết, nút đứng cạnh — không bọc cả dòng
bằng `<Link>` rồi chặn `preventDefault`.

**Trang xem trực tuyến:** dưới `lg` xếp dọc (video 16:9 trên, trò chuyện chiếm phần còn lại). Nhãn "Đang phát" dùng ember,
không nhấp nháy. Các hộp (ủng hộ, đánh giá, báo cáo, cắt sóng) là `<dialog>`; hàm xử lý ở trang cha NÉM lỗi để hộp in
câu backend ngay trong hộp — không toast rồi nuốt lỗi (hộp ủng hộ cũ báo "thành công" khi chưa tạo được khoản nào, và
trước khi người xem trả tiền ở VNPay). Nút gửi của hộp ủng hộ nói đúng việc sắp xảy ra: "Thanh toán X đ qua VNPay".
Không dùng ký hiệu đô-la cho sản phẩm tính tiền đồng. Kiểm: `kiem_hop_truc_tuyen.mjs` (giả lập mạng; đột biến "nuốt lỗi"
thì đỏ). CHƯA kiểm được: phát HLS thật, trò chuyện SignalR thật, hộp đánh giá (cần buổi đã kết thúc + đăng nhập).

## Tiêu chí duyệt giao diện (chốt 30/09/2026)

> Rút từ chính lời chủ dự án trong ngày 30/09 và từ những bản đã bị từ chối. Mục đích: trang nào làm lại cũng được
> duyệt theo cùng một thước, không phải đoán. Sửa mục này khi chủ dự án nói khác, và ghi ngày.

**Chủ dự án muốn** (nguyên văn): "nhẹ nhàng, tinh tế, sang trọng, đắt giá"; "ấm cúng và thân thiện với người dùng";
"cảm giác nghệ thuật"; "thu hút người ghé thăm". **Không muốn**: "sặc sỡ, chối mắt", "khô cứng", "không tinh tế".

**Đã chốt, giữ nguyên:**
- Thế giới "tờ chương trình ca nhạc" và bảng giờ diễn mở thành hộp đèn ("UI bảng giờ diễn rất nổi bật").
- Bảng màu Sơn then và lụa ngà. Giao diện gần như không màu, ẢNH mang màu; màu nhấn và ánh kim dưới ~10% diện tích.
- Chữ Anton / Be Vietnam Pro / JetBrains Mono, góc vuông, viền mực.

**Đã bị từ chối, không đề xuất lại:**
- Bản "dịu màu" (vàng nhạt có thớ giấy, chữ Bricolage nét tròn, bo góc mềm, nét vẽ ca sĩ): chủ dự án yêu cầu lấy lại bản trước.
- Bốn bản mẫu Stitch (nền tối ấm, áp phích bolero, bảng phấn, chạng vạng): "xấu quá".
- Ảnh kho Wikimedia (nhạc cụ cận cảnh): "kì quá". Ảnh do chủ dự án tự tạo bằng Gemini và đưa vào `anh-gemini/`.
- Thiết kế cũ Warm Luxury và mọi thứ của nó: không trộn, không tham khảo.

**Máy kiểm (phải xanh trước khi đưa chủ dự án xem):**
- `npm run kiem-thiet-ke` (5 cổng) và `npm run build`.
- Mọi cặp chữ trên nền đạt 4.5:1, đo từ `src/index.css`.
- Không tràn ngang ở 390, 1100 và 1440px (`scrollWidth` bằng bề rộng màn).
- Bốn chuỗi nghiệp vụ và quét 96 trang không sập.

**Mắt kiểm (máy không thay được):**
- Chụp trang với dữ liệu giống thật và ảnh thật, máy tính và điện thoại. Dữ liệu trống che lỗi: ba lỗi của bảng lịch
  tuần (thiếu tên buổi, liên kết gãy dòng, trang tràn 530px) chỉ lộ ra khi bảng có dữ liệu.
- Không có mảng màu bão hoà lớn; ảnh sân khấu là thứ sáng nhất trong khung nhìn đầu.

**Cách làm để không phải làm lại:** một trang mẫu cho mỗi loại trang → chủ dự án duyệt trên ảnh chụp thật → mới nhân
rộng. Không đổi hướng thị giác giữa chừng một đợt nhân rộng; ý mới ghi lại và áp ở đợt sau.

### Trang chủ: Sắp lên đèn · Thẻ gu · Đêm đã qua (03/10/2026)
Nghiên cứu: `reports/Trang chủ - buổi diễn nổi bật.md` (repo backend). Chủ dự án chọn ý tưởng 1·5·10; bỏ "ban biên tập chọn" (cần backend) và bản đồ phòng trà (đã làm rồi bỏ, 03/10).
- **Sắp lên đèn** (`SapLenDen`): buổi gần nhất KHÔNG phải tối nay in lớn trên khối sơn then (ảnh bìa, ai hát + một câu giới
  thiệu, nơi diễn, "N khu · còn X vé" từ sơ đồ khu, cuống Đặt vé), dưới là tối đa 4 buổi "Tiếp theo". Lý do chọn in ngay
  dòng đầu ("Gần nhất"). Không có buổi nào thì không in khối.
- **Thẻ gu** (`TheGu`): tối đa 4 dòng nhạc đang có buổi, luôn hiện; mỗi thẻ một ảnh khác nhau khi có thể (gán thẻ ít lựa
  chọn trước). Danh sách gu đầy đủ vẫn gập.
- **Đêm đã qua** (`DemDaQua`): chỉ in khi có ít nhất một lời bình THẬT; sao màu lamp (vàng thếp `ember` chỉ cho đang diễn).

### Thanh lọc ngang trang Buổi diễn (03/10/2026)
Nghiên cứu: `reports/Bộ lọc trang Buổi diễn.md` (repo backend). Chủ dự án chọn phương án A (thanh ngang) thay cột lọc trái.
- Mốc ngày bấm thẳng (nút `aria-pressed`); bốn nút thả: Dòng nhạc · Giá · Hình thức · Thêm bộ lọc. Nhãn nút in thứ đang
  chọn ("Dòng nhạc · 2", "Dưới 300.000đ"); đang có lọc thì nút là khối mực.
- Số buổi cạnh mỗi lựa chọn (`demLuaChon`, đếm đúng luật lọc backend); 0 buổi thì mờ, không bấm được, xếp cuối. Đang lọc
  theo từ khoá/giá/tâm trạng/không gian thì ẩn số (không in số sai).
- Giá có mức gợi ý + ô tự nhập kèm nút "Áp dụng". Dải "đang lọc" + × + "Xoá tất cả" ngay trên kết quả.
- Nút thả là disclosure (không phải menu ARIA): Esc đóng và trả focus, bấm ra ngoài đóng. Điện thoại giữ hộp lọc phủ.
