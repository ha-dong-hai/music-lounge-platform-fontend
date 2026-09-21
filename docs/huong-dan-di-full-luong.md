# Đi hết một vòng nghiệp vụ trên giao diện — từng bước một

Tài liệu này viết cho **người thao tác trên giao diện**, không cần biết gì về bên trong hệ thống.
Mỗi bước có: bấm ở đâu, điền gì (có sẵn để copy), và **vì sao** bước đó tồn tại.

Cách dùng: mở tài liệu này cạnh cửa sổ trình duyệt, làm tuần tự từ trên xuống. **Đừng nhảy bước** —
lý do ở ngay phần dưới đây.

Mọi con số ràng buộc trong tài liệu đọc từ mã nguồn backend tại commit `a55e680`, không phải phỏng
đoán. Nếu giao diện báo một con số khác thì mã nguồn đúng và tài liệu này sai — sửa lại đây.

---

## Vì sao thứ tự quan trọng: sáu cái cửa

Bấm "Gửi duyệt" một buổi diễn là lúc hệ thống hỏi **sáu câu** cùng lúc. Thiếu bất cứ câu nào cũng
nhận lỗi, và ba trong sáu câu đó **cần Admin làm, không phải bạn**. Đó là lý do phải làm đúng thứ tự
thay vì dựng buổi diễn trước rồi mới lo giấy tờ.

| # | Cửa | Ai mở | Mở ở bước nào |
|---|---|---|---|
| 1 | Phòng trà phải ở trạng thái **Đã duyệt** | **Admin** | Bước 9 |
| 2 | Chủ phòng trà phải **được xác minh CCCD** | **Admin** | Bước 8 |
| 3 | Buổi diễn phải có **≥ 1 hạng vé** | bạn | Bước 13 |
| 4 | Buổi diễn phải có **≥ 1 nghệ sĩ** | bạn | Bước 12 |
| 5 | Phải khai **văn bản chấp thuận biểu diễn** | bạn | Bước 14 |
| 6 | Phải nộp trước **≥ 7 ngày làm việc** so với ngày diễn | bạn | Bước 11 (chọn ngày) |

Cửa số 6 là cái duy nhất **không sửa được sau**: đặt ngày diễn quá gần thì phải dời lịch mới nộp
được. Vì vậy ngày diễn trong bộ dữ liệu mẫu dưới đây đặt xa hơn mức cần.

---

## Bước 0 — Chuẩn bị (5 phút, làm một lần)

**Bạn cần ba tài khoản khác nhau**, vì một người không thể vừa là khán giả vừa là chủ phòng trà vừa
là Admin:

| Vai | Lấy ở đâu |
|---|---|
| Khán giả | tự đăng ký ở Bước 1 |
| Chủ phòng trà | tự đăng ký ở Bước 5 |
| **Admin** | **không tự đăng ký được** — phải có sẵn |

> **Điểm phải chú ý:** giao diện đăng ký chỉ cho chọn *Khán giả* hoặc *Chủ phòng trà*. Không có
> đường nào tự lên Admin, và cũng **không có chức năng đổi vai sau khi đã đăng ký**. Nếu bạn chưa có
> tài khoản Admin trên hệ thống đang chạy thì dừng ở đây và lấy nó trước — không có Admin thì cả
> luồng tắc ở Bước 8.

Mở ba cửa sổ trình duyệt riêng (hoặc ba cửa sổ ẩn danh) cho ba vai, để không phải đăng xuất đăng
nhập liên tục.

**Chuẩn bị sẵn 4 tệp ảnh** trên máy — nội dung gì cũng được, ảnh chụp màn hình cũng được:

| Tệp | Dùng ở bước |
|---|---|
| 2 ảnh bất kỳ (đặt tên `cccd-truoc.jpg`, `cccd-sau.jpg`) | Bước 6 — ảnh hai mặt CCCD |
| 1 ảnh ngang, đẹp (`phong-tra.jpg`) | Bước 7 — ảnh phòng trà |
| 1 ảnh dọc (`poster-du-phong.jpg`) | Bước 15 — dùng nếu poster AI không chạy |

---

# PHẦN A — KHÁN GIẢ

## Bước 1 — Đăng ký tài khoản khán giả

Vào `/register`.

```
Họ và tên:     Trần Minh Khoa
Email:         khoa.khangia@example.com
Số điện thoại: 0903115577
Mật khẩu:      toi thich nghe nhac trinh
```

Chọn vai **Khán giả**. Tích vào ô đồng ý Điều khoản dịch vụ, rồi bấm Đăng ký.

**Giải thích.** Mật khẩu mẫu ở trên là một câu tiếng Việt không dấu, 25 ký tự — cố ý.

> **Điểm phải chú ý — đây là chỗ gần như ai cũng vướng lần đầu:** mật khẩu phải **tối thiểu 15 ký
> tự** (tối đa 64). Không phải 8, không phải 10. Hệ thống không có xác thực hai lớp, nên mật khẩu là
> yếu tố xác thực duy nhất và ngưỡng phải là 15 theo chuẩn NIST SP 800-63B. Một câu dễ nhớ vừa dài
> vừa an toàn hơn một chuỗi ký tự rối — đó là lý do mẫu viết như trên.

> **Điểm phải chú ý:** ô đồng ý điều khoản **phải do bạn tự tích**, không được đánh dấu sẵn. Đây là
> yêu cầu về căn cứ pháp lý của Luật 91/2025/QH15 — hệ thống từ chối nếu giá trị đó không phải một
> lựa chọn chủ động.

## Bước 2 — Xác minh email

Mở hộp thư của `khoa.khangia@example.com`, bấm liên kết trong thư. Trình duyệt mở `/verify-email`.

