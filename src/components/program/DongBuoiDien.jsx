// src/components/program/DongBuoiDien.jsx
//
// MỘT DÒNG BUỔI DIỄN — đơn vị dùng chung cho mọi danh sách buổi diễn ngoài trang chủ: trang Buổi diễn (tìm và lọc),
// lịch diễn của một phòng trà, buổi diễn tương tự, danh sách yêu thích. Một kiểu dòng để bốn nơi không vẽ bốn kiểu.
//
// Thay cho ShowCard cũ (thẻ bo tròn, rê chuột 0,6 giây thì cả thẻ phình thành áp phích có lớp chuyển sắc, nút yêu
// thích vô hình trên điện thoại) và ShowCarousel (băng chuyền cuộn ngang).
//
// MỖI DÒNG TRẢ LỜI NĂM CÂU HỎI THEO THỨ TỰ NGƯỜI TA HỎI: khi nào → diễn gì, ai hát → ở đâu → bao nhiêu tiền → đi tiếp.
// (Đọc DICE, Eventbrite, Ticketmaster 30/09/2026: không trang nào in đủ cả ngày, giờ, địa điểm, giá trên một dòng —
// ở đây in đủ, vì đó là bốn thứ quyết định có bấm vào hay không.)
//
// - Cả dòng bấm được: liên kết ở tên buổi trải kín dòng (một đích cho bàn phím và trình đọc màn hình). Nút Lưu nằm
//   TRÊN lớp liên kết (relative z-10) nên vẫn bấm riêng được.
// - Ảnh là trang trí ở đây (alt rỗng): tên buổi đã là chữ ngay bên cạnh. Không có ảnh thì in ô "Chưa có ảnh" của trang.
// - Không nhãn khan hiếm ("sắp hết", "bán chạy"): cổng kiem-ap-luc cấm, và API không trả số liệu nào để nói vậy.
// - `hienPhongTra`: tắt ở trang của chính phòng trà (in lại tên phòng trà ở mọi dòng là thừa).
// - `onDoiLuu`: có thì in nút Lưu / Đã lưu (chỉ truyền khi đã đăng nhập — chưa đăng nhập bấm vào chỉ nhận một lỗi).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'
import { ngayTrongLich, gioTrongNgay } from '../../utils/ngayVietNam'
import { formatMinPrice } from '../../utils/formatPrice'

const HINH_THUC = { Online: 'Trực tuyến', Hybrid: 'Tại chỗ và trực tuyến' }

const giaIn = (b) => {
  const gia = formatMinPrice(b)
  return b.minPrice != null && b.maxPrice != null && b.maxPrice > b.minPrice ? `từ ${gia}` : gia
}

const DongBuoiDien = ({ b, hienPhongTra = true, hienAnh = true, daLuu = false, dangLuu = false, onDoiLuu }) => {
  const [anhHong, setAnhHong] = useState(false)
  const nguoiHat = b.performerNames ?? []
  const noi = [b.loungeName, b.loungeDistrict || b.loungeCity].filter(Boolean).join(' · ')
  const phu = [...(b.genres ?? []).map((g) => g.name), HINH_THUC[b.format]].filter(Boolean)
  const dangDien = b.status === 'Ongoing'

  return (
    <li className={`relative grid gap-x-6 gap-y-1.5 py-5 border-t border-ink/20 first:border-t-0 hover:bg-card transition-colors ${hienAnh ? 'grid-cols-[5rem_minmax(0,1fr)] sm:grid-cols-[7.5rem_minmax(0,1fr)] lg:grid-cols-[7.5rem_13rem_minmax(0,1fr)_auto]' : 'md:grid-cols-[14rem_minmax(0,1fr)_auto]'} lg:items-center`}>
      {hienAnh && (
        <div className="row-span-3 lg:row-span-1 aspect-[4/3] w-full self-start overflow-hidden border border-ink bg-board">
          {b.coverImageUrl && !anhHong
            ? <img src={b.coverImageUrl} alt="" loading="lazy" width="240" height="180" onError={() => setAnhHong(true)} className="w-full h-full object-cover" />
            : <CoverFallback />}
        </div>
      )}
      <p className="font-mono text-sm text-ink whitespace-nowrap">
        {dangDien
          ? <span className="inline-flex items-center px-2 min-h-[24px] bg-ember text-board font-sans font-semibold text-xs">Đang diễn</span>
          : b.status === 'Ended' ? <span className="text-ink-mute">Đã diễn {ngayTrongLich(b.scheduledStart)}</span>
            : <>{ngayTrongLich(b.scheduledStart)}<span className="text-ink-mute"> · </span>{gioTrongNgay(b.scheduledStart)}</>}
      </p>
      <div className="min-w-0">
        <h3 className="font-display font-normal text-2xl leading-tight tracking-normal break-words">
          <Link to={`/shows/${b.id}`} className="after:absolute after:inset-0 hover:underline underline-offset-4 decoration-1">{b.name}</Link>
        </h3>
        {nguoiHat.length > 0 && <p className="text-ink-soft mt-1">{nguoiHat.join(', ')}</p>}
        {hienPhongTra && noi && <p className="text-ink mt-0.5">{noi}</p>}
        {phu.length > 0 && <p className="text-sm text-ink-mute mt-0.5">{phu.join(' · ')}</p>}
      </div>
      <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 lg:justify-end ${hienAnh ? '' : 'md:justify-end'}`}>
        <span className="font-mono whitespace-nowrap">{giaIn(b)}</span>
        <span className="font-semibold underline underline-offset-4 decoration-2 whitespace-nowrap" aria-hidden="true">
          {dangDien ? 'Xem buổi diễn' : b.status === 'Ended' ? 'Xem lại trang buổi diễn' : 'Xem và đặt'}
        </span>
        {onDoiLuu && (
          <button type="button" onClick={() => onDoiLuu(b)} disabled={dangLuu} aria-pressed={daLuu}
            aria-label={daLuu ? `Bỏ lưu ${b.name}` : `Lưu ${b.name}`}
            className="relative z-10 inline-flex items-center gap-1.5 min-h-[44px] px-3 border border-ink text-sm font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60">
            <Heart size={16} className={daLuu ? 'fill-current' : ''} aria-hidden="true" /> {daLuu ? 'Đã lưu' : 'Lưu'}
          </button>
        )}
      </div>
    </li>
  )
}

export default DongBuoiDien
