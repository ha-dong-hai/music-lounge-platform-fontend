# MusicLounge — ứng dụng di động (Android)

Một ứng dụng Flutter phục vụ **hai vai**, mỗi vai có màn hình riêng (chủ dự án chốt 24/09/2026):

| Vai | Màn hình | Ghi chú |
|---|---|---|
| **Khán giả** | Vé của tôi · Đặt đồ ăn tại bàn · Đơn của tôi | Thanh toán đồ ăn bằng **tiền mặt tại quán** |
| **Nhân viên phòng trà** | Bán vé tại quầy · Soát vé QR · Bảng đơn F&B | Phải được chủ phòng trà gán vào một phòng trà |

Chủ phòng trà và quản trị viên **không** dùng app này — họ bị từ chối ở bước đăng nhập, kèm chỉ đường về web.
App **không tạo tài khoản mới**: khán giả đăng ký trên web (nơi có màn đồng ý điều khoản), nhân viên do chủ
phòng trà thêm.

Màn hình được chọn theo **vai** trong token, không theo `lounge_id`: chủ phòng trà cũng có `lounge_id`, nên chọn
theo `lounge_id` sẽ đưa nhầm chủ phòng trà vào màn nhân viên (xem `lib/core/session.dart`, hàm `_applyPhase`).

Phạm vi nền tảng: **chỉ Android**. Không hỗ trợ iOS.

## Chạy và kiểm

```bash
flutter pub get
flutter analyze
flutter test
```

## Build APK

**Bắt buộc đặt biến `GRADLE_OPTS`**, nếu không build sẽ hỏng với lỗi
`Could not close incremental caches ... *.tab` ở `google_sign_in_android` và `mobile_scanner`
(biên dịch tăng dần của Kotlin dùng file ánh xạ bộ nhớ, trên Windows bị khoá; xoá cache không sửa được):

```bash
GRADLE_OPTS="-Dorg.gradle.project.kotlin.incremental=false" flutter build apk --debug
```

Bản build hiện ký bằng **khoá debug** của Android SDK. Dự án chưa có khoá phát hành.

## Địa chỉ máy chủ

Mặc định trỏ tới máy chủ production trên Azure (`lib/core/config.dart`). Đổi lúc build:

```bash
flutter run --dart-define=API_BASE_URL=https://<may-chu-khac>
```

⚠ Trỏ về máy chủ chạy local qua `http://10.0.2.2:<cổng>` trên máy ảo Android **chưa chạy được**: `android/`
chưa khai báo cho phép HTTP không mã hoá, mà Android chặn HTTP từ API 28 (`targetSdk` = 36).

## Hạn chế đã biết

- **Chưa chạy trên thiết bị Android thật hay máy ảo.** Quét QR bằng camera chưa được kiểm trên phần cứng.
- Gói `mobile_scanner` còn dùng Kotlin Gradle Plugin kiểu cũ; Flutter cảnh báo các bản tương lai sẽ không build được.
- Hai bộ model cho cùng một DTO (`lib/models/models.dart` của nhân viên và `lib/features/audience/models/` của khán
  giả) — không xung đột vì không file nào import cả hai; gộp về một bộ khi cần sửa một trong hai.
