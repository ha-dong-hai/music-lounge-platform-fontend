# Đặc tả trang chủ — bản chỉ định DƯƠNG TÍNH

> Tài liệu này thay cho danh sách cấm. Lý do nằm ở một phát hiện đo được: **ràng buộc âm tính không
> diệt được AI slop, nó chỉ dời chỗ**. Khi bị cấm màu tím, mô hình chuyển sang emerald green, rồi
> amber-and-cream, rồi monospace body text (nguồn: `reports/Chống AI slop trong Claude Code.md`,
> mục UI). Vì vậy mọi dòng dưới đây nói **phải là gì**, không nói **không được là gì**.
>
> Thứ tự ưu tiên khi hai điều mâu thuẫn: **§1 dữ liệu thật → §2 trạng thái → §3 tiếp cận → §4 cấu
> trúc → §5 thị giác**. Thẩm mỹ là mục cuối cùng, có chủ đích: lập luận "chê AI slop chỉ là chuyện
> gu" bác được mục §5 nhưng bác không nổi §1–§3.

---

## 1. Mọi chữ trên trang phải truy được về một trường dữ liệu thật

Trang chủ được phép hiển thị đúng các trường này, lấy từ `GET /lounge-shows`:

| Trường | Dùng để |
|---|---|
| `name` | tên buổi diễn |
| `scheduledStart` | giờ diễn — **trục chính của trang**, xem §4 |
| `loungeName`, `loungeCity` | nơi diễn |
| `genres[]` | dòng nhạc |
| `coverImageUrl` | ảnh |
| `minPrice` | giá từ |
| `format` | tại chỗ / trực tuyến / kết hợp |
| `isWishlisted` | trạng thái theo dõi của người đang đăng nhập |

**Luật:** thiếu trường nào thì **ẩn dòng đó**. Không có chữ thay thế, không có "đang cập nhật",
không có con số minh hoạ. Một trang trống vì chưa có dữ liệu là trung thực; một trang đầy vì bịa
thì không.

**Điều này giải quyết một cơ chế slop cụ thể đã đo được:** *"the model optimizes for the demo, and
the demo always has data"*. Bản demo luôn có sẵn dữ liệu đẹp, nên thứ bị bỏ quên là lúc **không**
có dữ liệu — và đó chính là §2.

---

## 2. Năm trạng thái là bắt buộc, không phải phần thêm

Mỗi khối lấy dữ liệu phải định nghĩa đủ **năm** trạng thái trước khi được coi là xong:

1. **Đang tải** — khung xương giữ đúng chỗ của nội dung thật, để trang không nhảy khi dữ liệu về.
2. **Trống** — nói rõ *vì sao* trống và *làm gì tiếp*, kèm một lối đi. Không phải một dòng chữ xám.
   **Và trống có HAI cỡ, không phải một** (bổ sung 23/09, có nguồn):
   - **Một KHU VỰC trống trong khi phần còn lại có dữ liệu** → chỉ được dùng **một dòng thông báo**
     cao xấp xỉ phần dữ liệu sẽ chiếm. Shopify Polaris: khối empty state lớn có minh hoạ "intended
     for use when a full page in the admin is empty, **and not for individual elements or areas**".
     ⚠ Câu Polaris này **chưa kiểm được toàn văn** (trang trả 301, chỉ đọc qua tóm tắt tìm kiếm) —
     luật chịu lực là câu của Carbon ngay dưới, Polaris chỉ là tín hiệu củng cố.
     IBM Carbon nói đúng bản chất vấn đề: *"The call to action should remain in the same location
     whether an area is populated or empty"* — luật không phải "cao bao nhiêu px" mà là **đừng để
     bố cục nhảy**, vì đó chính là cái lỗ thủng giữa trang.
   - **Cả TRANG không có gì** → mới được dùng khối lớn canh giữa. Atlassian cho con số bề ngang duy
     nhất có nguồn: bản wide **464px**.
   Nội dung của khối trống phải nêu **phạm vi đang lọc** (NN/g: *"There are no records to display
   for the selected date range"*), và phải nói **điều kiện để hết trống** (Apple WWDC22: *"Save
   episodes you want to listen to later, and they'll show up here"*) — điều kiện đó bắt buộc là một
   cơ chế CÓ THẬT trong hệ thống, không phải lời an ủi.
   Trạng thái trống là **status message** theo WCAG 2.2 SC 4.1.3 (mức AA, liệt kê đích danh "No
   results returned") → `role="status"`, và **không** được cướp tiêu điểm.
3. **Lỗi** — nói người dùng làm được gì (thử lại / đi đường khác), không in mã lỗi kỹ thuật.
4. **Có dữ liệu.**
5. **Có dữ liệu nhưng là TIN XẤU** — hết vé, buổi diễn bị huỷ hoặc dời.

**Luật:** khối nào chưa có đủ năm thì chưa được gắn vào trang chủ.

**Vì sao trạng thái thứ năm tách riêng, và vì sao nó là chỗ cá tính phải im lặng:** đây là lúc người
dùng đang hụt hẫng hoặc bực. Nhân cách hoá phản tác dụng đúng với người đang giận (Crolic et al.,
*Journal of Marketing*); hài hước lệch ngữ cảnh làm giảm cả niềm tin vào hệ thống lẫn vào con người
(Rose & Raff, SIGHCI 2024); và chính Norman viết rằng tình huống căng thẳng cần **bớt** phiền nhiễu
chứ không cần thêm cái đẹp — *"The design should not get in the way"*.

Giọng cho trạng thái này: **trung tính, cụ thể, nói rõ bước tiếp theo, và giữ nguyên mọi thứ người
dùng đã nhập**. Không đùa, không emoji, không xin lỗi dài dòng.

---

## 3. Tiếp cận: neo vào đây trước khi bàn tới đẹp

Đây là phần **không thể tranh luận bằng gu thẩm mỹ**, và là lý do nó đứng trên §5.

- Tương phản chữ/nền ≥ **4.5:1**, đo bằng công thức WCAG trên giá trị token thật, không ước lượng bằng mắt.
- Mọi thứ bấm được phải: thao tác được bằng bàn phím, có vòng focus nhìn thấy, vùng chạm ≥ **44×44px**.
- Ảnh có nội dung phải có `alt` mô tả; ảnh trang trí để `alt=""`.
- Chuyển động: dừng hẳn khi `prefers-reduced-motion`. Không có chuyển động lặp vô hạn thuần trang trí.
- Nội dung tự đổi (băng chuyền, tự làm mới) phải **dừng được**, và dừng khi người dùng rê chuột hoặc đang giữ focus.

Căn cứ: WebAIM Million 2026 — **95,9%** trang chủ có lỗi WCAG, **83,9%** có chữ tương phản thấp, và
đó là lỗi phổ biến nhất trên web. Cùng lúc, khảo sát 1.590 trang cho thấy tell thị giác phổ biến
nhất của UI do AI sinh là **dark theme + chữ xám**. Hai bộ dữ liệu độc lập trỏ về cùng một chỗ.

---

## 4. Cấu trúc: trang chủ là MỘT CHƯƠNG TRÌNH THEO GIỜ, không phải một kho thẻ

Đây là quyết định cấu trúc quan trọng nhất, và nó đến từ chính nghiệp vụ.

Một đêm phòng trà **có giờ**: mở cửa, tiết mục đầu, tiết mục chính, bài cuối. Vì vậy trục tổ chức
của trang chủ là **thời gian**, không phải thể loại.

> **Đã gỡ một khẳng định không nguồn.** Bản đầu của mục này viết "chương trình thật diễn ra
> **21:00–23:30**" như một dữ kiện. Nó không có nguồn; nguồn duy nhất tra được lại nói 20:00–22:30
> và chính nguồn đó là blog SEO độ tin cậy thấp. Vì đây là dữ kiện **chịu lực** của cả cấu trúc
> trang, cách đúng là không chốt khung giờ nào cả: mã nguồn gom theo giờ **có thật trong dữ liệu**,
> nên trang tự đúng với lịch thật dù khung giờ là gì. Muốn một con số để viết vào báo cáo thì lấy
> phân bố `ScheduledStart` từ DB của chính dự án, đừng trích blog.

Trang đọc từ trên xuống như một **tờ chương trình**, và **giữ nguyên một trục từ đầu đến cuối**:

1. **Măng sét** — ngày hôm nay viết đầy đủ, và một câu nói đêm nay thành phố có gì. Không phải một
   tấm ảnh lớn kèm khẩu hiệu.
2. **Chương trình đêm nay** — các buổi diễn **xếp theo giờ**, có mốc giờ chạy dọc bên trái như một
   tờ lịch phát sóng. Đây là khối trung tâm của trang.
3. **Những đêm sắp tới** — **cùng một loại dòng buổi diễn**, nhưng mốc bên trái đổi từ GIỜ sang
   NGÀY. Đây là câu trả lời cho câu hỏi thật của người vừa đọc xong đêm nay: *"đêm nay tôi bận thì
   hôm nào có gì?"*
4. **Khối biên tập** — văn hoá phòng trà Sài Gòn, ảnh không gian thật của một phòng trà. Là điểm
   dừng mắt tối duy nhất giữa các khối nền sáng.
5. **Gợi ý cá nhân** — **chỉ hiện với người đã đăng nhập** (xem §7 và §1).
6. **Mục lục duyệt** — không khí và dòng nhạc gộp vào MỘT mục, vì với người dùng cả hai đều trả lời
   đúng một câu: "tôi muốn tự tìm theo gu của mình".
7. **Cam kết** — ba câu sự thật về cách nền tảng vận hành.
8. **Lối ra** — xem tất cả buổi diễn.

**Một tờ chương trình phải ghi AI DIỄN.** Mỗi dòng buổi diễn in tên người biểu diễn theo đúng thứ
tự lên sân khấu — `LoungeShowListItemDto.PerformerNames`, được backend sắp theo `OrderIndex`. Bản
trước bỏ trường này đi không dùng, tức là in một tờ chương trình không có tên ai.

**Nguồn dữ liệu phải sắp theo THỜI GIAN, không theo thứ tự tạo.** Trang gọi `sortBy='StartingSoon'`.
`'Newest'` ở backend là `OrderByDescending(s => s.Id)` — thứ tự **được tạo** — nên "50 buổi mới
nhất" có thể **không chứa** một buổi diễn tối nay mà phòng trà đã đăng từ tháng trước, và trang sẽ
bỏ sót nó mà không có dấu hiệu gì. Đánh đổi đã biết: `StartingSoon` loại buổi **đã bắt đầu**, nên
một đêm khai mạc 21:00 rời khỏi trang từ 21:01. Thà mất một dòng đã bắt đầu còn hơn giấu mất cả một
đêm diễn.

**Vì sao không phải lưới thẻ:** lưới thẻ là ngôn ngữ của kho nội dung — thứ gì cũng ngang hàng,
thứ gì cũng có thể xem lúc nào cũng được. Một đêm nhạc thì không: **21:00 hôm nay khác 21:00 ngày
mai**, và bỏ lỡ là mất. Cấu trúc theo giờ nói đúng điều đó; lưới thẻ nói sai.

**Khi "đêm nay" trống thì KHÔNG đổ đêm của ngày khác vào chỗ đó.** Material Design: nội dung thay
thế phải "clearly convey in a heading above the results that this content shouldn't be mistaken for
a match to actual query results". Người đang quét theo trục thời gian sẽ đọc nhầm thành "có diễn
tối nay". Cách đúng: dải "đêm nay" chỉ **trỏ xuống** dải "Những đêm sắp tới" — nơi đã có tiêu đề
riêng và có mốc ngày trên từng mục, nên không thể nhầm ngày. Và nó phải **gọi tên đêm gần nhất**
(ví dụ "Đêm gần nhất là Thứ Sáu · 25/09"), vì đó chính là câu hỏi người dùng đang có.

**Và không đổi trục giữa chừng.** Bản trước đi theo trục thời gian được hai khối rồi đột ngột chèn
các băng chuyền ngang "Thể loại X", "Thể loại Y" — tức là quay lại đúng ngôn ngữ kho thẻ vừa bác ở
trên, chỉ là ở nửa dưới nên ít ai soi. Dòng nhạc vẫn có lối vào, nhưng lui về **một hàng mục lục**
ở cuối trang, sau khi trục thời gian đã đi hết.

**Hoà giải một mâu thuẫn trong tài liệu tham khảo:** một nguồn khuyên "cam kết MỘT primitive bố cục
lặp lại", nguồn khác khuyên "phá vỡ tính đồng đều". Cách dùng cả hai: **đồng nhất ở tầng primitive**
(một loại thẻ, một thang khoảng cách, một bộ token) và **khác biệt ở tầng phân cấp** (khối chương
trình trông khác hẳn khối biên tập, vì chúng làm hai việc khác nhau).

---

## 5. Thị giác: chỉ định dương tính

- **Nền**: ngà ấm `--color-page`. Khối nhấn: espresso `--color-espresso`. Nhịp trang xen kẽ sáng/tối
  để mắt có điểm dừng.
- **Chữ hiển thị**: `--font-display` (Playfair Display), dùng cho măng sét, tiêu đề mục, trích dẫn.
- **Chữ chức năng**: `--font-sans` (Plus Jakarta Sans), dùng cho mọi thứ còn lại.
- **Vàng đồng**: `--color-brand` chỉ làm **nền nút chính**; `--color-brand-text` chỉ làm **chữ/icon**.
  Không tô nền lớn.
- **Số liệu và giờ**: `tabular-nums`, để các mốc giờ thẳng cột.
- **Màu**: chỉ dùng token trong `@theme` của `src/index.css`. Đây là luật **cưỡng chế bằng máy** —
  xem §6.

---

## 6. Cưỡng chế bằng máy, không bằng lời dặn

Nghiên cứu kết luận rằng lớp chữ (tài liệu, quy ước, lời dặn) là lớp yếu nhất. Vì vậy hai luật
quan trọng nhất của đặc tả này được dịch thành một **exit code**:

Script `scripts/kiem-token.mjs` báo lỗi khi mã nguồn trong khu trang chủ:
1. dùng màu mặc định của Tailwind (`gray-*`, `red-500`, `blue-*`…) thay cho token;
2. dùng mã màu hex viết thẳng trong `className`.

Chạy: `npm run kiem-token`. Thoát khác 0 là chưa xong.

**Cái máy chứng minh được:** không có màu ngoài hệ token, không có số gây áp lực, không có lỗi cú
pháp, trang dịch được.

**Cái máy KHÔNG chứng minh được** — và danh sách này dài hơn bản đầu tiên của đặc tả thừa nhận:
trang có đẹp không · nhịp có đúng không · chữ có đọc thoải mái không · **người chưa đăng nhập có
hiểu mình phải làm gì không** · **một người 55 tuổi có đọc được cỡ chữ đó dưới ánh đèn phòng trà
không** · **thông báo "hết vé" có làm người ta bực thêm không**. Ba thứ sau cần đúng năm người và
ba buổi chiều — xem §11.

---

## 7. Trạng thái của NGƯỜI, không chỉ của dữ liệu

Bản đầu của đặc tả này định nghĩa bốn trạng thái **dữ liệu** và **không một trạng thái người dùng
nào**. Đó là dấu hiệu rõ nhất rằng nó được viết từ phía hệ thống nhìn ra. Sai lầm cụ thể: §1 cho
phép dùng `isWishlisted` — trường chỉ có nghĩa khi đã đăng nhập — mà không nói trang hiển thị gì
cho khách chưa đăng nhập. Trong khi **mua vé bắt buộc đăng nhập**, nên lời hứa "đêm nay thành phố
có gì" kết thúc ở một bức tường mà đặc tả chưa từng nhắc tới.

Bốn trạng thái người dùng phải được xử lý:

| Trạng thái | Trang chủ phải làm gì |
|---|---|
| **Chưa đăng nhập** | Cho xem **toàn bộ** chương trình, giá, khu vực. Không dựng cổng đăng nhập trước khi người ta kịp xem. Nhưng **nói trước** ở đúng nút hành động rằng bước đặt vé cần tài khoản — nói sớm là tôn trọng, nói lúc bấm mới là bẫy |
| **Đã đăng nhập (Audience)** | Hiện trạng thái theo dõi thật; nút hành động đi thẳng vào luồng đặt vé |
| **Đã có vé cho buổi diễn đang xem** | Không mời mua lại. Đổi sang "Bạn đã có vé" + lối vào xem vé |
| **Phiên hết hạn giữa chừng** | Sau khi đăng nhập lại, quay về **đúng buổi diễn đang xem**, không về trang chủ (đã có cơ chế `state.from`, xem `utils/authRedirect.js`) |

---

## 8. Giá phải nói thật

§1 cho phép hiển thị `minPrice` dạng "giá từ". **"Giá từ" đứng một mình là điểm khởi đầu của drip
pricing** — kiểu giá nhỏ giọt mà Baymard đo được là nguyên nhân bỏ giỏ số một: **40%** bỏ vì chi
phí phát sinh, **12%** vì không thấy tổng tiền từ đầu.

Luật:
- Mọi chỗ hiện giá phải kèm **đã gồm gì** (có kèm nước không, có phí gì không) — hoặc nói thẳng là
  **chưa biết**, nếu dữ liệu không có.
- **Cấm "từ X" đứng một mình** khi không có câu kèm theo.
- Tổng tiền phải xuất hiện từ **bước chọn hạng vé**, không đợi tới bước cuối.

---

## 9. Con số gây áp lực: cấm, và cấm bằng máy

§1 liệt kê các trường **được phép** nhưng không cấm gì. Nghĩa là "còn 3 vé", "sắp hết", đồng hồ
đếm ngược đều không nằm trong danh sách mà cũng **không bị cấm**. Với một trang tổ chức theo giờ,
cám dỗ này là **cấu trúc**, không phải tai nạn.

Đây không phải chuyện gu: khảo sát 11.286 site của Mathur et al. cho thấy **Low-stock Message
(632 lượt) và Countdown Timer (393 lượt) là hai loại dark pattern phổ biến nhất** — đúng hai thứ
mà một sản phẩm bán vé bị cám dỗ nhất. Cơ quan quản lý đã vẽ hộ ranh giới: EU DSA Article 25 cấm
false urgency; CMA phạt Ticketmaster vì giấu hai mức giá khi fan đang xếp hàng.

Luật:
- Bất kỳ con số nào hàm ý khan hiếm phải bằng **tồn kho thật của đúng hạng vé tại đúng thời điểm**.
- Đồng hồ đếm ngược phải trỏ tới một deadline **có thật** và **không được tự đặt lại khi refresh**.
- Không có dữ liệu tồn kho thật thì **không hiện gì**, không ước lượng.

**Cưỡng chế:** `npm run kiem-ap-luc` quét mã nguồn tìm các mẫu chữ khan hiếm giả. Thoát khác 0 là
chưa xong.

---

## 10. Chữ và định dạng tiếng Việt

§5 quy định font và `tabular-nums` nhưng không nói định dạng. Lỗi định dạng theo `en-US` **lọt qua
mọi cổng** vì "nhìn vẫn ra số".

- **Số**: `100.000` (chấm ngăn nghìn), `3,5` (phẩy thập phân) — ngược với tiếng Anh.
- **Ngày**: `dd/mm/yyyy`. **Giờ**: 24h, `20h` hoặc `20:00`.
- **Tiền**: số nguyên đồng, không có đơn vị lẻ.
- **Một ca kiểm bắt buộc trước khi chốt font hiển thị**: gõ một tiêu đề có đủ **dấu chồng**
  (ổ ề ữ ẫ Ỷ Ặ) vào `--font-display` ở **cỡ lớn nhất trang dùng**, rồi nhìn xem dấu có bị cắt cụt
  không. Playfair Display ở cỡ hero là đúng chỗ rủi ro này.

---

## 11. Mốc đo phía người

Đặc tả này định nghĩa "xong" bằng exit code 0 — tức là hoàn toàn theo phía máy. Cần ít nhất một
tiêu chí thành công phía người:

- **Một tác vụ duy nhất**: "từ trang chủ, tìm ra một buổi diễn đêm nay và mở được trang đặt vé".
- **5 người × 3 vòng.** Báo cáo **số đếm tuyệt đối**, không phải phần trăm — Faulkner 2003 cho thấy
  các bộ 5 người dao động từ 55% đến 99% số lỗi tìm được, nên phần trăm từ 5 người là con số giả.
- Ngay sau tác vụ, hỏi **một câu SEQ** (1–7, "việc vừa rồi dễ hay khó"). Trung bình ngành là
  **5,3–5,6/7**; dưới 5 thì phải hỏi tiếp, không được bỏ qua.
