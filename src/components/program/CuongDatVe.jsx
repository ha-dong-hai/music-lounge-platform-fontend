// src/components/program/CuongDatVe.jsx
//
// CUỐNG ĐẶT VÉ — hành động "đặt vé" trên một dòng buổi diễn, vẽ như một cuống vé xé dở: nửa trái in giá (mono),
// đường xé ở giữa (hai khuyết bán nguyệt trên/dưới + vạch đứt), nửa phải là chữ hành động bằng Anton.
//
// VÌ SAO KHÔNG CÒN LÀ CHỮ GẠCH DƯỚI (02/10/2026, chủ dự án: "gạch dưới xấu, không nổi bật"):
//  - Đặt vé là hành động dẫn tới tiền — phải có trọng lượng thị giác lớn nhất trên dòng (Carbon Button usage: mỗi
//    vùng một hành động chính; GOV.UK Start button: hành động chính là khối nút dù chỉ điều hướng).
//  - Trang thật cùng lĩnh vực (chụp 02/10): Village Vanguard nút đặc "TICKETS", Barbican nút đặc có mũi tên ở mỗi hàng;
//    không trang nào dùng chữ gạch dưới cho đặt vé.
//  - Gạch dưới để dành cho liên kết NẰM TRONG câu văn (WCAG 2.2 G183).
//  Báo cáo: reports/Nút hành động thay chữ gạch dưới.md (repo backend).
//
// Răng cưa dùng lại kỹ thuật mask của CuongVeCamKet (DESIGN.md: ngoại lệ duy nhất được phép của gradient) — khuyết là
// lỗ trong suốt thật, nền phía sau lộ qua, không phải hình tròn tô màu nền giả.
//
// Hai cách dùng:
//  - `to` có giá trị → là <Link> thật (bảng lịch tuần, danh sách buổi trên bảng giờ diễn).
//  - không có `to` → <span> trang trí trong một dòng đã có liên kết trải kín (DongBuoiDien). Chữ hành động khi đó
//    aria-hidden (trình đọc màn hình đã nghe tên buổi là liên kết); GIÁ vẫn đọc được vì là dữ liệu.
// Trạng thái: `MoBan` (mặc định) · `DangDien` → nửa phải vàng thếp "Xem buổi diễn" (Ember-Is-Live: vàng chỉ cho buổi đang
// diễn) · `DaDien` → bản viền mảnh, không giá, không răng cưa (vé không còn bán, không nên trông như lời mời trả tiền).
// `nen`: 'giay' (trên giấy sáng, cuống mực) | 'muc' (trên bảng giờ diễn tối, cuống giấy — như nút Đặt chỗ).
import { Link } from 'react-router-dom'
import MuiTenLuyen from '../shared/MuiTenLuyen'
import { useTranslation } from 'react-i18next'
import { k } from '../../i18n/k'

// 9px (bản đầu 6px): khuyết to hơn đọc thành vết bấm tròn mềm; 6px trông như góc bị cắt (chủ dự án 02/10: "cứng nhắc").
const BAN_KINH = 9

const khuyet = (canh) => {
  const x = canh === 'phai' ? '100%' : '0'
  const v = `radial-gradient(circle ${BAN_KINH}px at ${x} 0, #0000 98%, #000) top/100% 51% no-repeat, radial-gradient(circle ${BAN_KINH}px at ${x} 100%, #0000 98%, #000) bottom/100% 51% no-repeat`
  return { WebkitMask: v, mask: v }
}
// Đường xé = hàng LỖ ĐỤC CHẤM TRÒN (đường kính ~3px, bước 7px) ở mép phải nửa giá, màu theo chữ (currentColor) — thay
// vạch đứt: vạch đứt góc cạnh, lỗ tròn là cách vé giấy thật được đục để xé, và mềm hơn (phương án D, 02/10/2026).
// Lịch sử: bản đầu đặt vạch đứt màu sáng ở mép nửa mực → nhìn như khe hở tách cuống làm hai mảnh.
const KHUYET_PHAI = khuyet('phai')
// Vẽ bằng MASK trên một dải tô màu chữ, KHÔNG bằng nền radial-gradient: cổng kiem-the-gioi cấm nền chuyển sắc, DESIGN.md
// chỉ cho phép mask răng cưa/lỗ đục của cuống vé (bản đầu dùng background → cổng đỏ 02/10).
const MASK_LO = 'radial-gradient(circle 1.6px, #000 95%, #0000) 0 0/4px 7px repeat-y'
const LO_DUC = { backgroundColor: 'currentColor', WebkitMask: MASK_LO, mask: MASK_LO }
const KHUYET_TRAI = khuyet('trai')

