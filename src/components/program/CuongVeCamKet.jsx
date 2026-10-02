// src/components/program/CuongVeCamKet.jsx
//
// TIỀN CỦA BẠN ĐI ĐÂU — ba cuống vé xé, mỗi cuống MỘT câu đã đối chiếu với code backend, có dấu mộc (dấu mộc chỉ
// nói về tiền — đúng luật của thế giới). Đặt sát chân trang: người ta đọc cam kết lúc đang cân nhắc đặt vé.
// KHÔNG có con số cam kết nào ("100%", "24 giờ"...) — ảnh mẫu Stitch tự thêm các câu đó, hệ thống không hứa vậy.
//   1. Giữ hộ: tiền vé online qua sổ cái, chỉ quyết toán cho phòng trà sau khi buổi diễn diễn ra (settlement gate).
//   2. Huỷ thì hoàn: phòng trà huỷ buổi diễn thì vé được hoàn (Cancel show → refund).
//   3. Sao kê: tiền ủng hộ nghệ sĩ có sao kê công khai từng khoản (/minh-bach, /performers/:id/donations).
// Răng cưa cuống vé vẽ bằng mask CSS (radial-gradient lặp) — không phải ảnh, không phải clip-path đa giác.
import DauMoc from './DauMoc'
import LienKetMuiTen from '../shared/LienKetMuiTen'

const CAM_KET = [
  { tieuDe: 'Tiền vé được giữ hộ', cau: 'Tiền bạn trả trực tuyến được nền tảng giữ, chỉ chuyển cho phòng trà sau khi buổi diễn diễn ra.', dau: 'GIỮ HỘ' },
  { tieuDe: 'Buổi diễn huỷ thì hoàn tiền', cau: 'Phòng trà huỷ buổi diễn thì vé của bạn được hoàn — theo dõi trạng thái ngay trong mục Vé của tôi.', dau: 'HOÀN VÉ' },
  { tieuDe: 'Tiền ủng hộ có sao kê', cau: 'Mỗi khoản ủng hộ nghệ sĩ được ghi lên sao kê công khai, ai cũng xem được tiền đã tới tay nghệ sĩ hay chưa.', dau: 'SAO KÊ', link: { to: '/minh-bach', nhan: 'Xem sao kê' } },
]

const RANG_CUA = {
  WebkitMask: 'radial-gradient(circle 7px at 50% 0, transparent 98%, #000) top/22px 51% repeat-x, radial-gradient(circle 7px at 50% 100%, transparent 98%, #000) bottom/22px 51% repeat-x',
  mask: 'radial-gradient(circle 7px at 50% 0, transparent 98%, #000) top/22px 51% repeat-x, radial-gradient(circle 7px at 50% 100%, transparent 98%, #000) bottom/22px 51% repeat-x',
}

const CuongVeCamKet = () => (
  <ul className="grid gap-6 md:grid-cols-3">
    {CAM_KET.map((c) => (
      // Dấu mộc nằm TRONG dòng chảy (hàng cuối, căn phải) chứ không position absolute: bản absolute đè lên chữ của cả
      // ba cuống ở 390px (người duyệt 30/09) và sát chữ cuống thứ ba ở máy tính.
      <li key={c.tieuDe} className="flex flex-col bg-card text-ink px-6 pt-8 pb-8 shadow-lift" style={RANG_CUA}>
        <h3 className="font-display text-3xl leading-none">{c.tieuDe}</h3>
        <p className="mt-3 text-ink-soft max-w-prose">{c.cau}</p>
        <div className="mt-auto pt-3 flex items-end justify-between gap-4">
          {c.link ? <LienKetMuiTen to={c.link.to}>{c.link.nhan}</LienKetMuiTen> : <span />}
          <DauMoc vongNgoai="MUSICLOUNGE · CAM KẾT · " giua={c.dau} size={84} xoay={-14} className="shrink-0 opacity-90" />
        </div>
      </li>
    ))}
  </ul>
)

export default CuongVeCamKet
