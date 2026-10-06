# Đề nghị của FE dành cho Backend

Phát sinh trong lúc làm lại giao diện (nhánh `ui-warm-light`). **Không việc nào chặn FE** — FE đang dùng phương án tạm nêu bên dưới. Làm khi rảnh.

| # | Đề nghị | Vì sao / FE đang làm gì tạm |
|---|---|---|
| 1 | Gắn `?type=ticket\|donation\|fnb\|subscription` vào `Business:PaymentSuccessUrl`, `PaymentFailedUrl`, `PaymentProcessingUrl` khi redirect sau VNPay | Trang `/payment/*` dùng chung 4 luồng nhưng URL không mang loại giao dịch. Trước đây trang báo "vé của bạn đã được xác nhận" cả khi khách vừa ủng hộ nghệ sĩ hay đăng ký gói dịch vụ (sai). FE đã đổi sang câu chữ đúng với cả bốn; có `type` thì nói đúng luồng và dẫn đúng nơi. |
| 2 | Thêm vào DTO `GET /lounges`: `atmosphereName` (hoặc id) và `hasTour` (bool: có ≥1 scene 360°) | Để thêm bộ lọc "không gian" và huy hiệu "Tham quan 360°" trên thẻ phòng trà mà không gọi `/tour` cho từng phòng. FE đã dùng `upcomingShowCount`, `followerCount`, `primaryImageUrl` (đã có sẵn). |
| 3 | Thêm `seatsLeft` (tổng ghế còn lại, đã trừ ghế đang giữ) vào DTO danh sách/chi tiết buổi diễn | Để làm khối "còn ghế phút chót" bằng số thật. Hiện FE không hiển thị số ghế vì không có dữ liệu — cố ý, để không bịa. |
| 4 | (Chưa gấp) Cho phép khu vực chỗ ngồi lưu đa giác: trường `polygonPoints` dạng mảng `[x,y]` theo % | Backend hiện chỉ lưu hình chữ nhật (`x,y,width,height,rotationDeg`). Công cụ vẽ phác nhận diện được tròn/đa giác nhưng chỉ lưu được khung bao chữ nhật, và báo rõ điều đó cho người dùng. |

## Câu hỏi cũ chưa có trả lời
- Có tài khoản Admin demo trên Azure không?
- VNPay trên Azure là sandbox hay cổng thật? (FE không bấm thanh toán nào khi kiểm thử.)

## Cam kết của FE trong lúc kiểm thử
Không ghi dữ liệu lên Azure, không bật livestream (Mux tính phí). Kiểm chứng dùng API giả lập và nguồn video giả lập cục bộ.