// Đang diễn KHÔNG ghi "Vào xem": buổi có thể chỉ diễn tại phòng trà, không phát trực tuyến — nhãn đó hứa điều không có.
const NHAN = { MoBan: k('Đặt vé'), DangDien: k('Xem buổi diễn'), DaDien: k('Xem lại trang buổi diễn') }

const MAU = {
  giay: {
    gia: 'bg-card text-ink border-2 border-r-0 border-ink',
    hanhDong: 'bg-ink text-lamp',
    vien: 'border-2 border-ink text-ink hover:bg-ink hover:text-lamp',
  },
  muc: {
    gia: 'text-lamp border-2 border-r-0 border-lamp/60',
    hanhDong: 'bg-stock text-ink',
    vien: 'border-2 border-lamp/60 text-lamp hover:bg-lamp hover:text-board',
  },
}

const CuongDatVe = ({ gia, trangThai = 'MoBan', nen = 'giay', to, className = '' }) => {
  const { t } = useTranslation()
  const mau = MAU[nen] ?? MAU.giay
  const laLink = Boolean(to)
  const Goc = laLink ? Link : 'span'
  const goc = laLink ? { to } : {}
  // Không có `to` = cuống chỉ là HÌNH; cả dòng bấm được nhờ liên kết phủ kín dòng (DongBuoiDien: after:absolute
  // after:inset-0 ở tên buổi). Cuống nhấc lên khi rê bằng transform + drop-shadow → tạo lớp vẽ mới ĐÈ lên lớp liên kết,
  // nên đúng lúc bấm, cú bấm rơi vào span và không đi đâu (chủ dự án 03/10: "bắt đặt vé không được" — hỏng ở cả 4 nơi
  // dùng DongBuoiDien). Cho cú bấm xuyên qua tới liên kết; hiệu ứng vẫn chạy nhờ group-hover/dong.
  const xuyen = laLink ? '' : 'pointer-events-none'

  if (trangThai === 'DaDien') {
    return (
      <Goc {...goc} className={`inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-semibold whitespace-nowrap rounded-[3px] transition-colors ${mau.vien} ${xuyen} ${className}`}>
        <span aria-hidden={laLink ? undefined : true}>{NHAN.DaDien}</span>
      </Goc>
    )
  }

  const hanhDong = trangThai === 'DangDien' ? 'bg-ember text-board' : mau.hanhDong
  return (
    // group/cuong: tự rê chuột lên cuống; group-hover/dong: rê lên CẢ DÒNG (DongBuoiDien đặt group/dong) — cả hai đều
    // làm cuống nhấc lên và mũi tên tiến một bước. motion-safe: người đã tắt chuyển động thì chỉ đổi bóng.
    <Goc {...goc} className={`group/cuong inline-flex items-stretch min-h-[48px] whitespace-nowrap transition-[transform,filter] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-safe:group-hover/dong:-translate-y-0.5 motion-safe:hover:-translate-y-0.5 group-hover/dong:drop-shadow-[0_6px_10px_rgb(35_26_21/0.25)] hover:drop-shadow-[0_6px_10px_rgb(35_26_21/0.25)] ${xuyen} ${className}`}>
      {gia && (
        <span className={`relative inline-flex items-center pl-3.5 pr-4 font-mono text-sm rounded-l-[3px] ${mau.gia}`} style={KHUYET_PHAI}>
          {gia}
          <span aria-hidden="true" className="absolute right-0.5 top-[13px] bottom-[13px] w-1" style={LO_DUC} />
        </span>
      )}
      <span aria-hidden={laLink ? undefined : true}
        className={`inline-flex items-center gap-2.5 pl-4 pr-4 font-display text-xl leading-none ${gia ? 'rounded-r-[3px]' : 'rounded-[3px]'} ${hanhDong}`}
        style={gia ? KHUYET_TRAI : undefined}>
        {t(NHAN[trangThai] ?? NHAN.MoBan)}
        <MuiTenLuyen rong={34} />
      </span>
    </Goc>
  )
}

export default CuongDatVe
