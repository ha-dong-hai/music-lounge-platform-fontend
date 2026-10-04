// src/components/bang/DaCho.jsx
//
// Nhãn "Đã chờ 3 ngày" / "Quá hạn 5 giờ" cho một dòng trong hàng chờ của Admin (MLACP-596). Chữ nói rõ trạng thái, màu son
// và vạch trái chỉ là nhấn thêm (WCAG 1.4.1: không truyền nghĩa bằng màu đơn thuần). `title` giữ mốc giờ chính xác.
// Cách tính: utils/thoiGianCho.js (plugin relativeTime của dayjs).
import dayjs from 'dayjs'
import { Clock } from 'lucide-react'
import { trangThaiCho } from '../../utils/thoiGianCho'

const DaCho = ({ luc, han = null, className = '' }) => {
  const t = trangThaiCho(luc, han)
  if (!t) return null
  return (
    <span title={`Nộp lúc ${dayjs(luc).format('HH:mm DD/MM/YYYY')}${han ? ` · hạn ${dayjs(han).format('HH:mm DD/MM/YYYY')}` : ''}`}
      className={`inline-flex items-center gap-1 text-xs whitespace-nowrap ${t.quaHan ? 'text-danger font-semibold border-l-4 border-danger pl-1.5' : 'text-ink-soft'} ${className}`}>
      <Clock size={12} aria-hidden="true" /> {t.chu}
    </span>
  )
}

export default DaCho