**Giải thích.** Chưa xác minh email thì tài khoản chưa dùng được đầy đủ.

> **Điểm phải chú ý:** nếu không nhận được thư, đó **không phải lỗi bạn điền sai** — thường là cấu
> hình gửi thư của hệ thống. Kiểm ở `/admin/system-config` → *Cấu hình hạ tầng* (cần tài khoản
> Admin): nếu `Email:Host` đang báo thiếu thì mọi người đăng ký đều sẽ tắc ở đây.

## Bước 3 — Xem qua giao diện khán giả

Chưa có buổi diễn nào để mua, nhưng làm quen trước:

| Trang | Đường dẫn | Có gì |
|---|---|---|
| Danh sách buổi diễn | `/shows` | những buổi đã được duyệt và đang mở bán |
| Tìm kiếm & lọc | `/shows/search` | lọc theo thể loại, không khí, giá, ngày |
| Danh sách phòng trà | `/lounges` | chỉ hiện phòng trà **đã được duyệt** |
| Vé của tôi | `/my-shows` | vé đã mua, mã QR |
| Thông báo | `/notifications` | mọi thông báo, có phân trang |

> **Điểm phải chú ý:** `/lounges` và `/shows` **chỉ hiện phòng trà đã được duyệt**. Phòng trà bạn
> sắp tạo ở Bước 7 sẽ **không xuất hiện** ở đây cho tới khi Admin duyệt. Đó là đúng, không phải lỗi —
> một địa điểm chưa ai xác minh thì không được nằm trong danh sách công khai và thu tiền vé thật.

---

# PHẦN B — CHỦ PHÒNG TRÀ TỰ CHUẨN BỊ

## Bước 4 — Đăng xuất, sang cửa sổ thứ hai

## Bước 5 — Đăng ký tài khoản chủ phòng trà

Vào `/register`. **Dùng email KHÁC với Bước 1.**

```
Họ và tên:     Lê Hoàng Nam
Email:         nam.chuphongtra@example.com
Số điện thoại: 0912446688
Mật khẩu:      phong tra hoa su 2026
```

Chọn vai **Chủ phòng trà**, tích đồng ý điều khoản, Đăng ký. Rồi xác minh email như Bước 2.

> **Điểm phải chú ý — không sửa được về sau:** vai chọn ở đây là **vĩnh viễn**. Hệ thống không có
> chức năng đổi vai. Chọn nhầm *Khán giả* thì phải đăng ký lại bằng một email khác.

**Giải thích.** Chọn *Chủ phòng trà* ở đây **không** cho bạn quyền bán vé ngay. Hai rào chắn thật
nằm phía sau: phòng trà phải được duyệt (Bước 9) và danh tính người bán phải được xác minh (Bước 8).
Ô chọn này chỉ mở đúng khu vực làm việc, không mở quyền thu tiền.

## Bước 6 — Nộp CCCD để xác minh danh tính người bán

Vào `/account?tab=identity` (hoặc menu tài khoản → *Định danh*).

Phần **Định danh cá nhân (CCCD)**:

```
Số CCCD:   079195012345
Ngày sinh: 12/03/1995
```

Tải ảnh **Mặt trước** = `cccd-truoc.jpg`, **Mặt sau** = `cccd-sau.jpg`. Bấm gửi.

Phần **Hồ sơ thuế** (ở cùng trang):

```
Loại hình:    Hộ kinh doanh / cá nhân kinh doanh
Mã số thuế:   0316245789
Tên pháp lý:  (để trống)
```

**Giải thích.** Luật Thương mại điện tử 2025 Điều 17 buộc nền tảng trung gian xác thực danh tính
người bán **trước khi** cho phép bán. Hệ thống đang chạy thử nên chưa nối được VNeID thật; bước Admin
duyệt tay ở Bước 8 là bản mô phỏng của việc đó.

> **Điểm phải chú ý — định dạng:** số CCCD phải **đúng 9 hoặc 12 chữ số**, không dấu cách, không gạch
> ngang. Ngày sinh phải là một ngày **trong quá khứ**. Mã số thuế phải **10 chữ số**, hoặc 10 chữ số
> kèm 3 chữ số đơn vị trực thuộc (`0316245789-001`).

> **Điểm phải chú ý:** chọn loại hình **Doanh nghiệp** thì *Tên pháp lý* trở thành **bắt buộc** và
> phải đúng như trên giấy chứng nhận đăng ký kinh doanh. Mẫu trên chọn *Hộ kinh doanh / cá nhân* nên
> để trống được. Khác biệt không chỉ là một ô nhập: hộ kinh doanh thì nền tảng khấu trừ thuế thay,
> doanh nghiệp thì tự khai và nền tảng không khấu trừ gì.

> **Điểm phải chú ý:** ảnh CCCD sau khi tải lên được backend chuyển sang vùng lưu **riêng tư**, không
> nằm ở đường dẫn công khai như ảnh poster. Đừng lo ảnh giấy tờ bị lộ ra trang công khai.

Xác thực số điện thoại ở cùng trang là **không bắt buộc** cho luồng này — bỏ qua được.

## Bước 7 — Tạo phòng trà

Vào `/owner/lounge`.

```
Tên phòng trà:  Phòng trà Hoa Sứ
Mô tả:          Không gian nhạc Trịnh và acoustic giữa trung tâm Sài Gòn. Sân khấu mộc,
                60 chỗ ngồi, phục vụ trà và món nhẹ. Đêm nhạc bắt đầu 20:00 các ngày
                cuối tuần.
Đường/số nhà:   128 Nguyễn Đình Chiểu
Phường/Quận:    (để trống được)
Tỉnh/Thành phố: TP. Hồ Chí Minh
Không khí:      chọn một mục có trong danh sách
```

