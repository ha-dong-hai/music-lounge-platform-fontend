# Hợp đồng máy trạm sinh poster (Google Flow)

Tài liệu này dành cho người viết **repo máy trạm** — chương trình chạy trên máy cá nhân, mở tab Google
Flow để sinh ảnh rồi nộp về backend MusicLounge. Không phải tài liệu cho frontend.

Mọi con số dưới đây đọc trực tiếp từ mã nguồn backend (`PosterJobsController`, `PosterQueue`,
`PosterWorkerKeyAttribute`, `AiImageProvider`, `UploadImageValidator`) tại commit `b094131`, và đã
được đội backend xác nhận. Nếu một con số ở đây khác với thực tế đang chạy thì mã nguồn đúng, tài
liệu này sai — sửa lại đây.

## Vì sao chiều gọi bị đảo

Google Flow chỉ nhận lệnh phát ra từ một tab trình duyệt đã đăng nhập, nên máy chủ trên Azure không
gọi thẳng nó được. Vì vậy backend **không đẩy việc** cho máy trạm; máy trạm **tự đến xin việc**. Đó
là lý do có ba endpoint riêng và một khoá xác thực riêng.

## Điều kiện tiên quyết trên Azure

Chế độ hàng đợi chỉ bật khi **đủ cả hai** App Setting sau (App Service Linux ánh xạ `__` thành cấp
lồng của section `PosterWorker`):

| App Setting | Giá trị |
|---|---|
| `PosterWorker__Enabled` | `true` |
| `PosterWorker__ApiKey` | khoá tự sinh, đủ dài, giữ kín |

`AiImageProvider.UseDeferredQueue` đòi `Enabled = true` **và** `ApiKey` không trống. Thiếu một trong
hai thì:

- lệnh "tạo poster" của chủ phòng trà **rẽ sang nhà cung cấp gọi thẳng** (Cloudflare / OpenAI) chứ
  không vào hàng đợi, nên máy trạm sẽ không bao giờ thấy đơn nào;
- và máy trạm gọi `claim` nhận **401**.

Backend cố ý tách hai cờ này: bật cờ mà quên khoá thì tính năng phải hỏng to, không được mở toang
ba endpoint không mật khẩu.

> Tính tới 21/09/2026, đội backend kiểm App Settings trên Azure và **chưa đặt khoá nào trong hai
> khoá này** — nghĩa là chế độ hàng đợi đang tắt. Phải đặt trước khi chạy máy trạm.

## Xác thực

Mọi lần gọi gửi header:

```
X-Poster-Worker-Key: <giá trị của PosterWorker__ApiKey>
```

Khoá sai, thiếu, **hoặc chưa cấu hình trên server** → `401`. Trường hợp cuối là cố ý: bỏ qua bước
kiểm khi thiếu cấu hình sẽ biến một lần quên biến môi trường thành ba endpoint công khai. Nên nhận
401 thì kiểm cấu hình server trước, đừng nghi code máy trạm.

## Ba endpoint

Gốc: `POST /api/v1/poster-jobs`

### 1. Xin đơn

```
POST /api/v1/poster-jobs/claim
Content-Type: application/json

{ "workerId": "may-tram-01" }
```

Thân JSON là **bắt buộc** (tham số `[FromBody]` không nhận null) — gửi rỗng sẽ bị `400`.

- `204 No Content` — hàng đợi rỗng. **Đây là câu trả lời thường gặp nhất**, không phải lỗi.
- `200 OK` — nhận được đơn, bọc trong `ApiResponse`:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "showId": 45,
    "prompt": "…",
    "aspectRatio": "3:4",
    "attemptCount": 1
  }
}
```

Đơn **không chứa dữ liệu người dùng** — cố ý, vì máy trạm nằm ngoài hệ thống.

Nhận đơn xong, backend đặt đơn sang `Rendering` và ghi `ClaimedBy = workerId`, thời hạn giữ 10 phút.

### 2. Nộp ảnh

```
POST /api/v1/poster-jobs/{id}/result
Content-Type: multipart/form-data

file      = <nội dung ảnh>          (tên trường phải đúng là "file")
workerId  = may-tram-01
```

Trả `204`. Backend tự gắn ảnh làm poster của buổi diễn, đặt `PosterByAi = true`, và **gửi thông báo
cho chủ phòng trà** — máy trạm không phải làm gì thêm.

### 3. Báo thất bại

```
POST /api/v1/poster-jobs/{id}/fail
Content-Type: application/json

