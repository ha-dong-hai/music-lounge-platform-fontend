// src/components/admin/dashboard/chartTokens.js

// Màu biểu đồ Dashboard — theo bảng màu "sơn then và lụa ngà" (01/10/2026).
// Bản trước còn nguyên màu của giao diện TỐI cũ (nền khe và lưới gần như đen) và hai màu mặc định
// Tailwind (xanh dương, tím) — biểu đồ vẽ màu tối trên trang sáng. Ảnh data-URI/SVG của recharts không đọc biến CSS nên ghi mã hex, nhưng
// giữ ĐÚNG giá trị token trong index.css.
export const SURFACE = '#FBF8F3'     // = --color-card — màu khe 2px giữa các đoạn cột chồng
export const GRID = '#DAD0C2'        // = --color-line
export const AXIS_TEXT = '#65584D'   // = --color-ink-mute
export const CURSOR = '#EDE6DB'      // = --color-sunken

// Màu đi theo NGUỒN, giữ đúng màu ở mọi khối trên trang — không đảo thứ tự.
// Ba độ đậm của MỰC, phân biệt bằng độ sáng (đọc được khi mù màu); không mượn ember (chỉ buổi đang diễn) hay son (chỉ
// trạng thái tiền). Đo 01/10/2026 so với nền thẻ #FBF8F3: 16.1 / 5.9 / 3.1 : 1 (WCAG 1.4.11 cần >= 3:1). Hai màu liền kề
// chỉ 2.8 và 1.9 : 1 — tách được nhờ khe 2px + chú giải; muốn tăng thì thêm hoa văn, đừng thêm màu ngoài bảng.
export const SOURCES = [
  { key: 'ticket',   label: 'Vé',          color: '#231A15' },
  { key: 'package',  label: 'Gói dịch vụ', color: '#6E5E50' }, // = --color-chart-2
  { key: 'donation', label: 'Tiền ủng hộ', color: '#9A8B7C' }, // = --color-chart-3
]

export const SINGLE_SERIES = '#231A15'

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

// Số tiền gọn cho CHỮ đọc (ô giữa biểu đồ vòng): đơn vị tiếng Việt đầy đủ. Bản cũ ghép fmtCompact với 'đ' thành "88 kđ".
export const fmtTienGon = (v) => {
  const n = Number(v || 0)
  const abs = Math.abs(n)
  const f = (x) => x.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  if (abs >= 1e9) return `${f(n / 1e9)} tỷ đ`
  if (abs >= 1e6) return `${f(n / 1e6)} triệu đ`
  if (abs >= 1e3) return `${f(n / 1e3)} nghìn đ`
  return `${f(n)} đ`
}
