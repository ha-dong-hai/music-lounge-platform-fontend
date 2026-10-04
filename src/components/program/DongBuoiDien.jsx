// src/components/program/DongBuoiDien.jsx
//
// MỘT DÒNG BUỔI DIỄN — đơn vị dùng chung cho mọi danh sách buổi diễn ngoài trang chủ: trang Buổi diễn (tìm và lọc),
// lịch diễn của một phòng trà, buổi diễn tương tự, danh sách yêu thích. Một kiểu dòng để bốn nơi không vẽ bốn kiểu.
//
// Thay cho ShowCard cũ (thẻ bo tròn, rê chuột 0,6 giây thì cả thẻ phình thành áp phích có lớp chuyển sắc, nút yêu
// thích vô hình trên điện thoại) và ShowCarousel (băng chuyền cuộn ngang).
//
// BỐ CỤC (02/10/2026, chủ dự án chụp màn /shows): bản cũ có cột ngày riêng 13rem + lg:items-center → ảnh ở +20px,
// ngày +80px, tên +20px, cuống +66px (đo bằng getBoundingClientRect), tên bị bóp còn 426px và gãy "Thành phố Hồ Chí /
// Minh". Nay ngày in NGAY TRÊN tên (như tờ chương trình), ảnh + chữ bám mép trên, cụm cuống + Lưu căn giữa ở cột phải;
// nút Lưu 48px viền 2px cho bằng cuống đặt vé.
// LỀ NGANG px-3/sm:px-4 (03/10/2026): hàng có nền khi rê chuột (hover:bg-card) mà không có lề ngang thì ảnh chạm mép trái,
// cuống Đặt vé chạm mép phải của nền — chủ dự án: "nằm sát rạt". Hàng nào đổi nền khi rê đều phải có lề ngang.
// Điện thoại: cụm cuống + Lưu xuống dòng riêng trải HAI cột (col-span-2) — cuống rộng ~250px, cột chữ cạnh ảnh 80px chỉ còn
// ~230px ở màn 390 (đo 03/10: cuống tràn 8px ra ngoài hàng).
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
// - `anhDuPhong`: ảnh thật dùng khi buổi chưa có ảnh bìa (trang phòng trà truyền ảnh của chính phòng trà).
// - `onDoiLuu`: có thì in nút Lưu / Đã lưu (chỉ truyền khi đã đăng nhập — chưa đăng nhập bấm vào chỉ nhận một lỗi).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'
import CuongDatVe from './CuongDatVe'
import { ngayTrongLich, khungGio } from '../../utils/ngayVietNam'
import { formatMinPrice } from '../../utils/formatPrice'
import NhanDangDien from './NhanDangDien'
import { useTranslation } from 'react-i18next'
import { k, td } from '../../i18n/k'

const HINH_THUC = { Online: k('Trực tuyến'), Hybrid: k('Tại chỗ và trực tuyến') }

const giaIn = (b) => {
  const gia = formatMinPrice(b)
  return b.minPrice != null && b.maxPrice != null && b.maxPrice > b.minPrice ? td('từ {{x}}', { x: gia }) : gia
}