Tải ảnh `phong-tra.jpg` làm ảnh đại diện. Lưu.

> **Điểm phải chú ý:** ô *Phường/Quận* **không bắt buộc**. Cải cách hành chính 2025 đã bỏ cấp
> quận/huyện ở nhiều tỉnh, nên hệ thống không đòi nữa. *Đường/số nhà* và *Tỉnh/Thành phố* thì bắt
> buộc.

> **Điểm phải chú ý:** ô *Không khí* phải chọn từ danh sách có sẵn, không tự nhập. Chọn một giá trị
> không tồn tại sẽ bị từ chối ngay với lỗi nêu rõ tên ô.

**Sau khi lưu, phòng trà ở trạng thái *Chờ duyệt*.** Ở trạng thái này bạn **chưa** làm được:

- nộp duyệt buổi diễn,
- bán vé,
- nhận donate.

Và phòng trà **không hiện** ở `/lounges` công khai. Đây là lúc phải đổi vai.

---

# PHẦN C — ADMIN MỞ HAI CÁI CỬA

## Bước 8 — Admin duyệt CCCD của chủ phòng trà

Sang cửa sổ thứ ba, đăng nhập Admin. Vào `/admin/kyc-reviews`.

Tìm hồ sơ của `Lê Hoàng Nam`, xem ảnh hai mặt và số CCCD, bấm **Duyệt**.

**Giải thích.** Trước khi duyệt, trạng thái là *Chờ xác minh* và **không mở gì cả**. Sau khi duyệt,
trạng thái thành *Đã duyệt* — đó chính là điều kiện mà cửa số 2 hỏi.

> **Điểm phải chú ý:** nếu bạn **Từ chối**, hãy ghi lý do. Chủ phòng trà đọc được lý do đó trong
> thông báo và nộp lại — từ chối mà không nêu lý do thì họ không biết phải sửa gì.

> **Điểm phải chú ý:** cửa này xét **người bán**, không xét người bấm. Admin nộp duyệt buổi diễn thay
> cho một chủ phòng trà chưa xác minh thì **cũng bị chặn**. Không có đường lách.

## Bước 9 — Admin duyệt phòng trà

Vẫn ở cửa sổ Admin. Vào `/admin/venues`.

Tìm `Phòng trà Hoa Sứ` đang *Chờ duyệt*, xem hồ sơ, bấm **Duyệt**.

**Giải thích.** Phòng trà có 6 trạng thái, và chỉ **hai** trạng thái được phép giao dịch:

| Trạng thái | Bán vé / nhận donate? | Hiện công khai? |
|---|---|---|
| Chờ duyệt | không | không |
| **Đã duyệt** | **có** | **có** |
| **Bị cảnh cáo** | **có** | **có** |
| Tạm đình chỉ | không | không |
| Bị khoá | không | không |
| Bị từ chối | không | không |

> **Điểm phải chú ý:** *Bị cảnh cáo* **vẫn bán vé được**. Cảnh cáo là một vết ghi lại, không phải
> lệnh dừng. Đừng tưởng phòng trà bị cảnh cáo là đã ngừng hoạt động.

> **Điểm phải chú ý:** đình chỉ hay khoá một phòng trà **không** ảnh hưởng những buổi diễn đã đăng —
> khán giả đã mua vé không bị liên đới vì vi phạm của địa điểm. Nó chỉ chặn **mở buổi diễn mới**.

---

# PHẦN D — CHỦ PHÒNG TRÀ DỰNG BUỔI DIỄN

Quay lại cửa sổ chủ phòng trà. Tải lại trang để thấy trạng thái mới.

## Bước 10 — Đăng ký gói dịch vụ

Vào `/owner/subscription`. Chọn một gói, bấm đăng ký → chuyển sang VNPay → nhập OTP.

**Giải thích.** Gói dịch vụ quyết định ba hạn mức: số vé tối đa mỗi buổi diễn, **có được dùng poster
AI hay không** và số poster AI mỗi tháng, số cảnh tour 360°.

> **Điểm phải chú ý — rất dễ mất thời gian:** **đừng đóng tab VNPay giữa lúc đang trả tiền.** Mỗi lần
> trả tiền cần một lần bấm OTP; hệ thống **không** có chức năng lấy lại phiếu thanh toán đang chờ. Lỡ
> đóng tab thì phải **chờ 60 phút** mới bấm lại được — bấm sớm hơn sẽ bị từ chối vì hệ thống coi như
> vẫn còn một phiếu đang chờ. Áp dụng cho mọi bước có VNPay, kể cả mua vé ở Bước 19.

> **Điểm phải chú ý:** gói **không tự động gia hạn**. VNPay không cho trừ tiền tự động, nên mỗi lần
> gia hạn đều cần một lần bấm OTP thủ công. Gói hết hạn thì poster AI ngừng dùng được — xem Bước 15.

Ở trang này có ô **Poster AI tháng này** hiện dạng *đã dùng / trần* kèm số còn lại. Ghi nhớ con số
đó, Bước 15 sẽ dùng tới.

## Bước 11 — Tạo buổi diễn

Vào `/owner/shows` → **Tạo buổi diễn**.

```
Tên buổi diễn:     Đêm Nhạc Trịnh — Hạ Trắng
Mô tả:             Một đêm nhạc Trịnh Công Sơn với Hạ Trắng, Diễm Xưa, Cát Bụi và
                   Một Cõi Đi Về. Ban nhạc acoustic mộc: piano, guitar thùng, cello.
                   Không gian 60 chỗ, mở cửa 19:30, bắt đầu 20:00.
Hình thức:         Cả hai (Hybrid)
Bắt đầu:           17/10/2026  20:00
Kết thúc:          17/10/2026  23:00
Đóng bán vé lúc:   17/10/2026  19:00
Thể loại:          Nhạc Trịnh / Acoustic (chọn từ danh sách)
Không khí:         Mộc mạc / Ấm áp (chọn từ danh sách)
```

