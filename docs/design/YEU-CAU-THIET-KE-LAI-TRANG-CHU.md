# Yêu cầu thiết kế lại trang chủ — bản khai triển đầy đủ

**Trạng thái:** §15 đã chốt 23/09 — sẵn sàng thi công theo thứ tự §16.
**Ngày:** 23/09/2026 · **Người viết:** tab FE · **Thay thế:** không thay thế tài liệu nào; đây là
tầng *yêu cầu* nằm trên `DAC-TA-TRANG-CHU.md` (tầng *đặc tả*).

## 0. Đọc file này thế nào

Yêu cầu gốc của chủ dự án là một câu: *"thiết kế lại một lần nữa trang chủ, các component lấy từ
các thư viện có sẵn"*, kèm lời dặn rằng đó mới là ý tưởng ban đầu và cần được khai triển cho đủ
trước khi áp dụng. File này là bản khai triển đó.

Mỗi khẳng định trong file được gắn một trong ba nhãn:

| Nhãn | Nghĩa |
|---|---|
| **[ĐO]** | Đã đo trên chính dự án này bằng một lệnh cụ thể. Có thể chạy lại. |
| **[NGUỒN]** | Có nguồn ngoài đã đọc được toàn văn, dẫn trong ba báo cáo nghiên cứu. |
| **[QUYẾT]** | Quyết định thiết kế. Không phải sự thật, là lựa chọn — và lựa chọn thì đảo được. |

Không dùng nhãn nào nghĩa là câu đó đang nói quá. Nếu bạn thấy một câu như vậy, đó là lỗi của file.

---

## 1. Việc phải làm, viết bằng một câu

Đổi **đơn vị tổ chức** của trang chủ từ *buổi diễn* sang *phòng trà*, dựng lại toàn bộ bằng
component lấy từ thư viện thật (shadcn/ui trên nền Radix, cộng react-bits), chuyển tầng chuyển động
sang framer-motion, và đóng ba khoản nợ mà hai lần trước chưa đóng.

**[CHỦ DỰ ÁN CHỐT 23/09] Lật lại cả kiến trúc thông tin.** Bản thảo đầu của file này đề xuất giữ
trục thời gian; chủ dự án chọn làm mới hoàn toàn. Ghi lại nguyên văn mối lo tôi đã nêu trước khi
chốt, để sau này đọc lại còn biết cái giá: **trục thời gian là kết luận của ba báo cáo độc lập, nên
bỏ nó là chủ động bỏ bằng chứng đã thu được.**

Nhưng quyết định đã ban hành, và nó có một lý do mạnh mà chính tôi bỏ sót khi viết bản thảo đầu —
xem §7.0. Bảy nguyên tắc bất biến ở §3 **vẫn giữ nguyên**: chúng đúng với mọi kiến trúc, vì chúng
nói về tính trung thực chứ không nói về cách sắp xếp.

---

## 2. Vì sao phải làm lần nữa — ba khoản nợ thật

Không phải vì trang xấu. Vì ba thứ cụ thể chưa xong:

**Nợ 1 — Tầng component là hàng tự may, không phải hàng thư viện.**
[ĐO] Cả trang chủ hiện dựng bằng thẻ HTML thô cộng lớp Tailwind viết tay. Thư mục
`src/components/reactbits/` chỉ có **3 file**, trong đó `MotionGuard.jsx` là đồ tự viết chứ không
phải của thư viện. Hiệu ứng hiện dần khi cuộn dùng `Reveal.jsx` — cũng tự viết. Đây chính là điều
chủ dự án chỉ ra.

**Nợ 2 — Một thư viện đã cài mà không ai dùng.**
[ĐO] `framer-motion@12.40.0` nằm trong `dependencies`, nhưng `grep -rln "framer-motion" src` trả về
**0 file**. Đang trả giá tải trang cho một thư viện không dùng.

**Nợ 3 — Không có tầng component có khả năng tiếp cận.**
[ĐO] Không có shadcn/ui, không có Radix, không có Headless UI. Hộp thoại (`ConfirmModal`) và ô chọn
(`SearchableDropdown`) đều tự viết tay. Với hộp thoại thì bẫy tiêu điểm, khôi phục tiêu điểm khi
đóng, và phím Escape là những thứ rất dễ làm thiếu mà không ai phát hiện.

---

## 3. Bảy nguyên tắc bất biến — thiết kế lại cũng không được phá

Đây là phần **không thương lượng**, vì mỗi dòng đều đổi bằng một đợt nghiên cứu hoặc một lần sai
thật đã trả giá.

1. **Mọi chữ truy được về một trường dữ liệu thật.** Không có số minh hoạ, không có tên bịa, không
   có "3.000+ khán giả" khi không đếm được. [NGUỒN]

2. **Năm trạng thái là bắt buộc cho mọi khối:** đang tải · trống · lỗi · có dữ liệu · có dữ liệu
   nhưng là tin xấu. Khối nào thiếu một trạng thái là khối chưa xong. [NGUỒN]

