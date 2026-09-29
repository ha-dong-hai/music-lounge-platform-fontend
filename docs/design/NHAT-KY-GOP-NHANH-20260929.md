# Nhật ký gộp nhánh — 29/09/2026

**Việc:** gộp `ui-warm-light` vào nhánh mới `ui-redesign-20260929`, tạo từ `origin/frontend-only` @ `d8151fb`.
**Vì sao:** hai nhánh tách nhau từ 20/09 (`d9ac250`) và thành **hai giao diện song song** — 61 commit chỉ có ở
`ui-warm-light`, 34 commit chỉ có ở `frontend-only` (của huyphuc306), **81 file bị hai bên cùng sửa**. Thiết kế
lại toàn bộ web trên một bên mà không hoà hai bên thì chỉ kéo dài sự chia đôi.
**Ai quyết:** chủ dự án chốt 29/09 — (1) nền là `frontend-only`, gộp `ui-warm-light` vào; (2) xung đột thì
**đo từng file, bên nào đủ chức năng hơn thì giữ**; (3) chỉ ở máy, chủ dự án duyệt rồi mới đẩy.

Quy ước trong file này: **phúc** = `frontend-only` · **warm** = `ui-warm-light`.

---

## 1. Tổng quan con số

| Bước | Số file | Cách xử |
|---|---|---|
| Git tự gộp được | 71 | không cần làm gì |
| Xung đột "hai bên cùng tạo file" (AA) — **chép rồi sửa** | 32 | dựng lại tổ tiên chung, gộp ba chiều (§2) |
| Xung đột AA — **hai bản viết độc lập** | 5 | chọn nguyên file theo quy tắc đo (§3) |
| Xung đột "hai bên cùng sửa" (UU) | 31 | chọn bên cho chỗ vướng theo quy tắc đo; phần git tự gộp của cả hai bên vẫn giữ (§3) |
| `package-lock.json` | 1 | không gộp tay — sinh lại bằng `npm install` |

## 2. Gộp ba chiều bằng tổ tiên dựng lại

37 file bị git báo "cả hai bên cùng tạo" (AA). Đo lại thì phần lớn **không phải hai bản độc lập**: bản đầu
tiên phúc commit gần như trùng một commit cụ thể của warm (lệch 2–26 dòng) — tức phúc **chép từ warm rồi sửa**.
Git không thấy tổ tiên chung đó vì file được chép tay chứ không đi qua `git merge`.

Dùng chính commit warm gần nhất làm tổ tiên rồi `git merge-file` ba chiều: **27/32 file gộp sạch**, giữ được
**cả phần phúc sửa sau khi chép lẫn phần warm sửa sau đó**, không phải chọn bỏ bên nào. 5 file còn đúng một
chỗ vướng — cả 5 đều là warm có thêm hàm mà phúc chưa có (luồng donate hai chặng, quản lý thực đơn, đăng ký
thiết bị nhận thông báo, thống kê nâng cao) hoặc có dòng `import { useState, useEffect }` mà logic trang kết
quả thanh toán cần.

## 3. Quyết định từng file — theo quy tắc "đủ chức năng hơn thì giữ"

Đo bằng máy trên **toàn bộ file** hai bên: số lời gọi API thật, đủ ba trạng thái (đang tải / lỗi / trống),
số lớp màu mặc định Tailwind (càng ít càng đúng hệ token), số thuộc tính tiếp cận. Số dòng chỉ để tham khảo.

**Lưu ý đã sửa trong lúc đo:** bộ đếm API ban đầu đếm cả hàm nội bộ (`fetchAccounts`, `fetchCounts`…) như lời
gọi máy chủ, làm phúc có vẻ "gọi nhiều API hơn". Đếm lại **theo tên lời gọi thật** thì phần lớn là hoà.

### Giữ bản phúc

| File | Lý do |
|---|---|
| `AdminKycReviewsPage` | Cùng API, cùng đủ ba trạng thái; bản phúc **0** màu mặc định (warm 18) |
| `AdminLedgerPage` | Bản phúc có trạng thái đang tải (warm thiếu); **0** màu mặc định (warm 3) |
| `AdminPenaltyAppealsPage` | Cùng chức năng; bản phúc **0** màu mặc định (warm 14) |
| `AdminDashboard` + `DashboardCharts` | Commit `f22890c` hôm nay của phúc thay dữ liệu giả bằng dữ liệu thật và ghi rõ *"giữ các tính năng hay của bản mới"* — tức phúc đã tự tổng hợp cả hai bên. Hai file phải đi cùng một bên vì trang import component từ file kia. **Khoảng trống:** bản phúc thiếu trạng thái trống → việc bổ sung |
| `EventDetailPage` | Cùng bộ API; **cả hai** đã chặn sập trang khi buổi diễn chưa có hạng vé; bản phúc hơn một trạng thái trống |
| `package.json` | `three ^0.186.1` mới hơn `^0.186.0` |

