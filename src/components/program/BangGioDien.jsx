// src/components/program/BangGioDien.jsx
//
// BẢNG GIỜ DIỄN ĐÊM NAY — khối trung tâm của trang chủ (chủ dự án chốt 30/09: "kết hợp" hai ảnh mẫu Stitch —
// bảng lật chữ + hộp đèn). Hợp đồng hướng: .impeccable/surfaces/src-pages-home-homepage-jsx.md.
//
// ĐƠN VỊ LÀ PHÒNG TRÀ, không phải buổi diễn (kiến trúc venue-first 23/09): mỗi dòng một phòng trà, xếp theo giờ lên
// sân khấu của buổi SỚM NHẤT đêm nay ở đó. Phòng trà có hai buổi thì dòng ghi "+1 buổi nữa" chứ không tách hai dòng.
//
// TƯƠNG TÁC CHỮ KÝ: rê chuột có độ trễ ý định (thiết bị có chuột) hoặc bấm / Enter (cảm ứng, bàn phím) vào một dòng thì dòng đó mở
// thành HỘP ĐÈN sáng — ảnh không gian lớn (nếu có), line-up, giá kèm câu nói rõ giá gồm gì, nút Đặt chỗ, và mọi buổi
// đêm nay của phòng trà đó. Dấu mộc giữ hộ nằm lấn mép bảng trên nền giấy (HomePage), không nằm trong hộp đèn.
// Dòng đầu mở sẵn để khung nhìn đầu có ảnh thật.
//
// CỘT TRẠNG THÁI chỉ in thứ dữ liệu có thật: "Đang diễn" (status Ongoing, màu than hồng — màu này dành riêng cho nó)
// và "Mở bán". KHÔNG có "Đổi giờ" / "Hết vé" như ảnh mẫu: LoungeShowListItemDto không có trường giờ gốc hay tồn kho
// (OfflineQuota là SỨC CHỨA, không phải số vé còn — đem trừ ra là bịa số). Có trường thì mới in.
//
// NĂM TRẠNG THÁI (nguyên tắc bất biến số 2): đang tải · lỗi · trống · có dữ liệu · tin xấu. Trống thì bảng VẪN IN —
// một dòng nói thật đêm nay chưa phòng trà nào lên đèn, kèm các buổi của đêm gần nhất: không bao giờ để trống trơn.
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, LogIn, RotateCcw } from 'lucide-react'
import KyTuLat from './KyTuLat'
import CoverFallback from '../shared/CoverFallback'
import { gioTrongNgay } from '../../utils/ngayVietNam'

const CAU_GIA = 'Giá vé vào cửa. Phòng trà có thể yêu cầu gọi thêm đồ uống — xem trang buổi diễn.'

const NutDatCho = ({ showId, daDangNhap, lon = false }) => (
  <div className="flex flex-col items-stretch gap-1">
    <Link
      to={`/shows/${showId}`}
      className={`inline-flex items-center justify-center font-display bg-stock text-ink hover:bg-lamp transition-colors ${lon ? 'min-h-[52px] px-7 text-2xl' : 'min-h-[44px] px-5 text-xl'}`}
    >
      Đặt chỗ
    </Link>
    {!daDangNhap && (
      <span className="inline-flex items-center justify-center gap-1 text-[11px] text-cream-mute">
        <LogIn size={11} aria-hidden="true" /> Cần đăng nhập để đặt
      </span>
    )}
  </div>
)