3. **Trống có HAI cỡ.** Một *khu vực* trống trong khi trang còn dữ liệu khác → một dòng thông báo.
   *Cả trang* trống → mới được dùng khối lớn. Luật chịu lực là câu của IBM Carbon: nút hành động
   phải ở nguyên một chỗ dù khu vực có dữ liệu hay không — vấn đề không phải "cao bao nhiêu px" mà
   là **đừng để bố cục nhảy**. [NGUỒN]

4. **Không có con số gây áp lực giả.** Cấm "còn N vé", "sắp hết", đồng hồ đếm ngược, "N người đang
   xem". Có cổng máy chặn, đã chứng minh bắt được 8 dạng. [NGUỒN + ĐO]

5. **Giá không bao giờ đứng một mình.** "Từ 350.000đ" phải kèm dòng nói rõ giá đó gồm gì và chưa
   gồm gì. [NGUỒN]

6. **Trang phải biết người đang mở nó là ai.** Chưa đăng nhập thì nói trước rằng đặt vé cần đăng
   nhập — nói ở ngay nút, trước khi bấm, không để họ đâm vào tường. [NGUỒN]

7. **Chỉ dùng màu trong bộ token của `src/index.css`.** Có cổng máy chặn. [ĐO]

---

## 4. Phạm vi

**Trong phạm vi:** `src/pages/home/HomePage.jsx` và toàn bộ `src/components/home/`; các component
dùng chung mà trang chủ chạm tới (`Reveal`, `SectionTitle`, `Skeleton`, `CoverFallback`); tài liệu
thiết kế; các cổng kiểm.

**Ngoài phạm vi lần này, nhưng phải ghi tên ra để không ai tưởng đã xong:**
- `FilterModal.jsx` — hộp thoại tự viết, có sẵn một lỗi lint `react-hooks/set-state-in-effect` ở
  dòng 40 [ĐO]. Nó nằm trên trang chủ nhưng sửa nó là sửa tầng hộp thoại toàn hệ thống.
- ~550 chỗ dùng màu mặc định Tailwind ở khu Admin/Owner [ĐO ước lượng từ lần quét trước].
- Ba đề nghị gửi backend chưa gửi, xem `DE-NGHI-CHO-BACKEND.md`.

---

## 5. Kiểm kê thư viện — cái gì THẬT SỰ có

[ĐO] từ `package.json` ngày 23/09/2026:

| Nhóm | Có gì | Dùng được cho trang chủ không |
|---|---|---|
| Nền | React 19.2 · Vite 8 · Tailwind 4.3 (`@theme`) · JavaScript (không TypeScript) | — |
| Chuyển động | `gsap@3.15` + `@gsap/react@2.1` · `framer-motion@12.40` | gsap: **đang dùng** (bên trong 2 file react-bits). framer-motion: **cài mà không dùng** |
| Biểu tượng | `lucide-react@1.21` | Đang dùng khắp nơi |
| Biểu đồ | `recharts@3.8` | Không cần ở trang chủ |
| Canvas / 3D | `konva` · `react-konva` · `three` | Sơ đồ chỗ ngồi và ảnh 360 — không phải trang chủ |
| Biểu mẫu | `react-hook-form` + `zod` + `@hookform/resolvers` | Không cần ở trang chủ |
| Khác | `react-hot-toast` · `react-qr-code` · `react-dropzone` · `emoji-picker-react` · `hls.js` · `dayjs` · `zustand` · `axios` | `dayjs`, `zustand`, `axios` đang dùng |
| **Component UI** | **KHÔNG CÓ shadcn/ui, Radix, Headless UI, Base UI, MUI, Mantine, Chakra** | Đây là khoảng trống thật |

### react-bits — thư viện component thật sự khả dụng

[NGUỒN] Xác minh từ `README.md` của kho mã nguồn và `sitemap.xml` của trang chính thức:

- Giấy phép: nguyên văn **"MIT + Commons Clause — free for personal and commercial use"**.
- Hơn 200 component, chia sáu nhóm: Text Animations · Animations · Components · Micro · Backgrounds.
- Mỗi component có **4 biến thể**: JS-CSS · JS-TW · TS-CSS · TS-TW. Dự án này là JavaScript +
  Tailwind → **luôn lấy biến thể JS-TW**.
- Ba cách cài: CLI qua `shadcn`/`jsrepo`, chép tay, hoặc chép từ trang component.
- **[QUYẾT] Lấy về bằng CLI của shadcn** (`npx shadcn@latest add @react-bits/<Ten>-JS-TW`), rồi
  **sửa tại chỗ cho khớp bộ token**. Bản thảo đầu của file này chọn chép tay để khỏi thêm CLI; sau
  khi chủ dự án chốt dùng shadcn/ui thì CLI đó có sẵn rồi, nên chép tay không còn là cái rẻ hơn.
  Dù lấy bằng cách nào thì component vẫn **nằm trong repo và thuộc quyền sửa của mình** — bắt buộc,
  vì cổng `kiem-token` cấm màu ngoài token.
