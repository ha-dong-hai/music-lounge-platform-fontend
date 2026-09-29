// src/components/home/DongBuoiDien.jsx
//
// MỘT BUỔI DIỄN TRONG TỜ CHƯƠNG TRÌNH.
//
// Tách ra file riêng vì đây là chỗ DUY NHẤT trên trang chủ mà người dùng thật sự ra quyết định,
// nên bốn luật khó nhất của đặc tả đều hội tụ tại đây:
//   §1 chữ truy được về dữ liệu thật · §7 trạng thái NGƯỜI · §8 giá nói thật · §9 không gây áp lực.
//
// §1 — AI DIỄN LÀ PHẦN CHÍNH CỦA MỘT TỜ CHƯƠNG TRÌNH
// Bản trước chỉ hiện tên buổi diễn, phòng trà, giờ, giá. Nhưng người ta đi phòng trà để nghe MỘT
// NGƯỜI hát, không phải để tiêu thụ một "buổi diễn". Dữ liệu vốn đã có: LoungeShowListItemDto
// (backend) trả `PerformerNames`, và mapping lấy `show.Performances.OrderBy(p => p.OrderIndex)`
// — tức là ĐÚNG THỨ TỰ LÊN SÂN KHẤU. Trang chủ trước đây bỏ trường này đi không dùng.
// Không tự rút gọn thành "nhiều nghệ sĩ": in tên thật, quá dài thì nói rõ còn bao nhiêu người nữa.
//
// §1 — TRỰC TUYẾN THÌ ĐỪNG CHỈ ĐƯỜNG
// `format` có ba giá trị thật: Offline · Online · Hybrid. Một buổi Online không có đường nào để đi,
// nên hiện biểu tượng ghim bản đồ kèm địa chỉ là nói sai việc người dùng sắp phải làm. Hybrid thì
// nói cả hai, vì khán giả được chọn.
//
// §7 — TRẠNG THÁI NGƯỜI DÙNG
// Mua vé BẮT BUỘC đăng nhập (ràng buộc backend), nên khách chưa đăng nhập đi theo lời mời "đặt vé"
// sẽ đâm vào một bức tường mà trang chưa hề báo trước. Nói trước ở đúng nút hành động là tôn trọng;
// để họ bấm rồi mới chặn là bẫy. Người chưa đăng nhập vẫn xem được TOÀN BỘ chương trình, giá, khu
// vực — không dựng cổng đăng nhập trước khi người ta kịp xem.
//
// §8 — GIÁ NÓI THẬT
// "Từ 350.000đ" đứng một mình là điểm khởi đầu của drip pricing: Baymard đo được 40% bỏ giỏ vì chi
// phí phát sinh và 12% vì không thấy tổng tiền từ đầu. Ở phòng trà, phí ẩn điển hình là đồ uống
// bắt buộc. Backend KHÔNG trả trường nào cho biết giá đã gồm gì, nên thay vì im lặng (để người
// dùng tự suy ra là đã gồm), trang nói thẳng là chưa rõ. Nói "chưa rõ" trung thực hơn im lặng.
//
// §9 — KHÔNG CÓ CON SỐ GÂY ÁP LỰC
// File này cố ý KHÔNG hiển thị "còn N vé", "sắp hết", hay đồng hồ đếm ngược. Low-stock message và
// countdown timer là hai loại dark pattern phổ biến nhất trong khảo sát 11.286 site của Mathur et
// al., và EU DSA Article 25 cấm false urgency. Lưu ý một cái bẫy CỤ THỂ ở đây: DTO có `OfflineQuota`
// và `OnlineQuota` — đó là SỨC CHỨA, không phải số vé còn lại. Đem sức chứa ra trừ đi rồi gọi là
// "còn N vé" là bịa một con số trông như thật. Tồn kho thật theo hạng vé chỉ có ở trang chi tiết.
import { Link } from 'react-router-dom'
import { gioTrongNgay } from '../../utils/ngayVietNam'
import { MapPin, ArrowRight, LogIn, Ticket, Radio } from 'lucide-react'
import CoverFallback from '../shared/CoverFallback'

// Bao nhiêu tên được in thẳng trước khi rút gọn. Hai tên là vừa một dòng trên màn hẹp; nhiều hơn
// thì hàng tên đè mất tiêu đề buổi diễn, mà tiêu đề mới là thứ người ta quét mắt tìm.
const SO_TEN_IN_THANG = 2

