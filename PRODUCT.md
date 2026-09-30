# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Khán giả** (chính): người ở TP.HCM muốn đi phòng trà — tìm đêm nay/tuần này có phòng trà nào diễn, ai hát,
  không khí thế nào; mua vé online, xem vé + mã QR, gọi món tại chỗ, ủng hộ nghệ sĩ, gửi khiếu nại (kể cả khi
  chưa đăng nhập). Chủ dự án xác nhận 30/09: khán giả dùng **website**, ưu tiên màn máy tính; điện thoại vẫn
  phải dùng được trọn vẹn.
- **Chủ phòng trà** (Owner): dựng hồ sơ phòng trà, xác minh danh tính người bán, mua gói dịch vụ, tạo buổi diễn
  (hạng vé, line-up, giấy phép biểu diễn, mã tác quyền VCPMC), gửi duyệt, theo dõi tiền & quyết toán, thực đơn.
- **Nhân viên** (Staff): vận hành đêm diễn tại chỗ — bắt đầu/kết thúc buổi, soát vé QR, bán vé tại quầy tiền mặt,
  xử lý đơn gọi món. Làm việc dưới áp lực thời gian ở cửa và quầy.
- **Quản trị viên** (Admin): duyệt phòng trà, định danh, buổi diễn, tài khoản nhận tiền; xử lý khiếu nại, hoàn
  tiền, án phạt; cấu hình hệ thống; sổ cái và quyết toán.
- Nghệ sĩ/người biểu diễn **không có tài khoản** — do phòng trà quản lý; chỉ nhận liên kết xác nhận qua email.

## Product Purpose

MusicLounge là sàn bán vé và vận hành cho phòng trà độc lập ở TP.HCM: khán giả khám phá và đặt chỗ, phòng trà
bán vé/đồ uống và vận hành đêm diễn, nền tảng giữ hộ tiền và quyết toán minh bạch. Thành công = khán giả tìm được
đêm nhạc và đặt được vé không vướng; phòng trà mở bán và vận hành một đêm diễn trọn vẹn trên hệ thống.
Đồ án tốt nghiệp SEP490 (nhóm GSU26SE68), chạy sandbox trên Azure; luồng tiền và dữ liệu người dùng vẫn phải
đúng như thật.

## Positioning

Hai lời hứa ngang nhau (chủ dự án chốt 30/09):
1. **Khám phá theo phòng trà** — đơn vị tổ chức là phòng trà (không gian luôn tồn tại), không phải buổi diễn
   (thưa); người ta nói "đi phòng trà X". Kiến trúc venue-first đã chốt 23/09.
2. **Tiền minh bạch** — tiền vé giữ hộ tới khi buổi diễn diễn ra mới quyết toán cho phòng trà; buổi bị huỷ thì
   hoàn; tiền ủng hộ nghệ sĩ có sao kê công khai theo từng khoản (trang /minh-bach, /performers/:id/donations).

## Operating Context

- Khán giả: duyệt buổi tối, chọn phòng trà → buổi diễn → hạng vé → giữ chỗ 15 phút → VNPay → vé QR.
- Nhân viên: đứng cửa soát vé bằng mã QR, bán vé tại quầy (tiền mặt, không qua sổ cái), nhận đơn gọi món.
- Chủ phòng trà & Admin: làm việc trên máy tính, nhiều bảng, nhiều bước duyệt có luật pháp lý đi kèm
  (NĐ 144/2020 giấy phép biểu diễn, VCPMC, Luật TMĐT 2025 xác minh người bán, thuế GTGT/TNCN).
- Có app Android riêng cho nhân viên/khán giả (ngoài phạm vi website này).

## Capabilities and Constraints

- React 19 + Vite 8 + Tailwind 4 (JS, không TypeScript); backend .NET 8 REST `/api/v1`. Đã chốt: framer-motion là
  tầng chuyển động duy nhất; Radix qua shadcn/ui cho hộp thoại/ô chọn có khả năng tiếp cận.
- Vai trò và 61 địa chỉ: công khai (trang chủ, buổi diễn, phòng trà, tìm kiếm, minh bạch, nghệ sĩ, khiếu nại,
  kết quả thanh toán), khán giả (tài khoản, vé của tôi, thông báo, gọi món, livestream), /owner (chủ + nhân viên
  theo quyền), /admin.
- Tiền là số nguyên đồng; giá không bao giờ đứng một mình (nói rõ gồm gì/chưa gồm gì).
- Luật hiển thị bất biến (tài liệu yêu cầu 23/09 §3): mọi chữ/số truy được về dữ liệu thật; mỗi khối có đủ trạng
  thái tải/trống/lỗi/có dữ liệu/tin xấu; không con số gây áp lực giả (không "còn N vé", đếm ngược, "N người
  đang xem"); trang biết người xem là ai (chưa đăng nhập thì nói trước).
- Thuật ngữ: "buổi diễn"/"buổi hoà nhạc", không dùng "sự kiện"; "phòng trà"; "chủ phòng trà"; "khán giả".
- Ngôn ngữ: tiếng Việt là mặc định; song ngữ Việt–Anh cho giao diện nằm trong đợt thiết kế lại (MLACP-407,
  chủ dự án duyệt 30/09); backend đã song ngữ theo Accept-Language.
- CHƯA CÓ: nội dung Điều khoản dịch vụ và Chính sách bảo mật (/terms, /privacy) — chờ chủ dự án cung cấp,
  không tự soạn.

## Brand Commitments

- Tên sản phẩm: **MusicLounge** — dùng thống nhất từ trang khán giả tới khu quản trị (chủ dự án chốt 30/09).
  "Phòng trà Sài Gòn" chỉ là câu mô tả, không phải tên.

## Evidence on Hand

- Ảnh không gian phòng trà thật do chủ phòng trà tải lên (`primaryImageUrl`, thư viện ảnh, tour 360°), dữ liệu
  buổi diễn, line-up, giá, số đêm sắp tới (`upcomingShowCount`), sao kê ủng hộ công khai.
- KHÔNG có: lời chứng thực khách hàng, số liệu người dùng, báo chí, đối tác, logo đối tác — không được bịa.
  Không có khách hàng thật (ý tưởng do GVHD gợi ý). Phòng trà trong dữ liệu mẫu là hư cấu.

## Product Principles

1. Sự thật trước — không một con số, cái tên hay lời hứa nào mà hệ thống không đứng sau.
2. Phòng trà là đơn vị: nơi chốn luôn có mặt, buổi diễn là thứ diễn ra ở đó.
3. Tiền phải đọc được: ai giữ tiền, khi nào tới tay ai, vì sao được hoàn.
4. Người đứng cửa không được chờ: màn vận hành ưu tiên tốc độ và độ rõ hơn biểu cảm.
5. Không thao túng: không khan hiếm giả, không đếm ngược, không mẹo tối.

## Accessibility & Inclusion

Mức bắt buộc theo tài liệu yêu cầu 23/09 §10: điều hướng bàn phím đủ, tiêu điểm nhìn thấy, hộp thoại có bẫy và
khôi phục tiêu điểm, tôn trọng prefers-reduced-motion, tương phản chữ đạt WCAG AA, tiếng Việt có dấu đầy đủ.