- **[ĐO] CẢNH BÁO: react-bits KHÔNG tự xử lý `prefers-reduced-motion`.** Đó là lý do repo phải có
  `MotionGuard.jsx` tự viết bọc ngoài (xem chú thích `SectionTitle.jsx:37`). Mọi component react-bits
  lấy về sau này đều phải kiểm lại điểm này, không được cho là thư viện đã lo.
- **[QUYẾT] Mỗi file chép về phải mở đầu bằng khối chú thích ghi: tên component, URL gốc, biến thể
  (JS-TW), ngày chép, và những chỗ đã sửa cho khớp token.** Không có dòng này thì lần sau không ai
  biết file là hàng đi lấy hay hàng tự may — đúng khoản nợ 1 đang phải trả.

---

## 6. Chọn component: luật, danh sách dùng, danh sách từ chối

### 6.1 Luật chọn

**[QUYẾT] Một component chỉ được lấy về khi trả lời được cả ba câu:**
1. Nó làm một việc mà bộ token + HTML thô **không làm được gọn hơn**?
2. Nó **phục vụ nội dung thật**, hay chỉ phủ hiệu ứng lên nội dung?
3. Nó **giữ được ngữ nghĩa HTML** (danh sách vẫn là `<ol>`, tiêu đề vẫn là `<h2>`) và **tắt được
   khi `prefers-reduced-motion`**?

Trả lời "không" ở bất kỳ câu nào → không lấy.

### 6.2 Danh sách sẽ dùng

[NGUỒN] Tên lấy từ sitemap chính thức, không liệt kê theo trí nhớ.

**A. Từ shadcn/ui (Radix bên dưới) — tầng cấu trúc và hành vi:**

| Component | Dùng ở đâu | Vì sao cần thư viện chứ không tự viết |
|---|---|---|
| `card` | Thẻ phòng trà (§7.2) — vật liệu chính của trang | Chuẩn hoá khung, đệm, viền cho khối lặp nhiều nhất |
| `button` | Theo dõi · lối ra · thử lại | Trạng thái bật/tắt/đang chạy, vùng chạm, vòng tiêu điểm |
| `badge` | "N đêm sắp tới" · nhãn Trực tuyến | — |
| `skeleton` | Trạng thái đang tải | Thay `Skeleton.jsx` tự viết |
| `separator` | Vạch ngăn mục | Có `role="separator"` đúng chuẩn |
| `dialog` | **Nợ kỹ thuật**, không dùng ở trang chủ lần này | Radix lo bẫy tiêu điểm + Escape + khôi phục tiêu điểm — ba thứ `FilterModal` tự viết đang thiếu |

**B. Từ react-bits — tầng chữ và chuyển động, lấy RẤT ít:**

| Component | Dùng ở đâu | Điều kiện |
|---|---|---|
| `count-up` | Con số THẬT ở măng sét | Chạy số hợp lệ khi số có thật; cấm cho số bịa |
| `split-text` | Măng sét — tên trang | **Đang dùng GSAP** → chỉ giữ nếu có biến thể không cần GSAP; nếu không thì viết lại bằng framer-motion |
| `logo-loop` | *Có điều kiện* — dải phòng trà | Chỉ khi có **từ 6 phòng trà thật có ảnh thật**. Dưới ngưỡng đó, dải chạy vòng 3 mục trông như hàng độn |

**C. framer-motion — tầng hiện dần khi cuộn:**

**[QUYẾT] Thay cả `Reveal.jsx` lẫn `ScrollFloat`** bằng `motion` + `whileInView` của framer-motion,
bọc toàn ứng dụng trong `<MotionConfig reducedMotion="user">`. Đây là chỗ trả nợ 1 rõ nhất: một
việc đang tự may bằng hai lớp (`useReveal` + `MotionGuard`), có hàng thư viện làm sẵn cả hai.

**[QUYẾT] `logo-loop` là ứng viên có điều kiện** cho một dải "phòng trà trên sàn": chỉ dùng khi có
**từ 6 phòng trà thật trở lên có ảnh thật**; dưới ngưỡng đó thì một dải chạy vòng gồm 3 mục trông
như hàng độn — đúng dấu hiệu AI slop mà nghiên cứu đã nêu tên.

### 6.3 Danh sách CỐ Ý TỪ CHỐI — phần quan trọng ngang danh sách dùng

Thư viện có hơn 200 component. Lấy nhiều không phải là dùng thư viện giỏi, mà là mất chủ đích.