const DongBuoiDien = ({ ev, daDangNhap = false, daCoVe = false }) => {
  // Đích đến khác nhau theo trạng thái người dùng — xem §7.
  const dich = daCoVe ? '/my-shows' : `/shows/${ev.id}`

  const dsNguoiDien = Array.isArray(ev.performers) ? ev.performers.filter(Boolean) : []
  const tenInThang = dsNguoiDien.slice(0, SO_TEN_IN_THANG)
  const soConLai = dsNguoiDien.length - tenInThang.length

  const laTrucTuyen = ev.format === 'Online'
  const laKetHop = ev.format === 'Hybrid'
  // Địa điểm ghép từ hai trường thật; thiếu trường nào thì bỏ trường đó, không có chữ thay thế.
  const noiDien = [ev.loungeName, ev.district, ev.province].filter(Boolean).join(' · ')

  return (
    <article className="grid grid-cols-[88px_1fr] sm:grid-cols-[132px_1fr] gap-4 sm:gap-6 items-start py-5 border-b border-line last:border-b-0">
      <Link to={dich} tabIndex={-1} aria-hidden="true"
        className="relative aspect-[4/3] rounded-md overflow-hidden border border-line block">
        {ev.thumbnail ? (
          <img src={ev.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <CoverFallback className="w-full h-full" />
        )}
      </Link>

      <div className="min-w-0">
        <p className="text-xs text-ink-mute tabular-nums mb-1">
          {/* Giờ 24h kiểu Việt (§10). Giờ bên trái khối là khung giờ tròn, đây là giờ diễn thật. */}
          {gioTrongNgay(ev.start_date)}
          {ev.genre ? <span> · {ev.genre}</span> : null}
        </p>

        <h3 className="font-display text-lg sm:text-xl font-semibold tracking-tight leading-snug text-balance text-ink">
          {/* Liên kết bọc TIÊU ĐỀ chứ không bọc cả khối: trình đọc màn hình đọc ra tên buổi diễn
              làm tên liên kết, thay vì đọc toàn bộ nội dung thẻ thành một chuỗi dài. */}
          <Link to={dich} className="hover:text-brand-text transition-colors">{ev.title}</Link>
        </h3>

        {/* §1 — hàng tên người biểu diễn, theo đúng thứ tự lên sân khấu. Đây là dòng quan trọng
            thứ hai sau tiêu đề, nên nó đứng ngay dưới tiêu đề chứ không nằm cuối thẻ. */}
        {tenInThang.length > 0 && (
          <p className="text-sm text-ink-soft mt-1 truncate">
            {tenInThang.join(' · ')}
            {soConLai > 0 && <span className="text-ink-mute"> · và {soConLai} người nữa</span>}
          </p>
        )}

        {/* §1 — buổi trực tuyến thì không chỉ đường. */}
        <p className="flex items-center gap-1.5 text-sm text-ink-soft mt-1.5">
          {laTrucTuyen ? (
            <>
              <Radio size={14} className="flex-shrink-0 text-ink-mute" aria-hidden="true" />
              <span className="truncate">Trực tuyến{ev.loungeName ? ` · ${ev.loungeName}` : ''}</span>
            </>
          ) : noiDien ? (
            <>
              <MapPin size={14} className="flex-shrink-0 text-ink-mute" aria-hidden="true" />
              <span className="truncate">
                {noiDien}
                {laKetHop && <span className="text-ink-mute"> · có vé trực tuyến</span>}
              </span>
            </>
          ) : null}
        </p>

        {/* §8 — giá không bao giờ đứng một mình. */}
        {ev.price && (
          <p className="mt-2">
            <span className="text-sm font-semibold text-brand-text tabular-nums">Từ {ev.price}</span>
            <span className="block text-xs text-ink-mute mt-0.5">
              Giá vé vào cửa. Phòng trà có thể yêu cầu gọi thêm đồ uống — xem trang buổi diễn.
            </span>
          </p>
        )}

        {/* §7 — hành động nói đúng sự thật TRƯỚC khi bấm. */}
        <div className="mt-3">
          {daCoVe ? (
            <Link to="/my-shows"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-success hover:underline">
              <Ticket size={15} aria-hidden="true" /> Bạn đã có vé — xem vé
            </Link>
          ) : (
            <>
              <Link to={`/shows/${ev.id}`}
                className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-brand-text hover:underline">
                Xem chi tiết &amp; đặt vé <ArrowRight size={15} aria-hidden="true" />
              </Link>
              {!daDangNhap && (
                <span className="flex items-center gap-1.5 text-xs text-ink-mute mt-1">
                  <LogIn size={12} aria-hidden="true" /> Xem thoải mái, nhưng đặt vé thì cần đăng nhập.
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default DongBuoiDien