const DongBang = ({ dong, mo, onMo, onRoi, chiSo, daDangNhap }) => {
  const giamChuyenDong = useReducedMotion()
  const { buoi } = dong
  const nguoiHat = buoi.performers?.length ? buoi.performers.join(', ') : 'Line-up đang cập nhật'
  const idChiTiet = `hop-den-${buoi.id}`
  const cacBuoi = dong.tatCa ?? [buoi]
  return (
    <li
      className={`border ${dong.dangDien ? 'border-ember' : 'border-cream/10'} ${mo ? 'bg-espresso shadow-glow' : 'bg-espresso/40 hover:bg-espresso/70'} transition-colors`}
      onMouseEnter={() => onMo(dong.khoa, 'chuot')}
      onMouseLeave={onRoi}
    >
      {/* Máy tính: một hàng 7 cột như bảng khởi hành. Điện thoại: giờ + trạng thái trên, tên phòng trà cả dòng giữa,
          người hát + nút dưới — không ép tên phòng trà vào cột hẹp (đo 30/09: tên bị cắt còn "P."). */}
      <div className="grid grid-cols-[1fr_auto] md:grid-cols-[7.5rem_3.5rem_minmax(0,1.4fr)_minmax(0,1.2fr)_7.5rem_7rem_9rem] items-center gap-x-4 gap-y-2 px-3 sm:px-4 py-3">
        <KyTuLat chu={gioTrongNgay(buoi.start_date)} tone={dong.dangDien ? 'ember' : 'lamp'} treMs={chiSo * 120} className="text-xl sm:text-2xl" />

        <div className="hidden md:block w-14 h-14 overflow-hidden bg-board">
          {dong.anh ? <img src={dong.anh} alt="" loading="lazy" className="w-full h-full object-cover" /> : <CoverFallback />}
        </div>

        <button
          type="button"
          onClick={() => onMo(dong.khoa, 'bam')}
          aria-expanded={mo}
          aria-controls={idChiTiet}
          className="order-3 md:order-none col-span-2 md:col-span-1 text-left min-w-0 focus-visible:outline-lamp"
        >
          {/* Dòng đang mở thì tên phòng trà "lên đèn": quầng sáng màu ánh đèn quanh chữ — thứ phân biệt hộp đèn bật/tắt. */}
          <span className={`block font-display text-3xl text-lamp leading-none md:truncate ${mo ? '[text-shadow:0_0_18px_rgb(255_233_168/0.55)]' : ''}`}>{dong.tenPhongTra}</span>
          {dong.soBuoiThem > 0 && (
            <span className="block text-xs text-cream-mute mt-1">+{dong.soBuoiThem} buổi nữa đêm nay</span>
          )}
        </button>

        <p className="order-4 md:order-none col-span-2 md:col-span-1 text-sm text-cream md:truncate" title={nguoiHat}>{nguoiHat}</p>

        <p className="hidden md:flex items-center gap-1 text-sm text-cream-mute">
          <MapPin size={13} aria-hidden="true" /> {buoi.district || buoi.province || '—'}
        </p>

        {/* Trạng thái là NHÃN khối chữ lớn chứ không phải ô chữ lật: ở cỡ nhỏ vạch ngang giữa ô cắt ngang chữ, khó đọc. */}
        <div className="order-2 md:order-none justify-self-end md:justify-self-start">
          {dong.dangDien
            ? <span className="inline-flex items-center px-2.5 min-h-[30px] bg-ember text-board font-display text-lg leading-none">Đang diễn</span>
            : <span className="inline-flex items-center px-2.5 min-h-[30px] border border-lamp/60 text-lamp font-display text-lg leading-none">Mở bán</span>}
        </div>

        {/* Dòng đang mở thì hộp đèn đã có nút đặt chỗ lớn cho đúng buổi này — nút ở dòng thành bản lặp. Máy tính giữ
            chỗ (invisible) để cột không co giật khi mở/đóng; điện thoại bỏ hẳn cho đỡ dài. */}
        <div className={`order-5 md:order-none col-span-2 md:col-span-1 md:justify-self-end ${mo ? 'hidden md:block md:invisible' : ''}`} aria-hidden={mo || undefined}>
          <NutDatCho showId={buoi.id} daDangNhap={daDangNhap} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mo && (
          <motion.div
            id={idChiTiet}
            key="hop-den"
            initial={giamChuyenDong ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={giamChuyenDong ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Có ảnh không gian thật thì ảnh chiếm nửa hộp đèn. KHÔNG có ảnh thì bỏ hẳn ô ảnh: một tấm khuông nhạc
                16:9 chiếm nửa khung nhìn đầu là khoảng chết (người duyệt 30/09) — hộp đèn khi đó chỉ còn thông tin. */}
            <div className={`grid gap-6 px-3 sm:px-4 pb-5 ${dong.anh ? 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]' : 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:pl-[14rem]'}`}>
              {dong.anh && (
                <div className="relative aspect-[16/9] bg-board overflow-hidden">
                  <img src={dong.anh} alt={`Không gian ${dong.tenPhongTra}`} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-4 text-cream">
                <p className="text-lg text-cream">{buoi.title}</p>
                <div>
                  <p className="text-xs text-cream-mute mb-1.5">Người hát theo thứ tự lên sân khấu</p>
                  <ol className="space-y-1">
                    {(buoi.performers?.length ? buoi.performers : ['Line-up đang cập nhật']).map((ten, i) => (
                      <li key={ten} className="flex items-baseline gap-2">
                        <span className="font-mono text-xs text-brand-on-dark">{i + 1}</span>
                        <span>{ten}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="font-display text-3xl text-lamp leading-none [text-shadow:0_0_18px_rgb(255_233_168/0.45)]">{buoi.price}</p>
                  <p className="text-sm text-cream-mute mt-1.5 max-w-prose">{CAU_GIA}</p>
                </div>
                {/* ĐÃ BỎ (30/09) dấu mộc đỏ trong hộp đèn: đỏ mộc trên nền tím than chỉ đạt ~2:1, không đọc được. Lời hứa giữ
                    hộ vẫn in ở đây bằng chữ (điện thoại không có dấu mộc lấn mép bảng nên dòng này là chỗ duy nhất nói). */}
                <div className="flex flex-col items-start gap-2 mt-auto">
                  <NutDatCho showId={buoi.id} daDangNhap={daDangNhap} lon />
                  <p className="font-mono text-xs text-cream-mute">Tiền vé được giữ hộ tới khi buổi diễn diễn ra.</p>
                </div>
              </div>
              {cacBuoi.length > 1 && (
                <div className={`${dong.anh ? 'md:col-span-2' : ''} border-t border-cream/15 pt-4`}>
                  <p className="text-xs text-cream-mute mb-2">Các buổi đêm nay tại {dong.tenPhongTra}</p>
                  <ul className="divide-y divide-cream/10">
                    {cacBuoi.map((b) => (
                      <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                        <span className="font-mono text-brand-on-dark w-14">{gioTrongNgay(b.start_date)}</span>
                        <span className="flex-1 min-w-0 truncate text-cream">{b.title}</span>
                        <span className="font-mono text-sm text-cream-mute">{b.price}</span>
                        {b.id === buoi.id
                          ? <span className="inline-flex items-center min-h-[44px] px-3 text-sm text-cream-mute">Buổi sớm nhất</span>
                          : <Link to={`/shows/${b.id}`} className="inline-flex items-center min-h-[44px] px-3 font-semibold text-lamp underline underline-offset-4">Xem và đặt</Link>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

const KhungBang = ({ children }) => (
  <div className="relative bg-board text-cream border-[3px] border-ink p-3 sm:p-5 shadow-lift">
    {/* Cột cuối RỘNG CỐ ĐỊNH ở cả hàng tiêu đề lẫn dòng: để "auto" thì ở hàng tiêu đề nó rỗng (0px) còn ở dòng nó chứa
        nút Đặt chỗ, các cột fr co khác nhau và tiêu đề lệch 50–95px so với dữ liệu (người duyệt đo 30/09). */}
    <div className="hidden md:grid grid-cols-[7.5rem_3.5rem_minmax(0,1.4fr)_minmax(0,1.2fr)_7.5rem_7rem_9rem] gap-x-4 px-4 pb-3 text-xs text-cream-mute border-b border-cream/15 mb-3">
      <span>Giờ</span><span /><span>Phòng trà</span><span>Người hát</span><span>Khu vực</span><span>Trạng thái</span><span />
    </div>
    {children}
  </div>
)

const BangGioDien = ({ dong = [], dangTai, loi, onThuLai, daDangNhap, demGanNhat }) => {
  const [dangMo, setDangMo] = useState(null)
  const khoaMo = dangMo ?? dong[0]?.khoa ?? null

  // Chuột chỉ MỞ (không đóng) để rê qua các dòng không nhấp nháy; bấm thì bật/tắt.
  // Rê chuột có ĐỘ TRỄ Ý ĐỊNH 250ms: mở ngay thì lia chuột ngang qua bảng làm hộp đèn đóng/mở liên tục và nội dung
  // xô dịch dưới con trỏ. Chuột rời dòng trước 250ms thì huỷ. Bấm / bàn phím mở ngay, không chờ.
  const henGio = useRef(null)
  const huyHen = () => { clearTimeout(henGio.current); henGio.current = null }
  useEffect(() => huyHen, [])
  const datMo = (khoa, cach) => setDangMo((cu) => (cach === 'bam' && (cu ?? dong[0]?.khoa) === khoa ? '__dong__' : khoa))
  const onMo = (khoa, cach) => {
    huyHen()
    if (cach === 'chuot') henGio.current = setTimeout(() => datMo(khoa, cach), 250)
    else datMo(khoa, cach)
  }

  if (dangTai) {
    return (
      <KhungBang>
        <ul className="space-y-2" aria-busy="true" aria-label="Đang tải bảng giờ diễn">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-4 bg-espresso/40 border border-cream/10">
              <KyTuLat chu="--:--" lat={false} className="text-2xl opacity-60" />
              <span className="h-6 w-56 bg-cream/10 animate-pulse" />
            </li>
          ))}
        </ul>
      </KhungBang>
    )
  }

  if (loi) {
    return (
      <KhungBang>
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 px-4 py-6">
          <p className="text-cream">Bảng giờ diễn chưa tải được. Kiểm tra kết nối rồi thử lại.</p>
          <button type="button" onClick={onThuLai} className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-stock text-ink font-semibold">
            <RotateCcw size={16} aria-hidden="true" /> Thử lại
          </button>
        </div>
      </KhungBang>
    )
  }

  if (dong.length === 0) {
    return (
      <KhungBang>
        <div role="status" className="px-4 py-5">
          <KyTuLat chu="ĐÊM NAY CHƯA CÓ PHÒNG TRÀ NÀO LÊN ĐÈN" lat={false} className="text-sm sm:text-base flex-wrap" />
          {demGanNhat ? (
            <p className="text-cream-mute mt-4">
              Đêm gần nhất có diễn: <span className="text-lamp">{demGanNhat.nhan}</span>, {demGanNhat.soBuoi} buổi.{' '}
              <a href="#lich-tuan" className="underline text-lamp">Xem lịch tuần này</a>
            </p>
          ) : (
            <p className="text-cream-mute mt-4">Chưa có buổi diễn nào mở bán trong những ngày tới. Theo dõi phòng trà bên dưới để được báo khi có đêm mới.</p>
          )}
        </div>
      </KhungBang>
    )
  }

  return (
    <KhungBang>
      <ul className="space-y-2">
        {dong.map((d, i) => (
          <DongBang key={d.khoa} dong={d} chiSo={i} mo={khoaMo === d.khoa} onMo={onMo} onRoi={huyHen} daDangNhap={daDangNhap} />
        ))}
      </ul>
    </KhungBang>
  )
}

export default BangGioDien