| Nhóm bị từ chối | Ví dụ tên thật | Vì sao từ chối |
|---|---|---|
| Nền động toàn màn | `galaxy` · `plasma` · `aurora` · `ballpit` · `liquid-chrome` · `particles` · `hyperspeed` | Phủ hiệu ứng lên nội dung, không phục vụ nội dung. Và nền ngà ấm `--color-page` là quyết định thị giác có chủ đích |
| Hiệu ứng con trỏ | `splash-cursor` · `blob-cursor` · `ghost-cursor` · `target-cursor` · `crosshair` | Không có nghĩa trên thiết bị cảm ứng, và không mang thông tin |
| Ngôn ngữ lưới thẻ | `magic-bento` · `chroma-grid` · `masonry` · `carousel` · `circular-gallery` · `dome-gallery` · `bounce-cards` | Đặc tả §4 đã bác lưới thẻ: "21:00 hôm nay khác 21:00 ngày mai". Lấy mấy cái này là quay lại đúng thứ vừa bỏ |
| Thẻ hiệu ứng nặng | `tilted-card` · `decay-card` · `pixel-card` · `spotlight-card` · `metallic-paint` | Một tờ chương trình không nghiêng khi rê chuột |
| Điều hướng thay thế | `dock` · `gooey-nav` · `pill-nav` · `staggered-menu` · `bubble-menu` | Đã có thanh điều hướng thật đang chạy |
| Chữ biến dạng | `glitch-text` · `scrambled-text` · `decrypted-text` · `fuzzy-text` · `ascii-text` | Làm chữ khó đọc để trông "công nghệ". Ngược hẳn với phòng trà |

---

### 6.4 Rủi ro tích hợp: bộ biến của shadcn ĐÁNH NHAU với bộ token của dự án

**[QUYẾT] Phải xử lý trước khi lấy component đầu tiên về.** shadcn/ui dựng sẵn trên một bộ biến CSS
riêng (`--background`, `--foreground`, `--primary`, `--muted`…). Dự án này đã có bộ token riêng
(`--color-page`, `--color-ink`, `--color-brand`…) với tỉ số tương phản đã tính sẵn cho từng màu, và
có **cổng máy cấm màu ngoài bộ đó**.

Ba cách, chọn một:
1. **Ánh xạ** biến của shadcn sang token của dự án (`--primary: var(--color-brand)`…) — giữ được cả
   hai, ít sửa nhất. **Đề xuất dùng cách này.**
2. Sửa thẳng từng component chép về để dùng token của dự án — sạch nhất nhưng phải sửa lại mỗi lần
   cập nhật component.
3. Đổi dự án sang bộ biến của shadcn — **không**, vì mất bảng tương phản đã tính và phải sửa lại
   toàn bộ mã nguồn hiện có.

**[QUYẾT] Dù chọn cách nào, `npm run kiem-token` phải xanh sau bước đó.** Cổng là trọng tài, không
phải ý kiến của tôi.

---

## 7. Kiến trúc thông tin MỚI — phòng trà là đơn vị tổ chức, không phải buổi diễn

### 7.0 Lý do mạnh cho việc lật cấu trúc, mà bản thảo đầu của tôi bỏ sót

Tôi đã đề xuất giữ trục thời gian và chỉ sửa trạng thái trống cho gọn lại. Nhìn lại thì đó là
**chữa triệu chứng**. Nguyên nhân nằm sâu hơn một tầng:

> Trang đang lấy **buổi diễn** làm đơn vị tổ chức. Mà buổi diễn thì **thưa** — phòng trà độc lập
> không diễn hằng đêm. Một trang xây trên đơn vị thưa thì trống là **tất yếu**, không phải sự cố.
> **Phòng trà thì không thưa.** Nó luôn tồn tại, kể cả đêm không có ai hát.

Đổi đơn vị tổ chức từ *buổi diễn* sang *phòng trà* làm khoảng trống biến mất **ở tầng cấu trúc**,
chứ không phải bằng một dòng thông báo khéo léo. Đó là lý do quyết định lật cấu trúc của chủ dự án
đúng hơn đề xuất của tôi.

Ba chỗ dựa, không phải chỉ suy luận:

- **[NGUỒN]** Nghiên cứu về nới chiều ghi lại: Resy và OpenTable **giữ cố định cặp nhà hàng × ngày**
  vì người dùng chọn **không gian trước**. Một phòng trà gần mô hình nhà hàng hơn hẳn so với một
  tour diễn — người ta nói *"đi phòng trà X"*, ít khi nói tên buổi diễn.
- **[NGUỒN]** Bandsintown (100 triệu người dùng) cho theo dõi **cả địa điểm**, không chỉ nghệ sĩ.
- **[ĐO]** Backend đã sẵn sàng cho trục này: `LoungeListItemDto` trả `PrimaryImageUrl` và
  `UpcomingShowCount`; `POST /follows/lounges/{id}` có thật; và khi Admin duyệt buổi diễn mới thì
  `ReviewShowCommandHandler` gửi `NewEvent` cho **toàn bộ người theo dõi** phòng trà đó.

**Và nó giải luôn bài toán thị giác.** Trang hiện trông thưa vì gần như toàn chữ. Phòng trà thì có
**ảnh không gian thật** trong `primaryImageUrl` — chuyển sang trục phòng trà là trang tự có ảnh
thật để nhìn, không phải đi độn ảnh minh hoạ.

### 7.1 Bảy khối mới

