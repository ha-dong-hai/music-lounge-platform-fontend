// src/components/admin/dashboard/chartTokens.js

// Màu biểu đồ Dashboard — theo tông brand cũ (vàng đồng #C3B665 cho nguồn chính).
// Lưu ý: bản gốc (repo mới) dùng bộ màu đã qua kiểm tra mù màu (xanh/cam/xanh lá, ΔE ≥ 8).
// Bộ màu brand này chưa chạy lại trình kiểm đó — nếu Admin phản hồi khó phân biệt
// Vé/Donate, đổi SOURCES về bộ: #3987e5 / #d95926 / #199e70 là xong.
export const SURFACE = '#111111'     // = bg-card — dùng làm màu khe 2px giữa các đoạn cột chồng
export const GRID = '#1F1F1F'        // = border-line
export const AXIS_TEXT = '#6B7280'   // = ink-mute
export const CURSOR = '#1A1A1A'      // = sunken

// Màu đi theo NGUỒN, giữ đúng màu ở mọi khối trên trang — không đảo thứ tự
export const SOURCES = [
  { key: 'ticket',   label: 'Vé',          color: '#C3B665' },
  { key: 'package',  label: 'Gói dịch vụ', color: '#3b82f6' },
  { key: 'donation', label: 'Donate',      color: '#a855f7' },
]

export const SINGLE_SERIES = '#C3B665'

export const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Nhãn trục gọn (1,4 tr / 350 k) — chỉ dùng cho vạch trục, giá trị đầy đủ nằm trong tooltip
export const fmtCompact = (v) => {
  const n = Number(v || 0)
  const abs = Math.abs(n)
  const f = (x, d) => x.toLocaleString('vi-VN', { maximumFractionDigits: d })
  if (abs >= 1e9) return `${f(n / 1e9, 1)} tỷ`
  if (abs >= 1e6) return `${f(n / 1e6, 1)} tr`
  if (abs >= 1e3) return `${f(n / 1e3, 0)} k`
  return f(n, 0)
}