**Giải thích về ngày 17/10/2026.** Hôm nay là 21/09/2026. Cửa số 6 đòi nộp trước **≥ 7 ngày làm
việc**, tính ra sớm nhất là 30/09/2026. Ngày 17/10 dư ra nhiều — cố ý, để bạn còn thời gian làm các
bước sau mà không bị cửa đó chặn.

> **Điểm phải chú ý — cái này không sửa được bằng cách điền lại:** nếu bạn đặt ngày diễn quá gần (ví
> dụ tuần sau), mọi bước sau vẫn làm được bình thường, nhưng **đến Bước 16 bấm Gửi duyệt mới báo
> lỗi** và bạn phải dời lịch. Đặt xa ngay từ đầu.

> **Điểm phải chú ý:** *Đóng bán vé lúc* phải **trước hoặc bằng** giờ bắt đầu. Để trống thì bán tới
> khi buổi diễn kết thúc.

> **Điểm phải chú ý:** chọn **Cả hai (Hybrid)** trong mẫu là có lý do — nó mở được cả vé tại chỗ lẫn
> vé xem trực tuyến ở Bước 13, nên đi được cả hai nhánh soát vé và livestream ở Phần F. Chọn *Tại
> chỗ* thì không có gì để phát trực tuyến; chọn *Trực tuyến* thì không có gì để soát vé.

> **Điểm phải chú ý:** hệ thống kiểm **trùng khung giờ tại cùng phòng trà** hai lần — một lần lúc tạo
> để báo sớm, một lần lúc gửi duyệt để chốt. Nên một buổi diễn khác chiếm khung giờ trong lúc bạn
> đang dựng thì đến Bước 16 mới biết.

## Bước 12 — Thêm nghệ sĩ vào danh sách biểu diễn

Trước tiên tạo nghệ sĩ ở `/owner/performers`:

```
Nghệ sĩ 1
  Tên:        Nguyễn Thu Hà
  Loại:       Solo
  Giới thiệu: Ca sĩ hát nhạc Trịnh, 8 năm biểu diễn tại các phòng trà Sài Gòn.
  Email:      thuha.casi@example.com
  Thể loại:   Nhạc Trịnh (chọn từ danh sách)

Nghệ sĩ 2
  Tên:        Ban nhạc Sài Gòn Acoustic
  Loại:       Band
  Giới thiệu: Nhóm acoustic ba người: piano, guitar thùng, cello.
  Email:      (để trống)
```

Rồi vào `/owner/shows/<mã buổi diễn>` → phần **Danh sách biểu diễn** → thêm:

| Nghệ sĩ | Vai |
|---|---|
| Nguyễn Thu Hà | **Chính (Main)** |
| Ban nhạc Sài Gòn Acoustic | **Khách (Guest)** |

**Giải thích.** Vai chỉ có ba giá trị: *Chính*, *Khách*, *Dẫn chương trình*. Thứ tự trong danh sách
là thứ tự hiện ra cho khán giả.

> **Điểm phải chú ý:** khán giả **donate cho từng suất biểu diễn**, không donate cho buổi diễn. Nên
> danh sách này không chỉ để trang trí — không có nghệ sĩ thì không có gì để donate ở Bước 22.

> **Điểm phải chú ý:** nghệ sĩ có khai email sẽ nhận thư xác nhận tham gia. Mẫu trên để nghệ sĩ 2
> trống email cho nhanh; muốn thử luồng đó thì điền một email thật bạn đọc được.

## Bước 13 — Tạo hạng vé

Trước tiên tạo khu vực ghế ở `/owner/zones` (cần cho vé tại chỗ):

```
Khu vực 1:  Tên = Khu A — sát sân khấu     Sức chứa = 20
Khu vực 2:  Tên = Khu B — giữa phòng       Sức chứa = 40
```

Rồi vào `/owner/shows/<mã>` → **Hạng vé** → tạo ba hạng:

```
Hạng vé 1
  Tên:            Vé VIP sát sân khấu
  Loại:           Tại chỗ (Physical)
  Khu vực:        Khu A — sát sân khấu
  Tổng sức chứa:  20
  Đợt giá:
      Tên đợt = Giá chuẩn | Giá = 500000 | Kênh bán = Cả hai | Số lượng = 20

Hạng vé 2
  Tên:            Vé thường
  Loại:           Tại chỗ (Physical)
  Khu vực:        Khu B — giữa phòng
  Tổng sức chứa:  40
  Đợt giá:
      Tên đợt = Mua sớm  | Giá = 200000 | Kênh bán = Trực tuyến | Số lượng = 15
      Tên đợt = Giá chuẩn| Giá = 250000 | Kênh bán = Cả hai     | Số lượng = 25

Hạng vé 3
  Tên:            Vé xem trực tuyến
  Loại:           Xem trực tuyến (Livestream)
  Khu vực:        (không chọn)
  Tổng sức chứa:  200
  Đợt giá:
      Tên đợt = Giá chuẩn | Giá = 120000 | Kênh bán = Trực tuyến | Số lượng = 200
```

**Giải thích.** Một *hạng vé* là một loại chỗ; bên trong nó có một hoặc nhiều *đợt giá*. Hạng "Vé
thường" ở trên có hai đợt để bạn thấy cơ chế mua sớm — 15 vé đầu giá 200.000đ, sau đó 250.000đ.

> **Điểm phải chú ý — giá phải là số nguyên đồng.** `250000` được, `250000.5` bị từ chối. Và giá phải
> **lớn hơn 0** — không tạo được vé miễn phí bằng cách điền 0.
>
> Nhập số **không có dấu chấm phân cách**: `250000`, không phải `250.000`.