Cột "nguồn" là **điều kiện tồn tại**: không có nguồn thì không có khối.

| # | Khối | Đơn vị | Nguồn dữ liệu thật | Vì sao đứng ở đây |
|---|---|---|---|---|
| 1 | **Măng sét** | — | Ngày hệ thống + đếm từ dữ liệu đã tải | Nói thành phố đêm nay có gì, bằng số thật |
| 2 | **Đang sáng đèn đêm nay** | Phòng trà | `/lounge-shows?sortBy=StartingSoon` lọc trong ngày, gom **theo phòng trà** | Khối trung tâm. Ảnh không gian + ai hát + mấy giờ + giá từ |
| 3 | **Phòng trà trên sàn** | Phòng trà | `GET /lounges` → `primaryImageUrl`, `upcomingShowCount` | **Khối không bao giờ trống.** Có nút theo dõi ngay tại thẻ |
| 4 | **Lịch diễn sắp tới** | Buổi diễn | Cùng mảng khối 2, sau nửa đêm, gom theo NGÀY | Trục thời gian **hạ xuống thứ cấp**, không xoá |
| 5 | **Duyệt theo gu** | Nhãn | `/lounge-shows/filter-options` + gom thể loại | Không khí + dòng nhạc, một mục |
| 6 | **Cam kết** | — | Ba câu đã đối chiếu code | Đặt sát chân trang, lúc người ta đang cân nhắc |
| 7 | **Lối ra** | — | — | Sang `/lounges` và `/shows` |

**[QUYẾT] Khối 5 "Gợi ý cá nhân" của cấu trúc cũ bị bỏ khỏi trang chủ.** Nó chỉ hiện cho người đã
đăng nhập, tức là phần lớn lượt vào trang chủ không thấy gì — một khối chiếm chỗ mà đa số không
dùng. Gợi ý cá nhân đúng chỗ hơn ở trang sau đăng nhập.

### 7.2 Thẻ phòng trà — vật liệu chính của trang

Đây là component quan trọng nhất phải dựng, và nó thay vai trò của "dòng buổi diễn" cũ.

**Bắt buộc có:** ảnh không gian thật (`primaryImageUrl`, thiếu thì dùng `CoverFallback`) · tên phòng
trà · quận + thành phố · **số đêm sắp tới** (`upcomingShowCount` — con số DỒI DÀO, không phải khan
hiếm) · nút **Theo dõi** dùng `POST /follows/lounges/{id}`.

**Khi phòng trà có diễn đêm nay, thẻ nói thêm:** giờ lên sân khấu · tên người biểu diễn theo đúng
thứ tự `OrderIndex` · giá từ, kèm dòng nói rõ giá gồm gì (§3 nguyên tắc 5).

**[QUYẾT] Nút Theo dõi phải có mặt trên thẻ, không giấu vào trang chi tiết.** [NGUỒN] Songkick đặt
nút Subscribe ngay tại thông điệp trống; đây là hành động được chứng minh mạnh nhất trong toàn bộ
nghiên cứu. Chưa đăng nhập mà bấm thì **nói trước** là cần đăng nhập, theo §3 nguyên tắc 6 — không
để họ bấm rồi mới đâm vào tường.

### 7.3 Cái gì ĐƯỢC MANG SANG từ bản cũ, và vì sao

Lật cấu trúc không có nghĩa là vứt hết. Bốn thứ dưới đây đổi bằng bằng chứng, nên mang sang nguyên:

1. **`sortBy='StartingSoon'`** thay cho `'Newest'`. [ĐO] `'Newest'` ở backend là
   `OrderByDescending(s => s.Id)` — thứ tự **được tạo**, không phải lịch diễn; dùng nó thì trang có
   thể **im lặng bỏ sót** một buổi diễn tối nay.
2. **Tên người biểu diễn theo `OrderIndex`.** Bỏ đi là in tờ chương trình không có tên ai.
3. **Buổi trực tuyến không hiện ghim bản đồ.** `format` có ba giá trị thật: Offline · Online · Hybrid.
4. **Hai cỡ trạng thái trống** và `role="status"`. Vẫn áp, chỉ là giờ ít khi chạm tới — vì khối 3
   không bao giờ trống.

### 7.4 Cái giá của việc lật cấu trúc — nói trước để không ai ngạc nhiên

- Người vào với câu hỏi **"tối nay có gì?"** phải đọc qua một tầng phòng trà mới tới buổi diễn.
  Khối 2 gom theo phòng trà chính là để giảm cái giá này, nhưng không xoá được nó.
- **[NGUỒN] Không có nghiên cứu nào phân xử trục phòng trà tốt hơn hay tệ hơn trục thời gian.**
  Đây là đánh đổi có lý do, không phải kết luận đã kiểm chứng. Cách duy nhất để biết là đo thật.

## 8. Trạng thái — bảng bắt buộc theo kiến trúc mới

Ô trống trong bảng này là việc chưa làm.