### Giữ bản warm

| File | Lý do |
|---|---|
| `HomePage` | Có bản sửa lỗi thật `sortBy: 'Newest' → 'StartingSoon'` (6 chỗ; phúc 0). `Newest` ở backend là `OrderByDescending(s => s.Id)` — thứ tự **được tạo**, không phải lịch diễn, nên trang chủ có thể bỏ sót buổi diễn tối nay. Lời gọi `getTrendingShows` phúc có thêm là lời gọi warm **cố ý bỏ** vì không ai dùng kết quả |
| `AdminVenuesPage`, `VenuesTable` | Có `VenueDossierModal` — bản sửa nút "Xem" dẫn sai sang trang giới thiệu phòng trà, lỗi chủ dự án đã báo. Phúc 0 chỗ |
| `ShowMap` | Có `ghiNhoThanhToan` — bản sửa trang kết quả thanh toán nói sai luồng (gia hạn gói mà báo "vé của bạn"). **Phúc thiếu** |
| `ShowIntro` | Bấm người biểu diễn: bản phúc dẫn về `/` (chỗ giữ tạm); bản warm dẫn đúng tới `/performers/{id}` |
| `MainLayout` | Bản phúc có `flex-col` nhưng **thiếu `flex`** nên `flex-col` không có tác dụng |
| `TicketsTab` | Màu nhãn khớp bộ token đang giữ (xem §5 mục 1) |
| `AdminBankAccountsPage` | Cùng số lời gọi thật; bản warm đủ ba trạng thái (phúc thiếu trạng thái trống) |
| `AdminShowDetailPage` | Bản warm đủ ba trạng thái; 0 màu mặc định (phúc 9) |
| `PendingModerationTab` | Bản warm gọi 4 API (phúc 2); ít màu mặc định hơn (24 so với 39) |
| `ModerationModal`, `ShowCard`, `AdminComplaintPage`, `AdminLayout` | Ít màu mặc định hơn; chức năng như nhau |
| `HeroBanner` | Gấp đôi thuộc tính tiếp cận (13 so với 7) |
| `ShowListPage` | Có các bản sửa `9fee577`: không kẹt ở màn lỗi, nút yêu thích hiện trên màn cảm ứng, thẻ có tên phòng trà |
| Services, `useAuth`, `useAuthStore`, `authSchema`, `format`, `Header` | Bản phúc là **bản chép từ warm rồi cắt bớt chú thích**; bản warm giữ đủ và có thêm hàm. Phép kiểm bao phủ export (§4) bảo đảm không hàm nào của phúc bị rơi |

### Gộp hợp hai bên

| File | Cách |
|---|---|
| `AppRouter.jsx` | Gộp hợp danh sách import và các route công khai; kết quả **58 route** — đủ mọi route của hai bên trừ `/rating` (§4) |
| `index.css` | Giữ bộ token của warm, thêm `--color-danger-soft` mà phúc có. Token này **suy từ token sẵn có** (`color-mix` từ `--color-danger`) thay vì bịa mã màu, để đúng trên cả nền sáng lẫn nền tối |

## 4. Những gì bị bỏ — mỗi chỗ đều có lý do

Phép kiểm bao phủ đòi **mọi tên export và mọi route ở một trong hai bên đều phải còn trong kết quả**; chỗ nào
thiếu mà không có lý do thì không cho stage.

| Bỏ | Lý do |
|---|---|
| `GenreDemandChart`, `RevenueShareBar` | Component của bản `AdminDashboard` phía warm — bản đó không được chọn. Không còn ai import |
| `getDistricts` (phúc) | Gọi `/lounge-shows/filter-options/districts` — backend chỉ có `filter-options` (`LoungeShowsController.cs:191`), **không có route con `/districts`**, sẽ nhận 404. Không có mã nào gọi hàm này |
| Route `/rating` | Warm **cố ý gỡ** ở commit `e767cd6` (21/09). `RatingModal` vẫn dùng đúng dạng hộp thoại trong `EventDetailPage` và `LivestreamWatchPage`; không có liên kết nào tới `/rating` |

