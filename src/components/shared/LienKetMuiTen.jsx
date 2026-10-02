// src/components/shared/LienKetMuiTen.jsx
//
// LIÊN KẾT MŨI TÊN — cho liên kết ĐỨNG RIÊNG (không nằm trong câu văn): "Mọi phòng trà", "Xem các buổi diễn khác",
// "Chỉ đường", dòng chỉ đường "Phòng trà trên sàn". Chữ 600 + ô vuông 32px viền 2px chứa mũi tên; rê chuột hoặc focus
// thì ô lật thành khối mực (giống nút Viền lật màu trong DESIGN.md) và mũi tên tiến một bước.
//
// Vì sao không gạch dưới (02/10/2026): WCAG 2.2 G183 đòi dấu hiệu ngoài màu cho liên kết NẰM TRONG khối chữ; liên kết
// đứng riêng đã được nhận ra nhờ vị trí + ô mũi tên. Liên kết trong câu văn vẫn giữ gạch dưới — đừng dùng linh kiện
// này cho chúng. Báo cáo: reports/Nút hành động thay chữ gạch dưới.md (repo backend).
//
// Props: `to` (trong trang) hoặc `href` (ngoài trang → mở thẻ mới, mũi tên chéo, câu sr-only báo mở thẻ mới) ·
// `lui` (mũi tên trái đứng trước — quay lại) · `nen` 'giay' | 'muc' · `nho` (chữ 14px, ô 28px — dòng chỉ đường).
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'

const MAU = {
  giay: { chu: 'text-ink', o: 'border-ink group-hover/lk:bg-ink group-hover/lk:text-lamp group-focus-visible/lk:bg-ink group-focus-visible/lk:text-lamp' },
  muc: { chu: 'text-lamp', o: 'border-lamp/70 group-hover/lk:bg-lamp group-hover/lk:text-board group-focus-visible/lk:bg-lamp group-focus-visible/lk:text-board' },
}

const LienKetMuiTen = ({ to, href, lui = false, nen = 'giay', nho = false, className = '', children, ...rest }) => {
  const mau = MAU[nen] ?? MAU.giay
  const ngoai = Boolean(href)
  const Icon = lui ? ArrowLeft : ngoai ? ArrowUpRight : ArrowRight
  const tien = lui ? 'motion-safe:group-hover/lk:-translate-x-0.5' : ngoai ? 'motion-safe:group-hover/lk:translate-x-0.5 motion-safe:group-hover/lk:-translate-y-0.5' : 'motion-safe:group-hover/lk:translate-x-0.5'
  const o = (
    <span aria-hidden="true" className={`inline-flex items-center justify-center flex-shrink-0 border-2 transition-colors ${nho ? 'w-7 h-7' : 'w-8 h-8'} ${mau.o}`}>
      <Icon size={nho ? 14 : 16} className={`motion-safe:transition-transform ${tien}`} />
    </span>
  )
  // Truyền font-display (tên phòng trà Anton) thì KHÔNG cộng font-semibold: hai lớp độ đậm cùng lúc thì lớp nào thắng
  // tuỳ thứ tự CSS, và Anton bị ép đậm giả trông nén lại (ảnh chụp 02/10).
  const dam = /font-(display|normal)/.test(className) ? '' : 'font-semibold'
  const lop = `group/lk inline-flex items-center gap-3 min-h-[44px] ${dam} ${nho ? 'text-sm' : ''} ${mau.chu} ${className}`
  const noiDung = <>{lui && o}<span>{children}</span>{!lui && o}</>

  return ngoai
    ? <a href={href} target="_blank" rel="noreferrer" className={lop} {...rest}>{noiDung}<span className="sr-only"> (mở ở thẻ mới)</span></a>
    : <Link to={to} className={lop} {...rest}>{noiDung}</Link>
}

export default LienKetMuiTen