> **Điểm phải chú ý:** mỗi hạng vé phải có **ít nhất một đợt giá**. Tạo hạng vé mà không có đợt giá
> nào sẽ bị từ chối.

> **Điểm phải chú ý:** *Kênh bán* quyết định vé đó bán ở đâu — *Trực tuyến* là khán giả tự mua trên
> web, *Tại chỗ* là quầy vé bán trực tiếp tối hôm diễn, *Cả hai* là cả hai. Đợt "Mua sớm" ở mẫu để
> *Trực tuyến* nên quầy vé sẽ không thấy nó.

> **Điểm phải chú ý:** vé *Xem trực tuyến* **không chọn khu vực ghế** — người xem qua mạng không có
> chỗ ngồi. Còn vé *Tại chỗ* thì nên gắn khu vực, vì đó là thứ hiện lên sơ đồ chỗ ngồi cho khán giả.

## Bước 14 — Khai văn bản pháp lý

Vào `/owner/shows/<mã>`, tìm hai ô khai báo:

```
Văn bản chấp thuận tổ chức biểu diễn:
    Số 1842/GP-SVHTT ngày 02/10/2026 do Sở Văn hóa và Thể thao TP. Hồ Chí Minh cấp

Mã tác quyền âm nhạc (VCPMC):
    HĐ-VCPMC/2026/1184 ngày 05/10/2026
```

**Giải thích.** Nghị định 144/2020 Điều 10 buộc buổi diễn **bán vé** phải có văn bản chấp thuận biểu
diễn. Mọi buổi diễn trên nền tảng này đều bán vé (cửa số 3 đòi ≥ 1 hạng vé), nên điều kiện áp dụng
đồng loạt, không có ngoại lệ.

> **Điểm phải chú ý:** ô **văn bản chấp thuận là bắt buộc** để gửi duyệt (cửa số 5). Ô **mã tác quyền
> VCPMC không bắt buộc** cho việc gửi duyệt, nhưng nên khai — nó là bằng chứng đã trả tác quyền cho
> các bài hát trong chương trình.

> **Điểm phải chú ý:** hệ thống **không kiểm tra** số văn bản này có thật hay không — nó chỉ lưu lại
> lời khai. Trách nhiệm về tính chính xác thuộc người khai.

## Bước 15 — Tạo poster (tuỳ chọn, nhưng nên thử)

Vào `/owner/shows/<mã>/settings`, phần **Poster**.

```
Gợi ý phong cách cho AI:
    tông trầm, ánh đèn vàng, có bóng người hát bên piano
```

Bấm **Tạo poster bằng AI**, đợi khoảng 20 giây.

**Giải thích.** Ô này **không phải ô viết câu lệnh cho AI**. Hệ thống tự ghép phần chính từ dữ liệu
buổi diễn — tên chương trình, tên phòng trà, ngày giờ, thể loại — rồi nối câu của bạn vào cuối. Nên
đừng nhập lại những thứ nó đã biết; chỉ cần một câu về phong cách.

> **Điểm phải chú ý — bắt buộc đọc lại chữ trên ảnh:** poster trả về là **poster hoàn chỉnh, chữ
> tiếng Việt do AI tự viết**. Tiện, nhưng có lần mô hình **tự bịa ra một địa chỉ, một số hotline, một
> website và một trang Facebook không có thật**. Hệ thống đã chặn bằng cách liệt kê dứt khoát những
> gì được phép in, nhưng đây vẫn là mô hình sinh ảnh, không phải máy in.
>
> Trên poster **chỉ được có**: tên chương trình, tên phòng trà, ngày và giờ. **Thấy địa chỉ, số điện
> thoại, website hay giá vé nghĩa là AI bịa** — tạo lại, hoặc tự tải ảnh khác lên.

> **Điểm phải chú ý:** lần tạo **thất bại không bị trừ lượt** nào — cả hạn mức tháng lẫn giới hạn mỗi
> buổi diễn đều chỉ đếm lần tạo được ảnh. Cứ bấm lại.

> **Điểm phải chú ý:** gói dịch vụ **hết hạn** thì nút này ngừng chạy và giao diện nói rõ là *chỉ cần
> gia hạn*, khác với *gói không có tính năng này*. Đừng đi mua gói khác khi chỉ cần gia hạn.

Không tạo được thì bấm **Tự tải poster** và dùng `poster-du-phong.jpg`. Poster không phải điều kiện
để gửi duyệt.

## Bước 16 — Gửi duyệt

Vào `/owner/shows/<mã>`, bấm **Gửi duyệt**.

Ngay trên nút có một bảng kiểm liệt kê từng điều kiện cùng dấu ✓ hoặc ✗. **Đọc bảng đó trước khi
bấm** — nó nói thẳng bạn còn thiếu gì, đỡ phải đoán từ câu lỗi.

Thành công thì trạng thái đổi **Nháp → Chờ duyệt**.

> **Điểm phải chú ý:** chỉ buổi diễn đang ở **Nháp** mới gửi duyệt được. Bấm hai lần thì lần thứ hai
> bị từ chối — không tạo ra hai phiếu duyệt trùng.

---

# PHẦN E — ADMIN KIỂM DUYỆT

## Bước 17 — Admin duyệt buổi diễn

Sang cửa sổ Admin, vào `/admin/shows` → tab **Chờ kiểm duyệt**.

Mở `Đêm Nhạc Trịnh — Hạ Trắng`, xem mô tả, hạng vé, danh sách nghệ sĩ, văn bản đã khai. Bấm
**Duyệt**.

**Giải thích.** Hạn xử lý kiểm duyệt là **24 giờ**. Duyệt xong, trạng thái buổi diễn thành **Đã
đăng** và vé mở bán.