**Trả lại:** `reviewBankAccount` của phúc — không còn ai gọi nhưng là hàm của đồng đội đang đẩy code mỗi ngày.
Nó gọi **cùng endpoint** với `reviewPayoutBankAccount`, nên được giữ dưới dạng **bí danh** gọi qua hàm kia: PR
của phúc không vỡ mà vẫn chỉ có một chỗ định nghĩa lời gọi.

## 5. Lớp lỗi đã bắt được — gộp sạch về dòng không có nghĩa là sạch về ngữ nghĩa

Phúc thêm một hàm ở vùng git tự gộp được, warm thêm **cùng hàm đó** ở vùng xung đột → giải xong thì có **hai
lần `export const` trùng tên**, lỗi cú pháp. Máy bắt được **ba lần**, đều trước khi tới bước dựng:

| File | Trùng | Xử |
|---|---|---|
| `analyticsServices.js` | `getAdminContentOverview`, `getAudienceEngagement` | Hai bản giống hệt → giữ bản có chú thích |
| `penaltyServices.js` | `getPenaltyAppeals` | Giống hệt → giữ bản có chú thích |
| `adminServices.js` | `getAdminVenues` (giống hệt) · `create/update/deleteFilterOption` (**khác chức năng**) | Nơi gọi duy nhất là `OptionTypeTab.jsx` — file chỉ warm sửa — gọi theo chữ ký `(typeKey, data)` đi qua bảng cấu hình `filterOptionType`. Giữ bản đó; bản thô sẽ gửi sai body lên server mà build vẫn xanh |

## 6. ⚠ Cần chủ dự án và phúc biết

1. **`frontend-only` đã đổi cả web về nền ĐEN.** `index.css` của phúc giữ nguyên *tên* token nhưng đảo *giá
   trị*: `--color-page: #000000 /* đen như bản cũ */`, `--color-ink: #FFFFFF`. Đây là **quyết định thiết kế**,
   không phải xung đột mã. Bản gộp tạm giữ bộ sáng cho khớp phần lớn component. Vì chủ dự án đã chốt thay toàn
   bộ thế giới thị giác ở bước sau, giá trị nào cũng sẽ bị thay — **nhưng cần nói với phúc**, kẻo sau lần thiết
   kế lại lại có một lần đổi về đen.
2. **`getDistricts` gọi vào endpoint không có** trong backend này. Có thể phúc đang chờ backend làm endpoint đó.
3. Bản CSS của phúc dùng `var(--ease-out-soft)` nhưng **không định nghĩa biến đó** — hiệu ứng âm thầm rơi về
   nhịp mặc định. Bản gộp có định nghĩa.
4. `AdminDashboard` (bản phúc) **thiếu trạng thái trống** — cần bổ sung.

5. **`complaintServices.js` trên `frontend-only` đang có lỗi thật ngay lúc này**: file dùng `axiosClient` 4
   lần nhưng **không có dòng import**. Build vẫn xanh vì trong JavaScript biến chưa khai báo chỉ nổ lúc
   *chạy* — nên web lên được bình thường và chỉ vỡ đúng lúc khách bấm **gửi khiếu nại** (luồng bảo vệ người
   mua). Bản gộp đã thêm lại import; **nhánh `frontend-only` của đội vẫn còn lỗi này** cho tới khi bản gộp
   được đưa lên hoặc phúc tự sửa.
6. **`AdminShowDetailPage` bản phúc hứa một chức năng không tồn tại**: `replayCondition: "Được xem lại trong
   vòng 48h sau sự kiện đối với vé VIP"`. Hệ thống **không có** xem lại livestream (quyết định đã chốt). Bản
   đó còn hiện thông điệp tiếng Anh ("Show not found", "Content approved!"). Bản gộp dùng bản warm.

---

## 7. Chỗ phương pháp gộp của tôi có lỗ hổng — và cách đã vá

Ghi lại để người soát biết chỗ nào đáng nghi. Mọi lỗ hổng dưới đây đều bị **bắt trước khi commit**.

