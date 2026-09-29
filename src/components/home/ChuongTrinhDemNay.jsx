// src/components/home/ChuongTrinhDemNay.jsx
//
// KHỐI TRUNG TÂM CỦA TRANG CHỦ — xem docs/design/DAC-TA-TRANG-CHU.md §4.
//
// VÌ SAO XẾP THEO GIỜ CHỨ KHÔNG PHẢI LƯỚI THẺ
// Lưới thẻ là ngôn ngữ của kho nội dung: thứ gì cũng ngang hàng, xem lúc nào cũng được. Một đêm
// nhạc thì không như vậy — 21:00 hôm nay khác 21:00 ngày mai, và bỏ lỡ là mất. Trục tổ chức đúng
// của trang chủ vì thế là THỜI GIAN. Khối này đọc như một tờ lịch phát sóng: mốc giờ chạy dọc bên
// trái, buổi diễn nằm bên phải.
//
// ĐÃ SỬA MỘT KHẲNG ĐỊNH KHÔNG NGUỒN: bản trước của chú thích này viết "chương trình phòng trà thật
// diễn ra 21:00–23:30" như một dữ kiện. Nó KHÔNG có nguồn. Nguồn duy nhất tra được lại nói
// 20:00–22:30, và chính nguồn đó là blog SEO độ tin cậy thấp. Vì đây là dữ kiện CHỊU LỰC của cả
// cấu trúc trang, nên cách đúng là không khẳng định khung giờ nào cả: `gomTheoGio` dưới đây gom
// theo giờ CÓ THẬT trong dữ liệu, nên trang tự đúng với lịch thật dù khung giờ là gì.
// Muốn có con số để viết vào tài liệu thì lấy phân bố `scheduledStart` từ DB của chính dự án — dữ
// liệu đội đã sở hữu — chứ đừng trích blog.
//
// NĂM TRẠNG THÁI (đặc tả §2) — khối này tự lo cả năm, không đẩy cho trang cha:
//   đang tải · trống (kèm lý do + lối đi) · lỗi (kèm việc làm được) · có dữ liệu ·
//   có dữ liệu nhưng là tin xấu (hết vé / huỷ / dời — xử lý ở DongBuoiDien.jsx).
//
// DỮ LIỆU: dùng lại mảng `events` mà HomePage đã tải, không gọi API riêng. Mọi chữ đều truy được
// về một trường thật (đặc tả §1); thiếu trường nào thì ẩn dòng đó, không có chữ thay thế.
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowRight, CalendarX2, RefreshCw, Bell } from 'lucide-react'
import DongBuoiDien from './DongBuoiDien'
import Skeleton from '../shared/Skeleton'

// Gom các buổi diễn vào từng KHUNG GIỜ TRÒN. Một đêm phòng trà không cần độ phân giải tới từng
// phút — người xem nghĩ theo "khoảng chín giờ", không theo "20:47".
const gomTheoGio = (ds) => {
  const theoGio = new Map()
  for (const ev of ds) {
    const t = dayjs(ev.start_date)
    if (!t.isValid()) continue
    const gio = t.hour()
    if (!theoGio.has(gio)) theoGio.set(gio, [])
    theoGio.get(gio).push(ev)
  }
  return [...theoGio.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gio, dsBuoi]) => ({
      gio,
      nhan: `${String(gio).padStart(2, '0')}:00`,
      buoi: dsBuoi.sort((a, b) => dayjs(a.start_date).valueOf() - dayjs(b.start_date).valueOf()),
    }))
}