> **Điểm phải chú ý:** nếu **Từ chối**, buổi diễn quay về **Nháp** — trông giống hệt một bản nháp
> chưa từng gửi. Chủ phòng trà chỉ biết lý do qua bảng kết quả kiểm duyệt ở `/owner/shows/<mã>`, nên
> **hãy ghi lý do rõ ràng**. Từ chối mà không nêu lý do thì họ sẽ gửi lại đúng thứ vừa bị từ chối.

## Bước 18 — Kiểm tra bằng mắt khán giả

Về cửa sổ khán giả, vào `/shows`. Buổi diễn phải xuất hiện. Mở trang chi tiết
`/shows/<mã>` — phải thấy poster, mô tả, danh sách nghệ sĩ, các hạng vé và sơ đồ chỗ ngồi.

---

# PHẦN F — KHÁN GIẢ MUA VÉ

## Bước 19 — Giữ chỗ và trả tiền

Ở `/shows/<mã>`, chọn **Vé thường**, số lượng **2**, bấm mua.

Hệ thống **giữ chỗ 15 phút** rồi chuyển sang VNPay. Nhập OTP thử nghiệm của VNPay.

**Giải thích.** Giữ chỗ tồn tại để hai người không cùng mua một chỗ. Hết 15 phút mà chưa trả tiền
thì chỗ được nhả lại cho người khác.

> **Điểm phải chú ý — hai cái đồng hồ khác nhau, đừng lẫn:**
> - **15 phút** là thời gian giữ chỗ. Quá hạn thì mất chỗ, mua lại từ đầu.
> - **60 phút** là thời gian bị khoá nếu bạn **đóng tab VNPay** giữa lúc trả tiền. Hệ thống không có
>   chức năng lấy lại phiếu thanh toán đang chờ, nên đóng tab là phải đợi hết 60 phút mới bấm mua
>   lại được.
>
> Kết luận thực dụng: **bấm mua xong thì đi hết VNPay, đừng bỏ giữa đường.**

> **Điểm phải chú ý:** mỗi lần giữ tối đa **10 vé**. Cần nhiều hơn thì mua nhiều lần.

> **Điểm phải chú ý — đọc trước khi trả tiền:** ngay phía trên nút trả tiền có **điều kiện hủy vé và
> hoàn tiền**. Đọc nó *trước*, không phải sau. Điều kiện này do hệ thống dựng nên mọi người mua đều
> thấy cùng một bản.

Trả tiền xong, trình duyệt về `/payment/success`.

## Bước 20 — Xem vé và mã QR

Vào `/my-shows` → tab **Vé của tôi** → mở vé → `/my-shows/ticket/<mã vé>`.

Trang này có **mã QR** để soát vé, số ghế nếu là vé tại chỗ, và liên kết sang trang buổi diễn.

> **Điểm phải chú ý:** vé *Xem trực tuyến* **không dùng mã QR** — nút của nó dẫn sang trang xem trực
> tiếp. Vé *Tại chỗ* thì mã QR là thứ quầy soát vé quét.

---

# PHẦN G — TỐI DIỄN

Buổi diễn mẫu đặt ngày 17/10/2026 nên chưa tới. Muốn thử ngay Phần G thì có hai cách:

- **Cách sạch hơn:** dựng thêm một buổi diễn thứ hai, nhưng phần này vẫn vướng cửa 7 ngày làm việc.
- **Cách nhanh:** dùng chức năng **dời lịch** ở `/owner/shows/<mã>/settings` để kéo buổi diễn về gần.
  Lưu ý dời lịch là thay đổi **ảnh hưởng người đã mua vé**, nên có bước xác nhận riêng và nói rõ hệ
  quả — đọc câu đó, đừng bấm qua.

## Bước 21 — Soát vé tại cửa

Chủ phòng trà (hoặc nhân viên) vào `/owner/operate`.

Quét mã QR trên màn hình vé của khán giả, hoặc dán chuỗi mã QR vào ô nhập.

**Giải thích.** Soát vé xong, vé chuyển sang *đã vào cửa* và **không dùng lại được** — quét lần hai
sẽ bị từ chối.

> **Điểm phải chú ý:** quầy vé bán trực tiếp tối hôm diễn tối đa **20 vé** một lần, và chỉ bán được
> những đợt giá có kênh bán là *Tại chỗ* hoặc *Cả hai*. Đợt "Mua sớm" ở mẫu để *Trực tuyến* nên sẽ
> không hiện ở quầy — đó là đúng.

## Bước 22 — Phát trực tuyến và donate

**Phía chủ phòng trà:** vào `/owner/livestreams`, tạo buổi phát cho buổi diễn, lấy thông tin phát rồi
bắt đầu phát.

**Phía khán giả:** vào `/livestream/<mã buổi diễn>`. Xem, chat, và donate cho nghệ sĩ:

```
Chọn nghệ sĩ: Nguyễn Thu Hà
Số tiền:      200000
Lời nhắn:     Chị hát Hạ Trắng hay quá, chúc chị nhiều sức khoẻ!
```

> **Điểm phải chú ý:** donate là **cho từng nghệ sĩ**, không phải cho buổi diễn. Đó là lý do Bước 12
> bắt buộc có nghệ sĩ.

> **Điểm phải chú ý:** số tiền từ **1đ đến 50.000.000đ**, và phải là **số nguyên đồng**. Lời nhắn tối
> đa 500 ký tự.

> **Điểm phải chú ý:** mất mạng giữa buổi phát thì hệ thống chờ **5 phút** trước khi coi là đã kết
> thúc. Nối lại trong 5 phút thì buổi phát tiếp tục, không phải tạo lại.