**Lỗ hổng 1 — tổ tiên dựng lại biến "không chép" thành "cố ý xoá".** Khi lấy một commit của warm làm tổ tiên
chung, những hàm phúc **chưa từng chép sang** bị git hiểu là phúc **xoá**, và phép gộp ba chiều đã thực hiện
lệnh xoá không ai ra đó. Phép kiểm bao phủ đầu tiên chỉ quét file *còn xung đột lúc nó chạy* nên bỏ lọt cả
32 file này. Bản dựng bắt được 5 hàm (đang được import); phép kiểm mở rộng ra **mọi file hai nhánh đã chạm**
tìm ra **9 hàm** — 4 hàm dư ra là loại bản dựng không bao giờ thấy: `resolveComplaint`, `issuePenalty`,
`submitPenaltyAppeal`, `getShowPerformance`. Cả 9 đã khôi phục nguyên khối từ warm.

**Lỗ hổng 2 — chọn bên theo từng chỗ vướng sinh ra file lai.** Chọn một bên cho các chỗ vướng, nhưng thay
đổi của bên kia ở vùng git tự gộp vẫn lọt vào, nên có file thành con lai khâu từ hai thiết kế:

| File | Vết khâu | Cách bắt |
|---|---|---|
| `AdminVenuesPage` | Hàm `useEffect` bị cắt đôi (mở theo kiểu này, đóng theo kiểu kia) · dùng `useMemo` mà không import · `filteredVenues` tính xong không hiển thị | build · lint `no-undef` · lint `no-unused-vars` |
| `PendingModerationTab` | Dòng dùng `FormatBadge` của phúc sống sót, dòng import thì không → **trang duyệt buổi diễn sập** | lint `no-undef` |
| `AdminShowDetailPage` | Import `getPendingModerations` mà không gọi → mất một lượt tải | lint `no-unused-vars` |

`AdminVenuesPage` và `AdminShowDetailPage` được **lấy nguyên bản warm** (bên đã chọn) thay vì vá từng mũi.
Mất theo: tính năng **làm mới thẻ thống kê sau khi duyệt** của phúc ở `AdminVenuesPage` → việc bổ sung.

**Lỗ hổng 3 — tôi từng tuyên bố sai "lần gộp không đẻ thêm lỗi lint nào".** Bộ phân loại chỉ xét *dòng dùng*
biến, thấy dòng đó có ở nhánh cha thì xếp "có sẵn" — bỏ qua việc nhánh cha có cả *dòng khai báo*. Hai lỗi
`no-undef` ở trên là do gộp sinh ra mà bị xếp nhầm. Phân loại lại đúng thì còn thêm các cờ `no-unused-vars`
phải soát tay; phần lớn là báo động giả của chính bộ đo (tên `err`/`e` trong `catch` xuất hiện nhiều lần vì
mỗi khối catch khai báo lại), đã soát từng cái.

**Lỗ hổng 4 — cổng kiểm máy sai trên file CRLF.** Máy bật `core.autocrlf`, file git checkout ra có `\r\n`.
Regex bóc chú thích `/\/\/.*$/` trượt khi cuối dòng còn `\r` (dấu `.` của JS không khớp `\r`), nên cổng đọc
chú thích như mã. `kiem-ap-luc` báo **4 vi phạm giả** — cả 4 nằm trong chú thích giải thích *vì sao cấm*;
`kiem-gsap` đếm dư 2 dòng. Sửa ở gốc: mọi cổng đọc file qua `scripts/lib/docTep.mjs` (chuẩn hoá về LF ngay
khi đọc). Chứng minh bằng đột biến **trên chính file CRLF**: chú thích chứa câu cấm → xanh; vi phạm thật trong
JSX, màu mặc định, gọi thẳng `.format()` → đều đỏ.

## 8. Kiểm chứng lúc commit

| Phép kiểm | Kết quả |
|---|---|
| Bao phủ export — mọi tên ở một trong hai nhánh còn trong kết quả, trên **209 file** hai nhánh đã chạm | **0 mất** ngoài 3 chỗ có lý do ở §4 |
| Trùng tên export / import, 212 file | **0** |
| Dấu xung đột còn sót | **0** |
| `vite build` | **exit 0** |
| Lint `no-undef` (biến chưa khai báo — loại lỗi chỉ nổ lúc chạy) | **0** |
| `kiem-token` · `kiem-ap-luc` · `kiem-ngay` · `kiem-component` | **cả 4 xanh** |
| `kiem-gsap` | đỏ — **cố ý**, là định nghĩa hoàn thành của việc chuyển sang framer-motion |
| 7 bộ kiểm `src/utils/*.test.mjs` | **cả 7 qua** |