| Khối | Đang tải | Trống | Lỗi | Tin xấu |
|---|---|---|---|---|
| 2 · Sáng đèn đêm nay | khung xương đúng hình dạng thẻ thật | **một dòng**, trỏ xuống khối 3 | nói làm được gì + nút thử lại | hết vé / huỷ / dời |
| 3 · Phòng trà trên sàn | khung xương | **gần như không xảy ra** — nếu xảy ra thì cả sàn chưa có phòng trà nào được duyệt, lúc đó mới dùng khối lớn | nói làm được gì + thử lại | phòng trà bị tạm ngưng thì không hiện |
| 4 · Lịch sắp tới | khung xương | ẩn hẳn, không dựng hộp báo trống thứ hai | dùng chung lỗi khối 2 | như trên |
| 5 · Duyệt theo gu | — | ẩn khối | ẩn khối | — |

**[QUYẾT] Khối 3 là khối chống trống của cả trang.** Vì phòng trà luôn tồn tại kể cả khi không có
đêm diễn nào, nên khi mọi khối khác trống thì khối 3 vẫn có nội dung thật. Đây chính là cơ chế
khiến trang không còn "thủng một lỗ" — khác hẳn cách cũ là viết một câu thông báo cho khéo.

**[QUYẾT] "Ẩn khối" chỉ hợp lệ với khối phần thêm.** Khối 2 và 3 không bao giờ được ẩn — ẩn đi là
để trang tự im lặng, đúng lỗi mà chế độ Lịch trình của Google Calendar bị phàn nàn lặp lại. [NGUỒN]

---

## 9. Chữ, số, tiếng Việt

- Gọi **"buổi hòa nhạc" / "buổi diễn"**, không gọi "sự kiện".
- Ngày: **NGÀY/THÁNG**, không bao giờ MM/DD. Giờ: 24h. Số tiền: số nguyên đồng, có `tabular-nums`.
- Tên thứ viết hoa đúng chính tả tiếng Việt: "Thứ sáu", không phải "Thứ Sáu" — tên thứ không phải
  danh từ riêng. Dùng `utils/ngayVietNam.js`, đã có 13 ca kiểm. [ĐO]
- **[QUYẾT] Mọi chuỗi ngày/giờ hiển thị phải đi qua `utils/ngayVietNam.js`.** Gọi thẳng
  `dayjs().format()` trong component là vi phạm — hai chỗ định dạng khác nhau thì trang tự mâu thuẫn.

---

## 10. Tiếp cận — mức bắt buộc

- Vùng chạm tối thiểu **44px**.
- Thông báo trạng thái trống dùng `role="status"`; **không** đẩy tiêu điểm vào đó. [NGUỒN]
- Danh sách có thứ tự phải là `<ol>` thật — thứ tự thời gian là thông tin, không phải cách xếp hình.
- Liên kết bọc **tiêu đề buổi diễn**, không bọc cả khối: trình đọc màn hình đọc ra tên buổi diễn
  làm tên liên kết.
- Không có hai liên kết cùng trỏ một đích trong cùng một khối.
- Ảnh trang trí để `alt=""` và `aria-hidden`; ảnh mang thông tin phải có alt thật.
- **[QUYẾT] Tương phản chữ tối thiểu 4.5:1.** Bộ token hiện tại đã ghi sẵn tỉ số cho từng màu —
  dùng đúng token là tự đạt.

---

## 11. Chuyển động — framer-motion là tầng duy nhất

**[CHỦ DỰ ÁN CHỐT]** framer-motion làm tầng chính, bỏ gsap.

- **[QUYẾT] Bọc toàn ứng dụng trong `<MotionConfig reducedMotion="user">`.** Đây là cách thư viện
  tự tôn trọng `prefers-reduced-motion`, và nó **xoá được `MotionGuard.jsx`** — một file tự viết chỉ
  tồn tại vì react-bits không lo việc đó.
- **[ĐO] Trình tự gỡ gsap, làm sai là vỡ trang:** thay `ScrollFloat` trong `SectionTitle.jsx` →
  thay hoặc bỏ `SplitText` trong `HeroBanner.jsx` → chạy `grep -rn "gsap" src` **phải ra 0 dòng** →
  lúc đó mới gỡ `gsap` và `@gsap/react` khỏi `package.json`. Gỡ trước khi grep sạch là vỡ.
- Chuyển động chỉ để **dẫn mắt theo thứ tự đọc**. Không hiệu ứng lặp vô hạn trong khung nhìn đầu.
- Măng sét **không** bọc hiệu ứng hiện dần: nó nằm sẵn trong khung nhìn đầu, cho nó mờ dần vào chỉ
  làm chậm thứ người dùng cần thấy ngay.

---

## 12. Hiệu năng

[ĐO] Bản dựng hiện tại có cảnh báo *"Some chunks are larger than 500 kB after minification"*.

- **[QUYẾT] Trang chủ không được nạp `three`, `konva`, `recharts`, `hls.js`.** Ba thư viện đó phục
  vụ màn khác; nếu chúng lọt vào gói của trang chủ thì phải tách bằng `import()` động.