> **Điểm phải chú ý:** bản ghi lại buổi phát giữ **30 ngày**.

---

# PHẦN H — SAU BUỔI DIỄN

## Bước 23 — Khán giả đánh giá

Sau khi buổi diễn kết thúc, vào `/shows/<mã>` → nút **Đánh giá buổi diễn**.

> **Điểm phải chú ý:** cửa sổ đánh giá là **7 ngày** sau khi buổi diễn kết thúc. Và chỉ người **đã có
> vé** mới đánh giá được, mỗi người **một lần**. Bấm lần hai sẽ bị từ chối — không phải lỗi.

## Bước 24 — Chủ phòng trà xem tiền về

Vào `/owner/finance` và `/owner/analytics`.

> **Điểm phải chú ý — tiền không về ngay:** quyết toán chia hai chặng. **48 giờ** sau buổi diễn có
> quyết toán một phần; **14 ngày** sau mới quyết toán nốt. Khoảng chờ đó để xử lý hoàn vé và khiếu
> nại phát sinh.

> **Điểm phải chú ý:** phải khai **tài khoản ngân hàng** ở `/owner/bank-accounts` mới nhận được tiền.
> Làm trước đi, đừng đợi tới lúc quyết toán.

Tiền donate cho nghệ sĩ thì xem ở `/owner/donations` — trang này có cả danh sách **donate đã quá hạn
giữ tiền mà chưa trả cho nghệ sĩ**.

## Bước 25 — Khiếu nại và hoàn vé (nhánh phụ, nên thử một lần)

**Khán giả** vào `/complaints`:

```
Loại đối tượng: Buổi diễn
Mã đối tượng:   <mã buổi diễn>
Nhóm khiếu nại: Sự cố kỹ thuật
Nội dung:       Buổi phát trực tuyến bị mất tiếng khoảng 10 phút giữa chương trình.
```

**Admin** xử ở `/admin/complaint`. Hoàn vé xử ở `/admin/refunds`.

> **Điểm phải chú ý:** hạn xử lý khiếu nại là **72 giờ**; hạn xử lý khiếu nại án phạt là **48 giờ**.

> **Điểm phải chú ý:** khiếu nại "donate chưa được trả" **chỉ tạo được sau khi đã quá hạn giữ tiền**.
> Khiếu nại sớm hơn sẽ bị từ chối — không phải lỗi giao diện.

> **Điểm phải chú ý:** trang khiếu nại **không cần đăng nhập**. Nhưng mã đối tượng phải trỏ tới một
> thứ có thật, nếu không sẽ bị từ chối.

---

# PHỤ LỤC 1 — Toàn bộ dữ liệu mẫu, gom một chỗ

```
=== KHÁN GIẢ ===
Họ tên      Trần Minh Khoa
Email       khoa.khangia@example.com
Điện thoại  0903115577
Mật khẩu    toi thich nghe nhac trinh

=== CHỦ PHÒNG TRÀ ===
Họ tên      Lê Hoàng Nam
Email       nam.chuphongtra@example.com
Điện thoại  0912446688
Mật khẩu    phong tra hoa su 2026

CCCD        079195012345
Ngày sinh   12/03/1995
Loại hình   Hộ kinh doanh / cá nhân kinh doanh
Mã số thuế  0316245789

=== PHÒNG TRÀ ===
Tên         Phòng trà Hoa Sứ
Đường       128 Nguyễn Đình Chiểu
Tỉnh/TP     TP. Hồ Chí Minh
Mô tả       Không gian nhạc Trịnh và acoustic giữa trung tâm Sài Gòn. Sân khấu mộc,
            60 chỗ ngồi, phục vụ trà và món nhẹ. Đêm nhạc bắt đầu 20:00 các ngày cuối tuần.

Khu vực 1   Khu A — sát sân khấu     20 chỗ
Khu vực 2   Khu B — giữa phòng       40 chỗ

=== BUỔI DIỄN ===
Tên         Đêm Nhạc Trịnh — Hạ Trắng
Hình thức   Cả hai (Hybrid)
Bắt đầu     17/10/2026 20:00
Kết thúc    17/10/2026 23:00
Đóng bán    17/10/2026 19:00
Mô tả       Một đêm nhạc Trịnh Công Sơn với Hạ Trắng, Diễm Xưa, Cát Bụi và Một Cõi Đi Về.
            Ban nhạc acoustic mộc: piano, guitar thùng, cello. Không gian 60 chỗ,
            mở cửa 19:30, bắt đầu 20:00.

Văn bản     Số 1842/GP-SVHTT ngày 02/10/2026 do Sở Văn hóa và Thể thao TP. Hồ Chí Minh cấp
VCPMC       HĐ-VCPMC/2026/1184 ngày 05/10/2026
Poster AI   tông trầm, ánh đèn vàng, có bóng người hát bên piano

=== NGHỆ SĨ ===
1  Nguyễn Thu Hà | Solo | Vai Chính
   Ca sĩ hát nhạc Trịnh, 8 năm biểu diễn tại các phòng trà Sài Gòn.
   thuha.casi@example.com
2  Ban nhạc Sài Gòn Acoustic | Band | Vai Khách
   Nhóm acoustic ba người: piano, guitar thùng, cello.

=== HẠNG VÉ ===
Vé VIP sát sân khấu | Tại chỗ | Khu A | 20 chỗ
    Giá chuẩn  500000  Cả hai      20
Vé thường           | Tại chỗ | Khu B | 40 chỗ
    Mua sớm    200000  Trực tuyến  15
    Giá chuẩn  250000  Cả hai      25
Vé xem trực tuyến   | Trực tuyến | — | 200 chỗ
    Giá chuẩn  120000  Trực tuyến  200

=== DONATE ===
Nghệ sĩ  Nguyễn Thu Hà
Số tiền  200000
Lời nhắn Chị hát Hạ Trắng hay quá, chúc chị nhiều sức khoẻ!

=== KHIẾU NẠI ===
Đối tượng  Buổi diễn
Nhóm       Sự cố kỹ thuật
Nội dung   Buổi phát trực tuyến bị mất tiếng khoảng 10 phút giữa chương trình.
```

