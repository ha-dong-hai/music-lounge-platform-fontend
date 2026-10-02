// src/components/shared/LienKetMuiTen.jsx
//
// LIÊN KẾT MŨI TÊN — cho liên kết ĐỨNG RIÊNG (không nằm trong câu văn): "Mọi phòng trà", "Xem các buổi diễn khác",
// "Chỉ đường", dòng chỉ đường "Phòng trà trên sàn". Chữ 600 + mũi tên dấu luyến (MuiTenLuyen); rê chuột thì mũi tên
// trượt tới theo đường cong êm. Bản đầu (02/10 sáng) là ô vuông viền 2px — chủ dự án chê "cứng nhắc", chọn phương án D.
//
// Vì sao không gạch dưới (02/10/2026): WCAG 2.2 G183 đòi dấu hiệu ngoài màu cho liên kết NẰM TRONG khối chữ; liên kết
// đứng riêng đã được nhận ra nhờ vị trí + ô mũi tên. Liên kết trong câu văn vẫn giữ gạch dưới — đừng dùng linh kiện
// này cho chúng. Báo cáo: reports/Nút hành động thay chữ gạch dưới.md (repo backend).
//
// Props: `to` (trong trang) hoặc `href` (ngoài trang → mở thẻ mới, mũi tên chéo, câu sr-only báo mở thẻ mới) ·
// `lui` (mũi tên trái đứng trước — quay lại) · `nen` 'giay' | 'muc' · `nho` (chữ 14px, mũi tên ngắn hơn — dòng chỉ đường).
import { Link } from 'react-router-dom'
import MuiTenLuyen from './MuiTenLuyen'

const MAU = { giay: 'text-ink', muc: 'text-lamp' }

const LienKetMuiTen = ({ to, href, lui = false, nen = 'giay', nho = false, className = '', children, ...rest }) => {
  const ngoai = Boolean(href)
  const muiTen = <MuiTenLuyen huong={lui ? 'lui' : ngoai ? 'ngoai' : 'toi'} rong={ngoai ? (nho ? 18 : 22) : (nho ? 30 : 36)} />
  // Truyền font-display (tên phòng trà Anton) thì KHÔNG cộng font-semibold: hai lớp độ đậm cùng lúc thì lớp nào thắng
  // tuỳ thứ tự CSS, và Anton bị ép đậm giả trông nén lại (ảnh chụp 02/10).
  const dam = /font-(display|normal)/.test(className) ? '' : 'font-semibold'
  const lop = `group/lk inline-flex items-center gap-2.5 min-h-[44px] ${dam} ${nho ? 'text-sm' : ''} ${MAU[nen] ?? MAU.giay} ${className}`
  // min-w-0: cho phép chữ bên trong tự cắt (truncate) khi liên kết nằm trong cột hẹp — vd danh sách đường dẫn chứng từ.
  const noiDung = <>{lui && muiTen}<span className="min-w-0">{children}</span>{!lui && muiTen}</>

  return ngoai
    ? <a href={href} target="_blank" rel="noreferrer" className={lop} {...rest}>{noiDung}<span className="sr-only"> (mở ở thẻ mới)</span></a>
    : <Link to={to} className={lop} {...rest}>{noiDung}</Link>
}

export default LienKetMuiTen
