# Rà soát AI-slop toàn site — 22/09/2026

Đối chiếu với 22 dấu hiệu đã tra cứu trong `TRANG-CHU-BRIEF.md §6`. Mỗi dòng có lệnh đo kèm theo.

> **Kết luận đầu tiên, quan trọng nhất:** trang chủ **không phải** AI slop. Nó đã được thiết kế lại
> có chủ đích ngày 21–22/09 với brief 13KB trích nguồn thật. Việc cần làm không phải vẽ lại, mà là
> **thực thi nốt những gì brief đã quyết nhưng code chưa làm** — đó là toàn bộ nội dung phần A.

---

## A. Trang chủ — ĐÃ SỬA trong lượt này

| # | Vấn đề | Bằng chứng trước khi sửa | Đã làm gì |
|---|---|---|---|
| A1 | **Pill nổi trên H1** — dấu hiệu slop số 7 trong 16 pattern mà chính brief liệt kê. Brief §6 đã **quyết** đổi thành "nhãn chữ nhỏ có gạch chân, lệch trái" nhưng **chưa thực thi** | `HeroBanner.jsx:94` vẫn `bg-brand px-3 py-1 rounded-full` | Đổi thành nhãn biên tập: gạch chỉ mảnh 32px + chữ giãn `tracking-[0.22em]`, canh lệch trái. Gộp chip và thể loại thành một dòng `Tối nay · Bolero` |
| A2 | **`animate-pulse`** — animation lặp vô hạn thuần trang trí, thứ chính brief §5 xếp **mức High** phải tránh, và `useReveal.js:7-8` nhắc lại lần nữa | `HeroBanner.jsx:95` | Bỏ hẳn. Thông tin "Tối nay" đã nằm trong chữ, không cần chấm nhấp nháy |
| A3 | **Nhịp chuyển động chưa nối vào trang chủ.** Brief §5 + §6b lấy luật *"chuyển động là biên đạo, không phải một bữa tiệc nhảy"*; hạ tầng `useReveal` + `.reveal` có sẵn và đã tắt đúng khi `prefers-reduced-motion` — nhưng `HomePage.jsx` **không hề gọi** | `grep Reveal pages/home/HomePage.jsx` → **0** | Bọc `<Reveal>` cho MoodExplorer, carousel gợi ý, carousel thể loại, dải cam kết. **Cố tình không bọc HeroBanner** — nó nằm trong khung nhìn đầu, cho mờ dần vào chỉ làm chậm thứ cần thấy ngay |
| A4 | **`TrustStrip` đặt sai chỗ** — chen dải chữ cam kết vào giữa người xem và thứ họ tới để xem. Brief §4 xếp dải này ở cuối, sát chân trang | `HomePage.jsx:185`, ngay dưới hero | Trả về cuối, ngay trước lối ra "Xem tất cả buổi diễn" — đúng lúc người dùng đang cân nhắc đặt vé |
| A5 | **Đuôi trang là N carousel thể loại** — ngôn ngữ của dịch vụ xem phim theo yêu cầu, không phải của sàn phòng trà. Brief §4 định nghĩa nhịp trang **không có** phần này | `HomePage.jsx:198-202` sinh 1 carousel cho **mỗi** thể loại | Trải đủ **2** thể loại nhiều buổi diễn nhất (`SO_CAROUSEL_THE_LOAI`, sắp giảm dần theo số buổi diễn); phần còn lại rút về một hàng chip kèm **số buổi diễn thật** — trả lời đúng câu "thể loại này có gì để xem không?" |
| A6 | **Xám lạnh của Tailwind lẫn vào hệ màu ngà ấm** — `gray-*` là trung tính lạnh, token dự án là ngà ấm `#FBF7F0`/`#E4D9C8`. Đây là **di trú dở dang**, không phải chủ đích: các file này đã dùng `bg-card`/`text-ink-mute`/`bg-espresso` rồi, chỉ còn sót xám | 29 lần trong `components/home/` + `pages/home/` (FilterModal 18, HorizontalTagSlider 8) | Đổi hết sang token: `gray-50/100`→`sunken`, `gray-100/200`→`line`, `gray-300`→`line-strong`, `gray-800/900`→`ink`, `red-400`→`danger`. Còn lại **0** |