> Số CCCD và mã số thuế ở trên chỉ **đúng định dạng** để đi qua bước kiểm, không phải số thật của ai.
> Dùng cho hệ thống chạy thử.

---

# PHỤ LỤC 2 — Mọi con số ràng buộc, một bảng

| Chỗ | Ràng buộc |
|---|---|
| Mật khẩu | **15**–64 ký tự |
| Vai khi đăng ký | chỉ *Khán giả* hoặc *Chủ phòng trà*; **không đổi được sau** |
| Số CCCD | đúng **9 hoặc 12** chữ số; ngày sinh phải trong quá khứ; bắt buộc **2 ảnh** |
| Mã số thuế | **10** chữ số, hoặc `10 chữ số-3 chữ số` |
| Loại hình Doanh nghiệp | **bắt buộc** khai tên pháp lý |
| Phòng trà | tên + đường + tỉnh/TP bắt buộc; quận/huyện **không** bắt buộc |
| Trạng thái phòng trà được giao dịch | chỉ **Đã duyệt** và **Bị cảnh cáo** |
| Hình thức buổi diễn | *Tại chỗ* / *Trực tuyến* / *Cả hai* |
| Giờ bắt đầu | phải ở **tương lai**; giờ kết thúc phải sau giờ bắt đầu |
| Đóng bán vé | phải **≤** giờ bắt đầu |
| **Nộp duyệt** | trước **≥ 7 ngày làm việc** so với ngày diễn |
| Gửi duyệt cần | ≥1 hạng vé · ≥1 nghệ sĩ · văn bản chấp thuận · phòng trà đã duyệt · CCCD đã duyệt |
| Vai nghệ sĩ | *Chính* / *Khách* / *Dẫn chương trình* |
| Loại nghệ sĩ | *Solo* / *Band* |
| Hạng vé | ≥1 đợt giá; giá **> 0** và là **số nguyên đồng** |
| Loại vé | *Tại chỗ* / *Xem trực tuyến* |
| Kênh bán | *Trực tuyến* / *Tại chỗ* / *Cả hai* |
| Giữ chỗ mua vé | **15 phút**, tối đa **10 vé** mỗi lần |
| Bỏ giữa lúc trả tiền | khoá **60 phút** mới bấm lại được |
| Bán vé tại quầy | tối đa **20 vé** mỗi lần |
| Donate | **1đ – 50.000.000đ**, số nguyên đồng; lời nhắn ≤ 500 ký tự |
| Mất mạng khi phát | chờ **5 phút** trước khi coi là kết thúc |
| Bản ghi buổi phát | giữ **30 ngày** |
| Đánh giá buổi diễn | trong **7 ngày** sau khi kết thúc, phải có vé, **một lần** |
| Hạn kiểm duyệt buổi diễn | **24 giờ** |
| Hạn xử lý khiếu nại | **72 giờ** (khiếu nại án phạt: **48 giờ**) |
| Quyết toán | một phần sau **48 giờ**, nốt sau **14 ngày** |
| Nhắc trước buổi diễn | **24 giờ** |
| Poster AI | tối đa **5** lần tạo thành công mỗi buổi diễn; hạn mức tháng theo gói |

---

# PHỤ LỤC 3 — Gặp lỗi thì tra ở đây

| Hiện tượng | Nguyên nhân thật | Làm gì |
|---|---|---|
| Đăng ký báo lỗi mật khẩu | chưa đủ **15** ký tự | dùng một câu tiếng Việt không dấu |
| Không nhận được thư xác minh | cấu hình gửi thư của hệ thống | kiểm `/admin/system-config` → *Cấu hình hạ tầng* |
| Phòng trà không hiện ở `/lounges` | đang **Chờ duyệt** | Admin duyệt ở `/admin/venues` |
| Gửi duyệt báo *phòng trà đang chờ duyệt* | cửa 1 | Bước 9 |
| Gửi duyệt báo *chưa nộp CCCD* | cửa 2 | Bước 6 rồi Bước 8 |
| Gửi duyệt báo *chưa đủ ngày làm việc* | cửa 6 | dời lịch buổi diễn ra xa hơn |
| Gửi duyệt báo *thiếu hạng vé / nghệ sĩ / văn bản* | cửa 3, 4, 5 | đọc bảng kiểm ngay trên nút |
| Buổi diễn bị từ chối, trông như bản nháp mới | đúng cơ chế | đọc bảng kết quả kiểm duyệt ở `/owner/shows/<mã>` |
| Bấm mua vé báo *đang có phiếu thanh toán chờ* | đã bỏ giữa lúc trả tiền | đợi hết **60 phút** |
| Mất chỗ đang giữ | quá **15 phút** | mua lại |
| Nút poster AI mờ, nói *chỉ cần gia hạn* | gói hết hạn | gia hạn, **đừng mua gói khác** |
| Nút poster AI mờ, nói *gói không có tính năng* | gói không bao gồm | đổi gói |
| Poster có địa chỉ / hotline / website | **AI bịa** | tạo lại hoặc tự tải ảnh lên |
| Quét QR lần hai bị từ chối | vé đã vào cửa | đúng cơ chế |
| Không đánh giá được | quá **7 ngày**, hoặc không có vé, hoặc đã đánh giá | — |
| Đợt giá không hiện ở quầy vé | kênh bán là *Trực tuyến* | đúng cơ chế |