- **[QUYẾT] Mỗi component react-bits chép về phải được cân nhắc riêng về chi phí.** Một hiệu ứng
  nền WebGL nặng hơn toàn bộ phần còn lại của trang là cái giá không đáng.
- Ảnh bìa buổi diễn: `loading="lazy"`, khung giữ đúng tỉ lệ để trang không nhảy khi ảnh về.

---

## 13. Cưỡng chế bằng máy

Nghiên cứu kết luận tầng chữ (tài liệu, lời dặn) là tầng yếu nhất. Nên luật quan trọng phải thành
mã thoát khác 0.

| Cổng | Đang có | Cần thêm |
|---|---|---|
| `npm run kiem-token` | Bắt màu mặc định Tailwind + mã hex viết thẳng. [ĐO] 28 file xanh | Mở rộng vùng quét kiểu bánh cóc |
| `npm run kiem-ap-luc` | Bắt 8 dạng con số gây áp lực. [ĐO] Đã chứng minh bằng đột biến | — |
| **Cổng mới [QUYẾT]** | — | **`kiem-component`**: mọi file trong `src/components/reactbits/` phải có khối chú thích ghi URL gốc + ngày chép + chỗ đã sửa. Thiếu → thoát 1 |
| **Cổng mới [QUYẾT]** | — | **`kiem-ngay`**: cấm gọi `dayjs(...).format(` trực tiếp trong `src/components/home/`, buộc đi qua `utils/ngayVietNam.js` |
| **Cổng mới [QUYẾT]** | — | **`kiem-gsap`**: sau khi chuyển xong, `gsap` không được xuất hiện ở bất kỳ đâu trong `src/`. Chặn việc lỡ tay lấy về một component react-bits dùng GSAP rồi nuôi lại hai thư viện chuyển động |

**[QUYẾT] Mỗi cổng mới phải được chứng minh ĐỎ trước khi tin là nó xanh có nghĩa** — chạy bộ đột
biến gồm cả nhóm *phải đỏ* lẫn nhóm *phải xanh*, và đếm số mẫu bắt được trước/sau khi sửa. Đây là
bài học L-13, đổi bằng một lần tôi vá cổng và làm nó bắt được **ít hơn** trước khi vá mà vẫn báo
xanh.

---

## 14. Tiêu chí nghiệm thu

**Máy kiểm được — bắt buộc xanh hết:**
- [ ] `npx vite build` thoát 0
- [ ] `npx eslint src/components/home src/pages/home src/utils` không thêm lỗi mới nào
- [ ] `npm run kiem-thiet-ke` thoát 0
- [ ] Hai cổng mới ở §13 tồn tại, và **đã chạy đột biến chứng minh chúng bắt được lỗi**
- [ ] Mọi bộ kiểm trong `src/utils/*.test.mjs` vẫn xanh
- [ ] `grep -rln "framer-motion" src` cho kết quả khớp với quyết định ở §15 câu 2
- [ ] Mỗi file trong `src/components/reactbits/` có khối chú thích nguồn gốc

**Máy KHÔNG kiểm được — chủ dự án phải mở trình duyệt xem:**
- [ ] Trang đọc ra một tờ chương trình, hay vẫn ra một trang đích quảng cáo
- [ ] Mốc giờ/ngày dính bên trái có dễ theo khi cuộn không
- [ ] Hàng tên người biểu diễn có làm dòng diễn rối không
- [ ] Bật "giảm chuyển động" trong hệ điều hành → mọi hiệu ứng **tắt hẳn**
- [ ] Thu cửa sổ xuống bề ngang điện thoại → không có thanh cuộn ngang
- [ ] Đăng xuất → dòng "đặt vé cần đăng nhập" xuất hiện đúng chỗ

---

## 15. Ba quyết định — ĐÃ CHỐT 23/09/2026

Giữ nguyên cả đề xuất lẫn lựa chọn, để sau này đọc lại biết đã cân nhắc gì.

| Câu | Tôi đề xuất | Chủ dự án chốt | Hệ quả |
|---|---|---|---|
| Phạm vi | Giữ trục thời gian | **Lật cả cấu trúc** | §7 viết lại hoàn toàn |
| `framer-motion` cài mà không dùng | Gỡ, chuẩn hoá về gsap | **Giữ, làm tầng chính** | Bỏ gsap; viết lại `SectionTitle`; xoá được `MotionGuard` |
| Thư viện tiếp cận | Chưa thêm lần này | **Thêm Radix / Base UI** | Dùng shadcn/ui (dựng trên Radix) |

### 15.1 Vì sao lựa chọn framer-motion HƠN đề xuất ban đầu của tôi

[ĐO] `SplitText` và `ScrollFloat` chép từ react-bits đều nhập `gsap` + `gsap/ScrollTrigger`, và
`SplitText` còn cần plugin `gsap/SplitText` + `@gsap/react`. [ĐO] Trong repo phải có thêm một file
tự viết — `MotionGuard.jsx` — chỉ để bọc ngoài, vì **react-bits không tự xử lý
`prefers-reduced-motion`**; chú thích trong `SectionTitle.jsx:37` ghi đúng điều đó.

