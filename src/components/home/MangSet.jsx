// src/components/home/MangSet.jsx
//
// MĂNG SÉT TRANG CHỦ — xem docs/design/DAC-TA-TRANG-CHU.md §4 mục 1.
//
// VÌ SAO KHÔNG PHẢI MỘT TẤM HERO LỚN KÈM KHẨU HIỆU
// "Hero căn giữa + tiêu đề lớn + nút chính" là bố cục mặc định của mọi trang đích, và là một trong
// các tell được nêu đích danh trong khảo sát 1.590 trang. Quan trọng hơn: khẩu hiệu không mang
// thông tin. Người vào đây cần biết **đêm nay có gì**, không cần được thuyết phục rằng âm nhạc hay.
//
// Thay vào đó là măng sét kiểu tờ chương trình: ngày hôm nay viết đầy đủ, rồi MỘT câu nói đúng
// thành phố đêm nay có bao nhiêu buổi diễn. Con số trong câu đó lấy từ dữ liệu thật đã tải, không
// phải con số minh hoạ (đặc tả §1) — không có dữ liệu thì câu đó không hiện.
import dayjs from 'dayjs'
import { thuVietHoa, ngayDayDu } from '../../utils/ngayVietNam'

const MangSet = ({ soBuoiDemNay = null, soPhongTra = null }) => {
  const homNay = dayjs()

  // Tên thứ viết hoa dùng hàm chung ở utils/ngayVietNam — khối "những đêm sắp tới" cũng in tên
  // thứ, và hai chỗ in khác kiểu nhau thì trang tự mâu thuẫn với chính nó. Hàm đó có bộ kiểm riêng.
  const thuHoa = thuVietHoa(homNay)

  return (
    <header className="pt-2 pb-8 sm:pb-10 border-b border-line-strong">
      {/* Dòng ngày: chữ nhỏ giãn ký tự, đúng quy ước nhãn/ngày của bố cục biên tập. */}
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-brand-text mb-4 tabular-nums">
        {thuHoa} · {ngayDayDu(homNay)}
      </p>

      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[0.95] text-balance text-ink max-w-3xl">
        Sài Gòn đêm nay hát gì
      </h1>

      {/* Câu dẫn. Chỉ hiện phần có SỐ THẬT; thiếu dữ liệu thì rút gọn chứ không bịa.
          Đây đúng chỗ mà bản demo hay độn số liệu cho đẹp — đặc tả §1 cấm việc đó. */}
      <p className="mt-5 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
        {soBuoiDemNay != null && soBuoiDemNay > 0 ? (
          <>
            Đêm nay có <strong className="text-ink font-semibold tabular-nums">{soBuoiDemNay}</strong> buổi diễn
            {soPhongTra != null && soPhongTra > 0 && (
              <> tại <strong className="text-ink font-semibold tabular-nums">{soPhongTra}</strong> phòng trà</>
            )}
            . Chương trình xếp theo giờ, đọc từ trên xuống như một tờ lịch diễn.
          </>
        ) : (
          <>Chương trình các phòng trà độc lập khắp thành phố, xếp theo giờ diễn.</>
        )}
      </p>
    </header>
  )
}

export default MangSet