const DongBuoiDien = ({ b, hienPhongTra = true, hienAnh = true, anhDuPhong = null, daLuu = false, dangLuu = false, onDoiLuu }) => {
  const { t } = useTranslation()
  const [anhHong, setAnhHong] = useState(false)
  const nguoiHat = b.performerNames ?? []
  const noi = [b.loungeName, b.loungeDistrict || b.loungeCity].filter(Boolean).join(' · ')
  const phu = [...(b.genres ?? []).map((g) => g.name), HINH_THUC[b.format] && t(HINH_THUC[b.format])].filter(Boolean)
  const dangDien = b.status === 'Ongoing'

  return (
    <li className={`group/dong relative grid gap-x-6 gap-y-1.5 py-5 px-3 sm:px-4 border-t border-ink/20 first:border-t-0 hover:bg-card transition-colors ${hienAnh ? 'grid-cols-[5rem_minmax(0,1fr)] sm:grid-cols-[7.5rem_minmax(0,1fr)] lg:grid-cols-[7.5rem_minmax(0,1fr)_auto]' : 'md:grid-cols-[14rem_minmax(0,1fr)_auto]'} items-start`}>
      {hienAnh && (
        <div className="row-span-3 lg:row-span-2 aspect-[4/3] w-full self-start overflow-hidden border border-ink bg-board">
          {(b.coverImageUrl || anhDuPhong) && !anhHong
            ? <img src={b.coverImageUrl || anhDuPhong} alt="" loading="lazy" width="240" height="180" onError={() => setAnhHong(true)} className="w-full h-full object-cover" />
            : <CoverFallback />}
        </div>
      )}
      <p className="font-mono text-sm text-ink whitespace-nowrap">
        {/* MLACP-633: mọi trạng thái đều in khung giờ "bắt đầu – kết thúc" — kể cả đang diễn, để khách biết buổi kéo tới mấy giờ. */}
        {dangDien
          ? <><NhanDangDien co="nho" /><span className="block mt-1">{khungGio(b.scheduledStart, b.effectiveEnd)}</span></>
          : b.status === 'Ended' ? <span className="text-ink-mute">{t('Đã diễn {{x}}', { x: ngayTrongLich(b.scheduledStart) })} · {khungGio(b.scheduledStart, b.effectiveEnd)}</span>
            : <>{ngayTrongLich(b.scheduledStart)}<span className="text-ink-mute"> · </span>{khungGio(b.scheduledStart, b.effectiveEnd)}</>}
      </p>
      <div className="min-w-0">
        <h3 className="font-display font-normal text-2xl leading-tight tracking-normal break-words">
          <Link to={`/shows/${b.id}`} className="after:absolute after:inset-0">{b.name}</Link>
        </h3>
        {nguoiHat.length > 0 && <p className="text-ink-soft mt-1">{nguoiHat.join(', ')}</p>}
        {hienPhongTra && noi && <p className="text-ink mt-0.5">{noi}</p>}
        {phu.length > 0 && <p className="text-sm text-ink-mute mt-0.5">{phu.join(' · ')}</p>}
      </div>
      <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-end ${hienAnh ? 'col-span-2 sm:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:self-center' : 'md:justify-end'}`}>
        {/* Giá + hành động in thành MỘT cuống vé (CuongDatVe) thay chữ gạch dưới "Xem và đặt" — 02/10/2026. Đã diễn hoặc đang diễn thì
            không in giá: buổi đã bắt đầu, câu hỏi lúc này là "đang diễn" chứ không phải giá — và cuống có giá + nhãn
            "Xem buổi diễn" tràn ngang màn 390px (đo 02/10: scrollWidth 414). */}
        <CuongDatVe gia={b.status === 'Ended' || dangDien ? null : giaIn(b)} trangThai={dangDien ? 'DangDien' : b.status === 'Ended' ? 'DaDien' : 'MoBan'} />
        {/* Lưu là hành động PHỤ → nút nhấn mạnh thấp: không viền, không lật khối mực (Carbon: hành động phụ trong danh
            sách dùng ghost). Bản trước là khối viền 2px cách cuống 12px, rê chuột lật đen ngay cạnh khối mực "Đặt vé" —
            chủ dự án 02/10: "sát rạt, xấu". Rê chuột: trái tim tô đầy + chữ đậm màu; đã lưu thì tim đặc sẵn. */}
        {onDoiLuu && (
          <button type="button" onClick={() => onDoiLuu(b)} disabled={dangLuu} aria-pressed={daLuu}
            aria-label={daLuu ? t('Bỏ lưu {{x}}', { x: b.name }) : t('Lưu {{x}}', { x: b.name })}
            className="group/luu relative z-10 inline-flex items-center gap-2 min-h-[48px] px-2 text-sm font-semibold text-ink-soft hover:text-ink transition-colors disabled:opacity-60">
            <Heart size={20} strokeWidth={1.75} aria-hidden="true"
              className={`transition-[fill,transform] duration-300 motion-safe:group-hover/luu:scale-110 ${daLuu ? 'fill-current text-ink' : 'group-hover/luu:fill-current'}`} />
            {daLuu ? t('Đã lưu') : t('Lưu')}
          </button>
        )}
      </div>
    </li>
  )
}

export default DongBuoiDien
