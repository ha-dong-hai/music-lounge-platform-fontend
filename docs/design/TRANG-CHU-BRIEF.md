# Bản tóm tắt thiết kế — Trang chủ (21/09/2026)

Tài liệu này ghi lại **vì sao** trang chủ được dựng như vậy, để lần sau không ai phải đoán lại. Mỗi quyết định đều trỏ tới một nguồn thật đã kiểm tra — không có quyết định nào là "cho đẹp".

## 1. Nguồn tham khảo đã kiểm tra (không chỉ dựa vào một chỗ)

| Nguồn | Kết luận rút ra | Có dùng không |
|---|---|---|
| `aura_echo/DESIGN.md` — bộ thiết kế Stitch bạn từng tạo cho chính sản phẩm này ("Aura & Echo — The Quiet Luxury of Sound") | Nền kem/giấy, chữ than đậm, vàng đồng chỉ dùng cho hành động chính, viền chỉ (hairline) thay vì đổ bóng nặng, glow mềm 40px thay vì shadow cứng | **Dùng làm gốc** |
| Ảnh chụp thật `auralounge_guest_discovery` (cùng bộ Stitch) | Có một lỗi thật cần tránh: khối hero tối đổ xuống nền đen phía dưới làm chữ "Trending Tonight" gần như vô hình — đúng thứ u ám mà yêu cầu đề bài cấm | **Tránh lặp lại lỗi này** |
| `awesome-design-md/starbucks` — phân tích hệ thiết kế Starbucks (repo tham khảo brand thật) | Nền kem ấm thay vì trắng lạnh; vàng chỉ dành cho khoảnh khắc "địa vị/thưởng", không phải màu trang trí đại trà; nút pill bo tròn hết cỡ + nhấn `scale(0.95)` khi bấm; nhịp trang xen kẽ khối sáng/khối tối để tạo điểm dừng thị giác; dùng serif riêng cho khoảnh khắc hoài niệm | **Dùng để định luật "vàng dùng tiết kiệm" và nhịp khối sáng-tối** |
| `awesome-design-md/linear.app`, `.../framer` | Cả hai đẹp nhưng là ngôn ngữ SaaS lạnh, nền gần đen, một màu chấm phá xanh/tím — đúng kiểu "AI tạo web SaaS" mà đề bài không muốn cho một phòng trà ấm cúng | **Cân nhắc rồi loại** |
| plugin `ui-ux-pro-max` (bộ máy tra luật UI/UX cục bộ) — tự tra bằng từ khoá trung tính "acoustic lounge hospitality" | Máy trả về mặc định bảng màu xanh dương doanh nghiệp kiểu SaaS — **chính là ví dụ sống của AI slop** nếu tin theo mù quáng. Tra tiếp theo `--domain ux` cho quy tắc chuyển động/tiếp cận thì hữu ích thật | **Không dùng màu nó gợi ý; dùng làm checklist kiểm chuyển động/tiếp cận (mục 6)** |
| animejs.com (fetch thật) | Nguyên tắc: easing kiểu "expo/spring" tự nhiên, stagger theo thời gian, chuyển động có mục đích tương tác — không phô diễn | **Dùng nguyên tắc, không thêm thư viện mới (mục 5 giải thích)** |
| threeui.com — mẫu "Complete Shelf" 3D | Đây là mẫu **kệ hàng thương mại điện tử 3D**, dành cho ngành bán lẻ trưng sản phẩm. Một phòng trà bán vé không có "hàng trên kệ" để xoay 3D | **Loại**, ghi rõ lý do: bê nguyên hiệu ứng thời thượng không liên quan tới sản phẩm chính là một dạng AI slop |
| Trang Stitch mới tạo hôm nay (`projects/7246494802064069480`) | Bố cục hero → dải "đêm nay" → khối editorial → trust band → footer rất hợp; nhưng nó bịa: 1 phòng trà duy nhất "Est. 1972", địa chỉ, hotline, "52 năm", giá vé kèm sẵn đồ uống | **Dùng bố cục/nhịp, KHÔNG dùng nội dung bịa — xem mục 3** |

## 2. Vì sao không copy nguyên trang Stitch

Sản phẩm thật là **một sàn nhiều phòng trà** (Hoa Sứ, Sương Mai, Blue Note Sài Gòn...), mỗi phòng có hồ sơ, lịch sử, chủ riêng — không phải một thương hiệu duy nhất "Phòng Trà Sài Gòn Est. 1972". Trang Stitch tưởng tượng ra một phòng trà đơn nhất với năm thành lập, địa chỉ, hotline, giá vé kèm trà — toàn bộ những chi tiết này **không có thật** trong hệ thống. Dùng nguyên xi là nói dối người xem, đúng thứ dự án này luôn tránh (xem các ghi chú "không bịa dữ liệu" rải khắp code hiện có). Vì vậy trang chủ giữ đúng vai trò của nó: tiếng nói của **nền tảng** giới thiệu nhiều phòng trà thật, không tự nhận là một phòng trà.