framer-motion có sẵn `useReducedMotion()` và `<MotionConfig reducedMotion="user">` ở tầng thư viện.
Chuyển sang nó **xoá được lớp bọc tự may**, tức là trả thêm một phần của nợ 1. Đề xuất ban đầu của
tôi (giữ gsap) bỏ sót điểm này. Lựa chọn của chủ dự án tốt hơn, và đây là lý do.

**[ĐO] Việc phải làm kèm theo:** gsap hiện chỉ được nhập ở đúng 2 file react-bits. Bỏ được gsap
nghĩa là gỡ `gsap` + `@gsap/react` khỏi `package.json` — nhưng **chỉ sau khi** đã thay xong cả hai
và `grep -rn "gsap" src` trả về 0 dòng. Gỡ trước là vỡ trang.

### 15.2 Radix được hiện thực bằng shadcn/ui

[NGUỒN] Tài liệu shadcn: đặt `"tsx": false` trong `components.json` thì *"allows components to be
added as JavaScript with the `.jsx` file extension"*; với Tailwind v4 thì trường đường dẫn config
*"leave this blank"*. Tức shadcn chạy đúng trên React 19 + Vite 8 + Tailwind 4 + JavaScript.

**[QUYẾT] Chọn shadcn/ui thay vì dùng thẳng Radix trần**, vì ba lý do: (1) nó *là* Radix ở bên
dưới, nên vẫn đúng lựa chọn của chủ dự án; (2) component chép thẳng vào repo nên sửa được cho khớp
bộ token — bắt buộc, vì cổng `kiem-token` cấm màu ngoài token; (3) [NGUỒN] chính react-bits cũng
cài qua CLI của shadcn (`npx shadcn@latest add @react-bits/...`), nên hai thư viện dùng chung một
đường lấy về.

---

## 16. Thứ tự thi công

Mỗi bước có đầu ra kiểm được; không sang bước sau khi bước trước chưa xanh. Bước 1 đã xong.

1. ~~Chốt §15.~~ **Xong 23/09.**
2. **Viết ba cổng trước khi viết component** (`kiem-component`, `kiem-ngay`, `kiem-gsap`) và **chạy
   đột biến chứng minh chúng đỏ được**. Cổng viết sau thì nó chỉ hợp thức hoá thứ đã trót làm.
3. **Dựng shadcn/ui**: `components.json` với `"tsx": false`, trường Tailwind để trống (Tailwind v4),
   rồi **ánh xạ bộ biến của shadcn sang token dự án** (§6.4). Nghiệm thu: `kiem-token` xanh.
4. **Chuyển tầng chuyển động sang framer-motion** theo đúng trình tự ở §11, kết thúc bằng
   `grep -rn "gsap" src` ra 0 dòng rồi mới gỡ gói.
5. **Dựng `TheLoungeCard`** (§7.2) — vật liệu chính, dựng trước vì khối 2 và 3 đều dùng nó.
6. **Dựng từng khối theo thứ tự trang**: măng sét → sáng đèn đêm nay → phòng trà trên sàn → lịch
   sắp tới → duyệt theo gu → cam kết → lối ra.
7. **Dọn xác**: xoá `Reveal.jsx`, `MotionGuard.jsx`, `useReveal.js`, và các component khối cũ không
   còn ai dùng. **[QUYẾT] Chỉ xoá sau khi `grep` chứng minh không còn nơi nào nhập** — `CLAUDE.md`
   cấm phản xạ "xoá trước khi thêm", và thứ trông như mã chết thường là cơ chế chưa được nối.
8. **Chạy toàn bộ §14**, rồi giao cho chủ dự án phần máy không kiểm được.

---

## 17. Rủi ro và điều chưa biết

- **[NGUỒN] Không có nghiên cứu nào phân xử nới chiều ngày hay chiều địa điểm.** Trang đang nới
  theo ngày. Đây là suy luận theo hình dạng dữ liệu, không phải kết luận đã kiểm chứng.
- **[NGUỒN] Không có số đo hành vi thật trên chính sản phẩm này.** Mọi khẳng định về "cách này tốt
  hơn" đều là suy luận từ nguyên tắc và từ sản phẩm khác. Cách đúng để biết là đo sau khi triển
  khai — cần chủ dự án quyết có đo không và đo bằng gì.
- **Rủi ro lớn nhất của chính lần làm này:** lấy về 200 component rồi rải khắp trang. Đó là AI slop
  mặc áo thư viện. §6.3 tồn tại để chặn đúng điều đó, và danh sách từ chối dài hơn danh sách dùng
  là **có chủ đích**.
- **Không có Playwright trong dự án** [ĐO] — nên không có cách nào chụp màn hình tự động để so sánh
  trước/sau. Mọi đánh giá thị giác đều phải do người làm.
