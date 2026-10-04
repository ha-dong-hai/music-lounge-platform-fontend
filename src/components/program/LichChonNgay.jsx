// src/components/program/LichChonNgay.jsx
//
// MỘT Ô LỊCH chọn được cả MỘT NGÀY lẫn KHOẢNG NGÀY (03/10/2026). Thay hai ô <input type="date"> "Từ ngày / Đến ngày":
// chủ dự án — "2 ô chọn ngày quá phiền". Hai ô riêng bắt người ta chọn hai lần kể cả khi chỉ muốn một tối, và lịch gốc của
// trình duyệt mỗi nơi một kiểu, không thấy được ngày nào có diễn.
//
// - HÀNH VI lấy từ thư viện react-day-picker (nền của Calendar trong shadcn/ui): lưới ngày dạng grid ARIA, phím mũi tên /
//   PageUp / Home / End, nhãn đọc màn hình tiếng Việt có sẵn (locale vi). Không tự viết lưới lịch.
// - CÁCH BẤM tự quy định ở buocChonNgay (utils/boLocBuoiDien): bấm 1 ngày = đúng ngày đó; bấm ngày thứ hai = khoảng; bấm
//   tiếp = bắt đầu lại; bấm lại ngày đang chọn = bỏ. Mặc định của thư viện là kéo dài khoảng — xem chú thích ở hàm đó.
// - CHẤM VUÔNG dưới số = ngày có ít nhất một buổi khớp các bộ lọc khác (demLuaChon.ngayCoDien). Chỉ truyền khi số đếm
//   chính xác; không có thì không chấm (thà không chấm còn hơn chấm sai). Ngày trước hôm nay khoá: danh sách chỉ có buổi sắp diễn.
// - HÌNH THỨC theo DESIGN.md: góc vuông, mực trên giấy; ngày chọn là khối mực, khoảng giữa là nền lõm. Không nạp CSS mặc
//   định của thư viện (bo tròn, xanh dương) — mọi lớp đặt qua `classNames`.
import { DayPicker } from 'react-day-picker'
import { vi } from 'react-day-picker/locale'
import dayjs from 'dayjs'
import { buocChonNgay } from '../../utils/boLocBuoiDien'
import { khoaNgay } from '../../utils/ngayVietNam'
import { LOP } from './lopLich'


const LichChonNgay = ({ tu, den, onChon, ngayCoDien = null }) => {
  const homNay = dayjs().startOf('day').toDate()
  const chon = tu || den ? { from: tu ? dayjs(tu).toDate() : undefined, to: den ? dayjs(den).toDate() : undefined } : undefined
  return (
    <div>
      <DayPicker
        mode="range"
        locale={vi}
        weekStartsOn={1}
        selected={chon}
        defaultMonth={chon?.from ?? homNay}
        startMonth={homNay}
        disabled={{ before: homNay }}
        // Lấy NGÀY VỪA BẤM (đối số thứ hai) rồi tự tính bước chọn — bỏ qua khoảng thư viện tự gộp.
        onSelect={(_, ngayBam) => onChon(buocChonNgay({ tu, den }, khoaNgay(ngayBam)))}
        modifiers={ngayCoDien ? { coDien: (d) => ngayCoDien.has(khoaNgay(d)) } : undefined}
        modifiersClassNames={{ coDien: "[&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:w-1 [&>button]:after:h-1 [&>button]:after:bg-current" }}
        classNames={LOP}
      />
      <p className="mt-2 text-xs text-ink-mute">
        Bấm một ngày, hoặc bấm thêm ngày thứ hai để chọn khoảng.{ngayCoDien ? ' Ngày có chấm là ngày có buổi diễn.' : ''}
      </p>
    </div>
  )
}

export default LichChonNgay