## 3. Bảng màu & chữ — giữ nguyên hệ token đã có, bổ sung có kỷ luật

Không tạo hệ màu mới. Token `page/card/sunken/line/ink/brand/espresso/cream` trong `src/index.css` (đã qua kiểm WCAG AA phiên trước) được **giữ nguyên**, chỉ bổ sung:

- `--shadow-glow`: glow ấm 40px mờ thay cho đổ bóng cứng (theo Aura & Echo + Starbucks "whisper shadow").
- `--ease-out-soft`, `--ease-spring`: hai đường cong easing "tự nhiên" mô phỏng đúng cảm giác `inOutExpo` / spring của animejs, nhưng viết bằng CSS thuần — xem mục 5.
- **Luật dùng vàng đồng (`brand`/`brand-text`)**: chỉ ở hành động chính (CTA), giá vé, và trạng thái đang chọn — không tô nền lớn, không trang trí tràn lan. Đây là kỷ luật rút ra trực tiếp từ Starbucks (vàng chỉ cho khoảnh khắc "thưởng/địa vị").
- Font giữ **Playfair Display** (serif, khoảnh khắc lớn) + **Plus Jakarta Sans** (chữ chức năng) — đã nạp sẵn trong `index.html` từ trước, đã tự kiểm chứng hiển thị đúng dấu tiếng Việt qua ảnh chụp thật (không phải đoán). Trang Stitch mới tạo hôm nay, sinh ra độc lập, cũng tự chọn đúng hai font này — một điểm trùng khớp củng cố lựa chọn, không phải lý do duy nhất.

## 4. Nhịp khối sáng–tối (thay vì một màu kem trải dài)

Học từ Starbucks "color-block page rhythm": Hero (ảnh + lớp phủ espresso) → dải "Tối nay & sắp diễn ra" (nền kem) → khối editorial espresso đậm (trích dẫn hoài niệm, tái dùng đúng câu quote đã ở trang đăng nhập để giữ giọng thương hiệu nhất quán) → carousel gợi ý (nền kem) → dải tin cậy 3 cột (nền kem, viền chỉ) → footer espresso (đã làm ở phiên trước). Nhịp sáng/tối này tạo điểm dừng mắt mà không cần màu sắc sặc sỡ hay hiệu ứng nặng.

## 5. Chuyển động — nguyên tắc từ animejs, không thêm thư viện

animejs được đề bài nêu làm ví dụ, nhưng dự án **chưa từng dùng thư viện animation nào**. Thêm một thư viện mới cho vài hiệu ứng nhỏ đi ngược nguyên tắc hiệu năng ưu tiên cao nhất trong checklist `ui-ux-pro-max` (mục 6). Quyết định: lấy đúng **nguyên tắc** (easing tự nhiên, stagger, chuyển động có mục đích, tối đa 1–2 điểm chuyển động mỗi màn hình — luật này lấy trực tiếp từ kết quả tra `ui-ux-pro-max --domain ux`), hiện thực bằng:

- Một hook `useReveal` ~40 dòng dùng `IntersectionObserver` (không phụ thuộc ngoài) để fade+dịch nhẹ khi cuộn tới — tương đương "scroll-driven" của animejs.
- Cubic-bezier `(0.16, 1, 0.3, 1)` cho hiệu ứng "expo-out" và `(0.34, 1.56, 0.64, 1)` cho cảm giác nảy nhẹ khi hover — cùng gốc toán với easing của animejs, không cần tải thêm 24KB.
- Ken Burns chậm (zoom 1 → 1.05 trong 18s, `ease-out`) cho ảnh hero — gợi ý trực tiếp từ `group-hover:scale-105 duration-1000` đã thấy trong code.html thật của Aura & Echo.
- **Tất cả animation dừng hoàn toàn** khi `prefers-reduced-motion: reduce` — quy tắc đã có sẵn ở `index.css` từ phiên trước, mở rộng áp dụng cho các phần mới.
- Không dùng `animate-bounce`/animation lặp vô hạn trang trí — bị liệt vào lỗi mức "High" khi tra `ui-ux-pro-max --domain ux`.

## 6. Nghiên cứu thật về "AI slop" — 22 dấu hiệu cụ thể, không phải cảm tính

Người dùng yêu cầu điều tra thật, không chỉ dựa cảm giác "trông giống AI". Đây là kết quả tra cứu thật (không bịa), kèm nguồn:

**6 dấu hiệu landing page AI chung chung** ([superdesign.dev](https://superdesign.dev/blog/fix-generic-ai-landing-page)): tiêu đề kiểu "The AI-powered X for modern Y"; hero căn giữa + gradient blob tím-chàm; ba thẻ tính năng giống hệt nhau; bảng màu indigo/violet mặc định; thứ tự phần cố định (hero → 3 tính năng → testimonial → giá → CTA); copy lợi ích chung chung ("Save time, work smarter").

**16 pattern "AI design slop"** ([developersdigest.tech](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)): font Inter cho mọi thứ; "VibeCode Purple"; dark mode mặc định với chữ xám; gradient khắp nơi; glow/box-shadow màu lớn; hero căn giữa sans-serif chung; **badge/pill phía trên H1**; border màu ở cạnh card; feature card giống hệt nhau với icon; chuỗi bước đánh số 1-2-3; **hàng banner thống kê**; nav/sidebar dùng icon emoji; **tiêu đề/nhãn VIẾT HOA TOÀN BỘ**; mặc định shadcn/ui; glassmorphism tràn lan.

**Đối chiếu thành thật với thiết kế đang có** (không chỉ liệt kê cái đã đúng):

| Dấu hiệu | Trạng thái | Ghi chú |
|---|---|---|
| Gradient tím/chàm trang trí | Không có | Gradient duy nhất dùng là scrim đọc chữ trên ảnh — có chức năng, không trang trí |
| Font Inter | Không dùng | Playfair Display (serif) + Plus Jakarta Sans |
| 3 thẻ tính năng giống hệt + icon tròn | Đã bỏ | Thay bằng thanh cam kết 1 dòng kiểu bảng đồng bảo tàng |
| Hàng banner thống kê | Đã bỏ, nhưng Stitch **cứ bịa lại** "28 phòng trà" ở 3/5 lần sinh dù đã dặn rõ 2 lần | → Không bao giờ tin số liệu Stitch tự sinh, luôn tự kiểm và xoá khi viết code thật |
| Badge/pill phía trên H1 | **CÓ** — chip "Tối nay" + nhãn thể loại nổi trên tiêu đề hero | Khác về ý nghĩa (thông tin thật: trạng thái + thể loại, không phải "✨ New") nhưng GIỐNG về hình dáng (pill nổi trên đầu). Quyết định: đổi hình dạng — không dùng pill viên thuốc, chuyển thành nhãn chữ nhỏ có gạch chân/viền dưới, đặt lệch trái thay vì nổi giữa |
| Nhãn VIẾT HOA + giãn chữ | **CÓ**, dùng khá nhiều (kicker, section label) | Đây là quy ước layout báo/tạp chí in thật (Vogue, catalogue bảo tàng), không tự nó là AI slop — chỉ thành slop khi nó là nhãn rỗng nghĩa lặp lại khắp nơi. Quyết định: GIỮ nhưng giảm tần suất, chỉ dùng cho nhãn thật sự cần phân cấp (không phải mọi tiêu đề phần) |
| Glassmorphism | Dùng rất ít (nút icon nổi trên ảnh, header dính) | Chức năng (giữ chữ đọc được khi cuộn), không phải "thẻ kính" trang trí toàn trang — giữ nguyên |

## 6b. Nghiên cứu về "trông sang trọng thật sự" (không chỉ né AI slop)

Từ [iiad.edu.in](https://www.iiad.edu.in/the-circle/why-some-websites-just-feel-expensive/) — cách Hermès, Chanel, Dior, Rolex, Apple, Burberry, Gucci tạo cảm giác đắt tiền trên web: khoảng trắng rộng rãi để từng phần tử được chú ý riêng lẻ; serif cổ điển cho cảm giác "bất hủ, chế tác"; **"chuyển động là biên đạo, không phải một bữa tiệc nhảy"** — hoạt ảnh chậm, có mục đích, kích hoạt bằng cuộn nhẹ nhàng chứ không gây chú ý; ảnh mang tính biên tập, gợi kết cấu/cảm xúc; bảng màu tối + vàng kim + trung tính cho cảm giác thân mật; bố cục "diễu hành nội dung một cách cố ý — tiết lộ từng phần như một cuộc triển lãm được chọn lọc."

Câu "motion is choreography, not a dance party" được lấy làm luật cho mục 5 (chuyển động): hook `useReveal` hiện từng khối theo đúng thứ tự cuộn — đúng tinh thần "tiết lộ như triển lãm", không phải hiệu ứng cho vui.

## 7. Danh sách kiểm trước khi coi là xong (cơ chế verify)

Tick từng dòng bằng bằng chứng thật, không tự nhận:

- [ ] Không có dữ liệu bịa (giờ mở cửa, địa chỉ, số liệu) — mọi con số trên trang chủ lấy từ API thật hoặc là bản sao chính sách đã viết sẵn trong code.
- [ ] Tương phản chữ/nền ≥ 4.5:1 cho mọi tổ hợp màu mới — đo bằng script, không nhìn mắt.
- [ ] `prefers-reduced-motion` tắt hết animation trang trí.
- [ ] Không còn phần tử bấm được nào thiếu nhãn (`aria-label`) hoặc dưới 44×44px.
- [ ] `npm run lint` không phát sinh lỗi mới so với trước khi sửa.
- [ ] `vite build` chạy sạch.
- [ ] Chụp ảnh màn hình desktop **và** mobile sau khi build, xem bằng mắt trước khi báo là xong.