// `demGanNhat` = { nhan, ngay, soBuoi } của đêm diễn gần nhất SAU hôm nay, hoặc null nếu không còn
// đêm nào. Trang cha tính rồi truyền xuống chứ khối này không tự gọi API: dữ liệu đó vốn đã nằm sẵn
// trong mảng buổi diễn mà trang đã tải, nên gọi thêm một lượt nữa là tốn công vô ích.
// `homNay` = ngày hôm nay viết gọn, để câu thông báo gọi đúng tên phạm vi đang lọc (luật NN/g).
const ChuongTrinhDemNay = ({
  events, dangTai = false, loi = false, onThuLai, daDangNhap = false,
  demGanNhat = null, homNay = null,
}) => {
  // TRẠNG THÁI 1 — ĐANG TẢI. Khung xương giữ đúng hình dạng thật (cột mốc giờ + hàng buổi diễn)
  // để khi dữ liệu về, trang không nhảy.
  if (dangTai) {
    return (
      <div className="space-y-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="grid grid-cols-[64px_1fr] sm:grid-cols-[96px_1fr] gap-4 sm:gap-8">
            <Skeleton className="h-6 w-14" />
            <div className="space-y-5">
              {[...Array(2)].map((__, j) => (
                <div key={j} className="grid grid-cols-[88px_1fr] sm:grid-cols-[132px_1fr] gap-4 sm:gap-6">
                  <Skeleton className="aspect-[4/3] rounded-md" />
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // TRẠNG THÁI 2 — LỖI. Nói người dùng LÀM ĐƯỢC GÌ, không in mã lỗi.
  if (loi) {
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center">
        <p className="font-semibold text-ink mb-1">Chưa tải được chương trình đêm nay.</p>
        <p className="text-sm text-ink-soft leading-relaxed mb-5">
          Đường truyền có thể đang trục trặc. Bạn thử tải lại, hoặc xem toàn bộ lịch diễn.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {onThuLai && (
            <button onClick={onThuLai}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover transition-colors">
              <RefreshCw size={15} /> Thử lại
            </button>
          )}
          <Link to="/shows"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-line text-ink-soft text-sm font-semibold hover:border-brand hover:text-ink transition-colors">
            Xem tất cả lịch diễn <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    )
  }

  const khung = gomTheoGio(events ?? [])

  // TRẠNG THÁI 3 — TRỐNG. Có HAI kiểu trống khác nhau, và chúng đòi hai CỠ khác nhau.
  //
  // VÌ SAO TÁCH LÀM HAI (đây là chỗ bản trước sai):
  // Shopify Polaris nói khối trống cỡ lớn có minh hoạ "intended for use when a full page in the
  // admin is empty, and not for individual elements or areas in the interface".
  // ⚠ CÂU POLARIS NÀY CHƯA KIỂM ĐƯỢC TOÀN VĂN (trang trả 301, chỉ đọc qua tóm tắt tìm kiếm) — giữ
  // nó ở mức tín hiệu củng cố thôi; luật chịu lực thật là câu của Carbon ngay dưới. Dải "đêm nay" chỉ
  // là MỘT KHU VỰC của trang; ngay bên dưới nó là "những đêm sắp tới" vẫn đầy dữ liệu. Dùng khối
  // lớn ở đây là đem cỡ của trang-trống-hẳn áp cho một dải — và đó chính là cái "lỗ thủng" giữa
  // trang mà người dùng nhìn thấy.
  //
  // IBM Carbon phát biểu vấn đề chuẩn hơn bất kỳ con số chiều cao nào: "The call to action should
  // remain in the same location whether an area is populated or empty." Luật không phải "cao bao
  // nhiêu px" mà là ĐỪNG ĐỂ BỐ CỤC NHẢY. Nên khi trống, dải này co về một dòng thông báo, và phần
  // những đêm sắp tới dâng lên lấp chỗ — bằng DỮ LIỆU THẬT, không bằng nội dung độn.
  //
  // NN/g: trạng thái trống phải nêu rõ PHẠM VI đang lọc ("There are no records to display for the
  // selected date range"), không nói trống chung chung. Nên câu dưới đây gọi thẳng tên ngày hôm nay.
  //
  // WCAG 2.2 SC 4.1.3 (Status Messages, mức AA) liệt kê đích danh "No results returned" là status
  // message: phải báo cho trình đọc màn hình mà KHÔNG cướp tiêu điểm. `role="status"` làm đúng việc
  // đó (ngầm định aria-live="polite" + aria-atomic="true").
  if (khung.length === 0) {
    // KIỂU A — đêm nay trống NHƯNG những ngày tới vẫn có diễn. Đây là kiểu THƯỜNG GẶP, không phải
    // ngoại lệ: phòng trà độc lập không diễn hằng đêm. Nó không phải tin xấu, chỉ là lịch. Vì vậy
    // nó là MỘT DÒNG, không phải một cái hộp cao bằng nửa màn hình.
    //
    // Material Design cấm để người dùng đọc nhầm nội dung thay thế thành kết quả thật: phải "clearly
    // convey in a heading above the results that this content shouldn't be mistaken for a match to
    // actual query results". Ở đây ta KHÔNG đổ đêm của ngày khác vào dưới tiêu đề "Chương trình đêm
    // nay" — ta chỉ TRỎ xuống dải "Những đêm sắp tới", vốn đã có tiêu đề riêng và có mốc ngày trên
    // từng mục. Người dùng không thể nhầm ngày, vì ngày nằm ngay cạnh mỗi buổi diễn.
    if (demGanNhat) {
      return (
        <div role="status"
          className="rounded-xl border border-line bg-card px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-3">
          <CalendarX2 size={22} className="flex-shrink-0 text-ink-mute" strokeWidth={1.5} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-ink font-semibold">
              Đêm nay{homNay ? ` (${homNay})` : ''} chưa có buổi hòa nhạc nào mở bán.
            </p>

            {/* HÌNH DẠNG CÂU NÀY LẤY TỪ MỘT SẢN PHẨM THẬT, KHÔNG PHẢI TỰ NGHĨ.
                Tomorrow Theater (rạp chiếu độc lập) khi hôm nay không có suất nào thì viết nguyên văn:
                "There are no showtimes today. Go to Wed, Sep 23 for the next showtime."
                Ba chi tiết đáng học, và bản trước của tôi thiếu hai:
                  1. Xác nhận hôm nay trống — bản trước đã có.
                  2. GỌI ĐÍCH DANH ngày kế tiếp — bản trước đã có.
                  3. ĐỘNG TỪ HÀNH ĐỘNG NẰM TRONG LIÊN KẾT, và chính cái NGÀY là thứ bấm được
                     ("Go to Wed, Sep 23"). Bản trước để ngày là chữ chết rồi treo một liên kết
                     riêng "Xem những đêm sắp tới" ở cuối dòng — mắt người đọc dừng ở cái ngày,
                     nhưng thứ bấm được lại nằm chỗ khác, và hai liên kết cùng trỏ một đích là
                     thừa với trình đọc màn hình.
                Nên giờ chỉ còn MỘT liên kết, và nó chứa cả việc cần làm lẫn ngày cần tới.

                VÀ ĐÂY LÀ PHẦN PHẢI NÓI RÕ, KẺO NGƯỜI ĐỌC SAU TƯỞNG CHUYỆN ĐÃ NGÃ NGŨ:
                khảo sát 9 sàn vé (Bandsintown, Songkick, DICE, Resident Advisor, Eventbrite,
                Ticketmaster, Luma, Meetup, Ticketbox) KHÔNG tìm được sàn nào dùng mẫu hai lớp này.
                Bằng chứng xác minh trực tiếp DUY NHẤT trong đúng ngành vé lại đi NGƯỢC LẠI: widget
                chính thức của Songkick khi trống chỉ nói một lớp — "No upcoming concerts or
                festivals." — rồi sang thẳng nút Subscribe, không hẹn ngày nào cả.
                Vì sao vẫn chọn mẫu hai lớp ở đây: Songkick phục vụ hàng trăm nghìn nghệ sĩ, nên
                "đêm gần nhất" của một nghệ sĩ có thể là tám tháng nữa — nói ra vô nghĩa. Phòng trà
                thì giống rạp chiếu hơn: cùng một hệ thống, lịch đều, đêm gần nhất thường cách vài
                ngày, và truy vấn đó rẻ vì dữ liệu đã nằm sẵn trong mảng trang vừa tải.
                Nói cho đúng: đây là lựa chọn CÓ CHỦ ĐÍCH, dựa trên tiền lệ của một ngành liền kề
                cộng hình dạng dữ liệu của chính sản phẩm này — KHÔNG phải "chuẩn ngành bán vé".
                Gọi nó là chuẩn ngành là nói quá so với bằng chứng.
                Báo cáo đầy đủ: reports/Trạng thái trống trang chủ phòng trà.md

                Dùng thẻ <a> neo thật chứ không phải cuộn bằng JS: neo chạy cả khi JS lỗi, và trình
                duyệt tự lo phần `prefers-reduced-motion` cho hành vi cuộn. */}
            <p className="text-sm text-ink-soft mt-1">
              <a href="#dem-sap-toi"
                className="inline-flex items-center gap-1.5 min-h-[44px] font-semibold text-brand-text hover:underline">
                Sang {demGanNhat.nhan}
                <span className="tabular-nums">· {demGanNhat.ngay}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              {demGanNhat.soBuoi > 1
                ? <span className="ml-1">để xem <span className="tabular-nums">{demGanNhat.soBuoi}</span> buổi diễn gần nhất.</span>
                : <span className="ml-1">để xem buổi diễn gần nhất.</span>}
            </p>
          </div>
        </div>
      )
    }

    // KIỂU B — KHÔNG có đêm nào, cả đêm nay lẫn sắp tới. Đây mới đúng nghĩa "trang trống hẳn" của
    // Polaris, nên mới xứng đáng một khối lớn canh giữa. Atlassian cho con số bề ngang duy nhất có
    // nguồn: bản wide rộng 464px — `max-w-[464px]` lấy đúng con số đó.
    //
    // Apple (WWDC22) cho công thức nội dung: nói cái đang trống VÀ nói ĐIỀU KIỆN để hết trống
    // ("Save episodes you want to listen to later, and they'll show up here"). Nên dòng thứ hai ở
    // đây không phải lời an ủi suông, mà là một cơ chế CÓ THẬT trong hệ thống: theo dõi một phòng
    // trà thì khi Admin duyệt buổi diễn mới của họ, backend gửi thông báo NewEvent cho toàn bộ
    // người theo dõi (ReviewShowCommandHandler — đã tra, không phải lời hứa suông).
    return (
      <div role="status" className="rounded-xl border border-line bg-card px-6 py-10 text-center">
        <div className="max-w-[464px] mx-auto">
          <CalendarX2 size={26} className="mx-auto text-ink-mute mb-3" strokeWidth={1.5} aria-hidden="true" />
          <p className="font-semibold text-ink mb-1">Chưa có đêm diễn nào đang mở bán.</p>
          <p className="text-sm text-ink-soft leading-relaxed mb-5">
            Các phòng trà thường công bố lịch trước vài ngày. Theo dõi một phòng trà thì khi họ mở
            đêm mới, bạn sẽ nhận được thông báo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/lounges"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover transition-colors">
              <Bell size={15} aria-hidden="true" /> Duyệt phòng trà để theo dõi
            </Link>
            <Link to="/shows"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-line text-ink-soft text-sm font-semibold hover:border-brand hover:text-ink transition-colors">
              Xem toàn bộ lịch diễn
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // TRẠNG THÁI 4 — CÓ DỮ LIỆU.
  // `<ol>` chứ không phải `<div>`: đây là một chuỗi CÓ THỨ TỰ theo thời gian, và thứ tự đó là
  // thông tin. Trình đọc màn hình công bố "danh sách 3 mục" thay vì một đống khối rời.
  return (
    <ol className="space-y-9">
      {khung.map(({ gio, nhan, buoi }) => (
        <li key={gio} className="grid grid-cols-[64px_1fr] sm:grid-cols-[96px_1fr] gap-4 sm:gap-8">
          {/* Mốc giờ: chữ lớn, tabular-nums, dính lại khi cuộn để luôn biết đang ở khung giờ nào.
              `aria-hidden` KHÔNG dùng ở đây — giờ là thông tin thật, không phải trang trí. */}
          <p className="font-display text-2xl sm:text-3xl font-semibold tabular-nums text-brand-text sticky top-24 self-start">
            {nhan}
          </p>
          <div>
            {buoi.map((ev) => (
              // `daCoVe` lay tu chinh du lieu buoi dien neu backend co tra; khong co thi de false.
              // KHONG doan: doan sai se moi mua lai ve nguoi da co, hoac giau nut mua cua nguoi chua co.
              <DongBuoiDien key={ev.id} ev={ev} daDangNhap={daDangNhap} daCoVe={Boolean(ev.userHasTicket)} />
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

export default ChuongTrinhDemNay