**Lúc commit gộp (132e233) chưa mở trang nào trong trình duyệt** — build xanh và lint sạch không chứng minh
trang hiển thị được; ba lỗi sập trang ở §7 chỉ bị bắt nhờ lint `no-undef`. Còn 40 lỗi lint khác, đều có sẵn
từ một trong hai nhánh cha. Việc kiểm lúc chạy làm ở mục dưới.

## 9. Kiểm lúc chạy (30/09) — mở thật từng địa chỉ, 5 vai

**Môi trường — không chạm Azure:** backend dựng từ `origin/master` 413dcc8 trong worktree riêng, database
riêng trên SQL Express của máy (`SU26SE039_FE_KIEM`, migrate mới), mọi khoá bí mật để trống (Email.Host rỗng
→ OTP chỉ in ra log, không gửi mail). Dữ liệu dựng bằng chính API (đăng ký + OTP, tạo 2 phòng trà, Admin
duyệt 1, gán nhân viên) + `DemoDataScript.Seed` (12 buổi diễn, 12 khán giả). Web chạy vite với cấu hình tạm
trỏ `/api`, `/uploads`, `/hubs` về máy. Bộ quét **huỷ mọi request tới `*.azurewebsites.net`** và đếm: 0.

**Kết quả:** 96 lượt (khách 28 · khán giả 10 · chủ 20 · nhân viên 20 · Admin 18), đăng nhập qua giao diện đủ
4 vai, **0 trang sập**. Bộ quét được chứng minh bắt được lỗi: chèn một biến chưa khai báo vào
ForgotPasswordPage → báo SẬP, trang đối chứng /login vẫn xanh; file khôi phục, cmp khớp.

**Lỗi thật tìm được — có sẵn ở nhánh cha, không do gộp:**
1. **Nhân viên không bán được vé tại quầy trên web (ĐÃ SỬA).** Trang Vận hành lấy danh sách buổi diễn từ
   `/lounge-shows/mine` (RequireOwner → nhân viên 403, trang hiện "chưa có buổi diễn" dù có), và lấy giá để
   bán từ `ticket-stats` (có doanh thu, chỉ chủ/Admin → 403, "chưa có hạng vé nào để bán"). Sửa: danh sách
   theo `?mine=true` (OperatedShows, MLACP-466 — như OwnerLivestreamsPage), giá từ `/ticket-tiers` lọc đúng
   hai điều kiện của SellWalkInTicketCommandHandler (hạng Physical, đợt giá không chỉ-Online). **Kiểm đầu-cuối:**
   nhân viên đăng nhập, bán 1 vé thật trên DB kiểm → toast "Đã bán 1 vé tại quầy.", chỗ còn 80 → 79, 0 lỗi API.
2. **Khách chưa đăng nhập mở được /account, /notifications, /my-shows/ticket/:id (ĐÃ SỬA)** → form rỗng +
   toast lỗi (API 401). Sửa: bọc `ProtectedRoute` ở router → sang /login kèm `state.from`. Kiểm hai chiều:
   khách bị chuyển, khán giả đã đăng nhập vẫn vào đủ, 0 lỗi.
3. **`useLivestreamHub.js` ghi cứng địa chỉ hub Azure (ĐÃ SỬA)**, bỏ qua `VITE_API_BASE_URL` — chạy ở máy
   vẫn nối production. Nay lấy cùng máy chủ với axios (`new URL('/hubs/livestream', baseURL)`); mặc định vẫn
   ra đúng địa chỉ Azure cũ khi không đặt biến môi trường.

**Việc của backend (không tự sửa — cần chủ dự án mở task):** route `GET /lounge-shows/mine` vẫn gắn
`RequireOwner` trong khi handler của nó đã được MLACP-466 làm cho hiểu vai nhân viên → nửa sửa đó không bao
giờ tới được nhân viên; 4 test của MLACP-466 không phủ tầng quyền của route này.

**Chưa kiểm:** trang nghệ sĩ có dữ liệu thật (DB kiểm chưa có nghệ sĩ — trang báo "Không tìm thấy" đúng); các
luồng có thanh toán VNPay (không có khoá sandbox trên máy); giao diện điện thoại; mọi thao tác ghi khác ngoài
bán vé tại quầy.
