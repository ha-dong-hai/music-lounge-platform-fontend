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
import CuongDatVe from './CuongDatVe'
import NhanDangDien from './NhanDangDien'
import { useTranslation } from 'react-i18next'
import { k } from '../../i18n/k'

const CAU_GIA = k('Giá vé vào cửa. Phòng trà có thể yêu cầu gọi thêm đồ uống — xem trang buổi diễn.')

const NutDatCho = ({ showId, daDangNhap, lon = false }) => {
  const { t } = useTranslation()
  return (
  <div className="flex flex-col items-stretch gap-1">
    <Link
      to={`/shows/${showId}`}
      className={`inline-flex items-center justify-center font-display bg-stock text-ink hover:bg-lamp transition-colors ${lon ? 'min-h-[52px] px-7 text-2xl' : 'min-h-[44px] px-5 text-xl'}`}
    >
      {t('Đặt chỗ')}
    </Link>
    {!daDangNhap && (
      <span className="inline-flex items-center justify-center gap-1 text-xs text-lamp-mute">
        <LogIn size={11} aria-hidden="true" /> {t('Cần đăng nhập để đặt')}
      </span>
    )}
  </div>
  )
}
const DongBang = ({ dong, mo, onMo, onRoi, chiSo, daDangNhap }) => {
  const { t } = useTranslation()
  const giamChuyenDong = useReducedMotion()
  const { buoi } = dong
  const nguoiHat = buoi.performers?.length ? buoi.performers.join(', ') : t('Line-up đang cập nhật')
  const idChiTiet = `hop-den-${buoi.id}`
  const cacBuoi = dong.tatCa ?? [buoi]
  return (
    <li
      className={`border ${dong.dangDien ? 'border-ember' : 'border-lamp/10'} ${mo ? 'bg-ink shadow-glow' : 'bg-ink/40 hover:bg-ink/70'} transition-colors`}
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
          className="order-3 md:order-none col-span-2 md:col-span-1 text-left min-w-0 min-h-[44px] flex flex-col justify-center focus-visible:outline-lamp"
        >
          {/* Dòng đang mở thì tên phòng trà "lên đèn": quầng sáng màu ánh đèn quanh chữ — thứ phân biệt hộp đèn bật/tắt. */}
          <span className={`block font-display text-3xl text-lamp leading-none md:truncate ${mo ? '[text-shadow:0_0_18px_rgb(201_164_92/0.45)]' : ''}`}>{dong.tenPhongTra}</span>
          {dong.soBuoiThem > 0 && (
            <span className="block text-xs text-lamp-mute mt-1">{t('+{{n}} buổi nữa đêm nay', { n: dong.soBuoiThem })}</span>
          )}
        </button>

        <p className="order-4 md:order-none col-span-2 md:col-span-1 text-sm text-lamp md:truncate" title={nguoiHat}>{nguoiHat}</p>

        <p className="hidden md:flex items-center gap-1 text-sm text-lamp-mute">
          <MapPin size={13} aria-hidden="true" /> {buoi.district || buoi.province || '—'}
        </p>

        {/* Trạng thái là NHÃN khối chữ lớn chứ không phải ô chữ lật: ở cỡ nhỏ vạch ngang giữa ô cắt ngang chữ, khó đọc. */}
        <div className="order-2 md:order-none justify-self-end md:justify-self-start">
          {dong.dangDien
            ? <NhanDangDien co="lon" />
            : <span className="inline-flex items-center px-2.5 min-h-[30px] border border-lamp/60 text-lamp font-display text-lg leading-none">{t('Mở bán')}</span>}
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
                  <img src={dong.anh} alt={t('Không gian {{x}}', { x: dong.tenPhongTra })} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-4 text-lamp">
                <p className="text-lg text-lamp">{buoi.title}</p>
                <div>
                  <p className="text-xs text-lamp-mute mb-1.5">{t('Người hát theo thứ tự lên sân khấu')}</p>
                  <ol className="space-y-1">
                    {(buoi.performers?.length ? buoi.performers : [t('Line-up đang cập nhật')]).map((ten, i) => (
                      <li key={ten} className="flex items-baseline gap-2">
                        <span className="font-mono text-xs text-stock">{i + 1}</span>
                        <span>{ten}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="font-display text-3xl text-lamp leading-none [text-shadow:0_0_18px_rgb(201_164_92/0.40)]">{buoi.price}</p>
                  <p className="text-sm text-lamp-mute mt-1.5 max-w-prose">{t(CAU_GIA)}</p>
                </div>
                {/* ĐÃ BỎ (30/09) dấu mộc đỏ trong hộp đèn: đỏ mộc trên nền tím than chỉ đạt ~2:1, không đọc được. Lời hứa giữ
                    hộ vẫn in ở đây bằng chữ (điện thoại không có dấu mộc lấn mép bảng nên dòng này là chỗ duy nhất nói). */}
                <div className="flex flex-col items-start gap-2 mt-auto">
                  <NutDatCho showId={buoi.id} daDangNhap={daDangNhap} lon />
                  <p className="font-mono text-xs text-lamp-mute">{t('Tiền vé được giữ hộ tới khi buổi diễn diễn ra.')}</p>
                </div>
              </div>
              {cacBuoi.length > 1 && (
                <div className={`${dong.anh ? 'md:col-span-2' : ''} border-t border-lamp/15 pt-4`}>
                  <p className="text-xs text-lamp-mute mb-2">{t('Các buổi đêm nay tại {{x}}', { x: dong.tenPhongTra })}</p>
                  <ul className="divide-y divide-lamp/10">
                    {cacBuoi.map((b) => (
                      <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                        <span className="font-mono text-stock w-14">{gioTrongNgay(b.start_date)}</span>
                        {/* Điện thoại: tên buổi xuống dòng riêng (order-last + basis-full) — ép chung hàng với giờ, giá, liên
                            kết thì tên bị cắt còn "[…" (đo 30/09). Từ sm trở lên giữ một hàng như cũ — PHẢI là sm:basis-0, không phải
                            basis-auto: basis-auto ghi đè basis 0 của flex-1, tên dài đòi đủ chỗ và đẩy "Xem và đặt" xuống dòng. */}
                        <span className="order-last basis-full sm:order-none sm:basis-0 flex-1 min-w-0 sm:truncate text-lamp">{b.title}</span>
                        {/* Buổi khác đêm nay: cuống đặt vé bản giấy trên bảng tối (02/10/2026). Buổi sớm nhất đã có nút Đặt
                            chỗ lớn phía trên nên chỉ in giá + nhãn. */}
                        {b.id === buoi.id
                          ? <><span className="font-mono text-sm text-lamp-mute ml-auto sm:ml-0">{b.price}</span><span className="inline-flex items-center min-h-[44px] px-3 text-sm text-lamp-mute">{t('Buổi sớm nhất')}</span></>
                          : <CuongDatVe nen="muc" to={`/shows/${b.id}`} gia={b.price || null} className="ml-auto sm:ml-0" />}
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

const KhungBang = ({ children }) => {
  const { t } = useTranslation()
  return (
  <div className="relative bg-board text-lamp border-[3px] border-ink p-3 sm:p-5 shadow-lift">
    {/* Cột cuối RỘNG CỐ ĐỊNH ở cả hàng tiêu đề lẫn dòng: để "auto" thì ở hàng tiêu đề nó rỗng (0px) còn ở dòng nó chứa
        nút Đặt chỗ, các cột fr co khác nhau và tiêu đề lệch 50–95px so với dữ liệu (người duyệt đo 30/09). */}
    <div className="hidden md:grid grid-cols-[7.5rem_3.5rem_minmax(0,1.4fr)_minmax(0,1.2fr)_7.5rem_7rem_9rem] gap-x-4 px-4 pb-3 text-xs text-lamp-mute border-b border-lamp/15 mb-3">
      <span>{t('Giờ')}</span><span /><span>{t('Phòng trà')}</span><span>{t('Người hát')}</span><span>{t('Khu vực')}</span><span>{t('Trạng thái')}</span><span />
    </div>
    {children}
  </div>
  )
}
const BangGioDien = ({ dong = [], dangTai, loi, onThuLai, daDangNhap, demGanNhat }) => {
  const { t } = useTranslation()
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
        <ul className="space-y-2" aria-busy="true" aria-label={t('Đang tải bảng giờ diễn')}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-4 bg-ink/40 border border-lamp/10">
              <KyTuLat chu="--:--" lat={false} className="text-2xl opacity-60" />
              <span className="h-6 w-56 bg-lamp/10 animate-pulse" />
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
          <p className="text-lamp">{t('Bảng giờ diễn chưa tải được. Kiểm tra kết nối rồi thử lại.')}</p>
          <button type="button" onClick={onThuLai} className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-stock text-ink font-semibold">
            <RotateCcw size={16} aria-hidden="true" /> {t('Thử lại')}
          </button>
        </div>
      </KhungBang>
    )
  }

  if (dong.length === 0) {
    return (
      <KhungBang>
        <div role="status" className="px-4 py-5">
          <KyTuLat chu={t('ĐÊM NAY CHƯA CÓ PHÒNG TRÀ NÀO LÊN ĐÈN')} lat={false} className="text-sm sm:text-base flex-wrap" />
          {demGanNhat ? (
            <p className="text-lamp-mute mt-4">
              {t('Đêm gần nhất có diễn:')} <span className="text-lamp">{demGanNhat.nhan} {demGanNhat.ngay}</span>, {t('{{n}} buổi.', { n: demGanNhat.soBuoi })}{' '}
              <a href="#sap-len-den-khoi" className="group/lk inline-flex items-center gap-2 min-h-[44px] font-semibold text-lamp align-middle">{t('Xem các đêm sắp diễn')} <span aria-hidden="true" className="inline-flex items-center justify-center w-7 h-7 border-2 border-lamp/70 group-hover/lk:bg-lamp group-hover/lk:text-board transition-colors">↓</span></a>
            </p>
          ) : (
            <p className="text-lamp-mute mt-4">{t('Chưa có buổi diễn nào mở bán trong những ngày tới. Theo dõi phòng trà bên dưới để được báo khi có đêm mới.')}</p>
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
