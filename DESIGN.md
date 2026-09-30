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
  success: "#2F7A4F"
  warning: "#8A5A00"
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

Cả ba tự host qua @fontsource trong `src/main.jsx` (có phân vùng tiếng Việt), không gọi Google Fonts lúc chạy.

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
- **Don't** dùng gradient trang trí (ngoại lệ duy nhất: mask răng cưa cuống vé, không hiện thành dải màu).
- **Don't** dùng kính mờ, `backdrop-blur` hay nền trong suốt nhoè.
- **Don't** đặt nhãn chữ hoa giãn chữ (kicker/eyebrow) trên tiêu đề.
- **Don't** in con số trong cam kết mà hệ thống không hứa ("100%", "24 giờ"), hay số gây áp lực ("còn N vé", đếm ngược).
- **Don't** in trạng thái không có trường dữ liệu (không "Đổi giờ", "Hết vé" khi DTO không có).
- **Don't** bịa kênh liên hệ (số điện thoại, email) hay liên kết `href="#"`.
- **Don't** dùng ember ngoài buổi đang diễn, stamp ngoài tiền, dấu mộc trên nền mực, shadow-glow ngoài thứ sáng đèn.

## Mở rộng sang màn vận hành (Chủ phòng trà / Nhân viên / Admin) — CHƯA DỰNG

> Chưa có màn Operate nào được dựng trong thế giới này. Mục này là hướng suy ra từ token, không phải hệ đã kiểm chứng; viết lại sau khi màn đầu tiên xong.

- Nền `page` giấy trắng thay giấy stock; mực, viền 2px, góc vuông, tabular-nums giữ nguyên.
- Khối mực (espresso) cho thanh bên theo đúng ghi chú token; wordmark tone lamp trên đó.
- Bảng dữ liệu theo mẫu Lịch tuần (thead mực, số mono thẳng cột), không theo bảng giờ diễn — bảng lật và hộp đèn là của Persuade.
- Dấu mộc cho trạng thái tiền trong sổ cái/quyết toán/hoàn tiền (giữ hộ, đã hoàn, đã quyết toán); ember cho buổi đang diễn ở màn nhân viên.
- Lỗi/cảnh báo dùng danger / danger-soft / warning, không mượn stamp.

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