**Kiểm chứng đã chạy thật:**
- `npx eslint src/pages/home/ src/components/home/` → **1 lỗi duy nhất, và là lỗi CÓ SẴN**: `FilterModal.jsx:40 set-state-in-effect`. Đã chứng minh bằng `git stash` bản gốc rồi lint lại — bản chưa sửa cũng báo đúng lỗi đó. Diff của tôi trên file này chỉ đụng tên lớp màu, không đụng logic.
- `npx vite build` → **exit 0**, `✓ built in 2.66s`.
- Phạm vi: **6 file, chỉ trong `components/home/` và `pages/home/`**. Không đụng 35 file đang sửa dở của phiên khác. Lùi lại sạch bằng `git checkout -- src/components/home src/pages/home`.

**Một lỗi tôi tự gây ra rồi tự sửa:** khi đổi màu hàng loạt, `border-gray-300 hover:border-line-strong` thành `border-line-strong hover:border-line-strong` — base trùng hover nên **mất hẳn phản hồi khi rê chuột**. Đã sửa về `border-line hover:border-line-strong` ở cả `FilterModal.jsx:15` và `HorizontalTagSlider.jsx:60`.

---

## B. CHƯA LÀM ĐƯỢC — phải nói rõ

**Chưa nhìn bằng mắt.** Checklist §7 của chính brief có dòng *"Chụp ảnh màn hình desktop và mobile sau khi build, xem bằng mắt trước khi báo là xong"* — tôi **chưa làm được**: dự án không có Playwright/Puppeteer (`package.json` không khai, `node_modules/.bin` không có binary). Lint sạch và build exit 0 **không chứng minh trang đẹp**, chỉ chứng minh nó dịch được. Ba thay đổi cần mắt người xác nhận:
1. Nhãn biên tập mới ở hero có đủ nổi trên ảnh nền sáng không (chữ `brand-on-dark #D9A441` trên lớp phủ espresso).
2. Nhịp `Reveal` khi cuộn có mượt hay giật.
3. Hàng chip thể loại ở đuôi trang khi có nhiều thể loại thì xuống dòng có gọn không.

**Cách xem nhanh:** `cd C:\Fontend_MLACP\mlacp-ui && npm run dev` rồi mở `http://localhost:5173`.

---

## C. Các trang còn lại — xếp theo mức độ, CHƯA sửa

| # | Vấn đề | Số đo | Mức |
|---|---|---|---|
| C1 | **~580 chỗ dùng màu mặc định Tailwind thay cho token thiết kế** trên phần còn lại của site (tổng toàn site 609, khu trang chủ đã xử lý 29). Đây là thứ làm giao diện trông "mặc định", và nó còn khiến số đo tương phản WCAG trên token **không còn đúng** cho 580 chỗ đó | `ShowBadges.jsx` 33 · `ComplaintBadges.jsx` 25 · `PendingModerationTab.jsx` 24 · `VenueBadges.jsx` 23 · `OwnerShowSettingsPage.jsx` 18 · `AdminKycReviewsPage.jsx` 18 | **Cao** |
| C2 | `animate-pulse` còn ở 3 chỗ: `EventDetailPage.jsx:229`, `LivestreamWatchPage.jsx:334`, `OwnerLivestreamsPage.jsx:30` | — | **Trung bình** — nhưng cả ba đều là chỉ báo "đang phát trực tiếp", tức là **có nghĩa** chứ không thuần trang trí. Cần xem từng chỗ rồi quyết, đừng xoá hàng loạt |
| C3 | `bg-yellow-500` cứng trong `AdminShowHero.jsx:48` | 1 | **Thấp** |

**Ba dấu hiệu slop KHÔNG tìm thấy — site này sạch:**
- Gradient tím/chàm/xanh trang trí: **0**.
- Font Inter: **0** — 23 kết quả grep đều là `setInterval`/`clearInterval`, **dương tính giả**.
- Lorem ipsum / dữ liệu bịa: **0** — 6 kết quả đều là `placeholder="ban@example.com"` hợp lệ, **dương tính giả**.

`backdrop-blur` xuất hiện 66 lần, nhưng brief §6 đã xét và kết luận đây là dùng **có chức năng** (giữ chữ đọc được trên ảnh và header dính), không phải "thẻ kính" trang trí — giữ nguyên.