{ "workerId": "may-tram-01", "reason": "Google Flow từ chối lời nhắc: …" }
```

Trả `204`. Dùng khi Google Flow từ chối, hết hạn mức, hoặc mất mạng. **Nên gọi** thay vì im lặng để
hết hạn: gọi `fail` thì chủ phòng trà biết ngay, còn im lặng thì họ chờ hết 10 phút thời hạn giữ.

`reason` được lưu vào `ErrorMessage` của lần thử và **hiện cho chủ phòng trà** ở màn cài đặt buổi
diễn, kèm một dòng giải thích rằng lần thất bại không bị trừ lượt. Câu thông báo đẩy thì dùng lời
chung, không chứa `reason` — nên `reason` cứ viết đúng sự thật kỹ thuật, kể cả bằng tiếng Anh.

## Bốn ràng buộc dễ làm sai

**1. `workerId` phải giống nhau ở cả ba lần gọi.** Cả `result` và `fail` đều kiểm
`job.ClaimedBy != workerId` → lệch là `409`, bài nộp bị bỏ. Backend chặn để hai bài nộp không ghi đè
poster một cách ngẫu nhiên theo thứ tự về đích.

Lưu ý cách backend chuẩn hoá giá trị này: **cắt khoảng trắng hai đầu, rồi cắt còn 60 ký tự**, và
**trống thì thành `"unknown-worker"`**. Hai hệ quả:

- `workerId` dài hơn 60 ký tự vẫn chạy (bị cắt như nhau ở cả ba lần), nhưng hai tên chỉ khác nhau
  từ ký tự thứ 61 trở đi sẽ **thành một** — đừng dùng tên kiểu tiền tố dài + hậu tố phân biệt.
- Gửi trống thì mọi máy trạm đều mang tên `"unknown-worker"` và **tranh được đơn của nhau**. Luôn
  gửi một tên riêng, ngắn.

**2. Thời hạn giữ đơn là 10 phút** (`PosterQueue.Lease`). Quá hạn, đơn về hàng đợi và có thể đã do
máy khác làm; nộp muộn nhận `409`. Một lượt chạy được, chậm nhất đội backend đo được là ≈ 1,5 phút
(49 giây sinh ảnh + 39 giây xuất bản 2K), nên 10 phút là rộng — nhưng đừng để tab Google Flow treo
quá hạn rồi mới nộp.

**3. Giới hạn ảnh 5MB là giới hạn cứng**, đặt ngay trên endpoint bằng
`[RequestSizeLimit(UploadImageValidator.MaxSizeBytes)]`. Đội backend **không nâng ngưỡng** và khuyên
máy trạm tự chuyển JPEG chất lượng ~90 trước khi nộp: poster là ảnh để hiển thị, JPEG q90 nhìn không
khác PNG 2K mà nhẹ hơn nhiều lần.

Ảnh được kiểm bằng **chữ ký file**, không tin phần mở rộng. Định dạng nhận: PNG, JPEG, WebP, GIF.

**Máy trạm nên kiểm kích thước TRƯỚC khi gọi `result`**, và nếu vẫn quá thì hạ chất lượng rồi thử
lại — đừng nộp để nhận lỗi. Nộp quá cỡ là mất trắng một lượt hạn mức Google, mà chủ phòng trà chờ
đủ 10 phút mới biết.

**4. Khổ ảnh là hằng `"3:4"`** trong `PosterQueue.AspectRatio`, không cấu hình được. Google Flow hỗ
trợ 1:1, 3:4, 4:3, 9:16, 16:9; 3:4 là khổ dọc gần nhất cho poster. Đơn vẫn mang `aspectRatio` trong
thân trả về — **đọc từ đơn**, đừng ghi cứng trong máy trạm.

## Nhịp gọi khi rỗng

Đội backend: **5 giây là thoải mái, 10 giây cũng được.**

Con số để tự cân: không có giới hạn riêng cho `/poster-jobs/claim`, nhưng có bộ giới hạn chung
**100 request/phút/địa chỉ IP**, cửa sổ cố định, không xếp hàng (`QueueLimit = 0`) → vượt là `429`
ngay lập tức.

- 5 giây = 12 lần/phút = 12% hạn mức. An toàn với **một** máy trạm.
- Hạn mức tính **theo IP**, nên nếu máy trạm chạy cùng IP với trình duyệt của chủ dự án thì hai bên
  **cộng dồn**. Nhiều máy trạm sau cùng một NAT thì phải giãn ra.

Cách gọn hơn (không bắt buộc): 5 giây khi vừa có đơn, giãn dần lên 30 giây sau một chuỗi `204` liên
tiếp.

## Các mốc khác của hàng đợi

| Mốc | Giá trị | Ý nghĩa với máy trạm |
|---|---|---|
| `PosterQueue.Lease` | 10 phút | thời hạn giữ một đơn |
| `PosterQueue.QueueTimeout` | 6 tiếng | đơn không ai nhận thì thành `Expired` và chủ phòng trà được báo |
| `PosterQueue.MaxAttempts` | 3 | giao lại tối đa 3 lần rồi bỏ cuộc |

Sáu tiếng là con số cố ý: máy trạm chỉ bật khi có người ngồi làm việc, nên đơn đặt buổi tối phải sống
được qua đêm tới sáng hôm sau.

## Hạn mức không phải việc của máy trạm

Hai loại hạn mức đều do backend đếm, máy trạm không cần biết:

- **hạn mức tháng theo gói** — đếm các lần `Succeeded`, `Queued`, `Rendering` (đơn đang chờ giữ chỗ);
  lần `Failed`/`Expired` **không tính**, tức là tự trả lại lượt;
- **giới hạn số lần mỗi buổi diễn** (`ai_poster_max_attempts_per_show`, mặc định 5) — chỉ đếm lần
  `Succeeded`.

Nên gọi `fail` trung thực không làm chủ phòng trà mất lượt. Không có lý do gì để máy trạm im lặng.
