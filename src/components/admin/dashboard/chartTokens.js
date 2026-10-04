// src/components/admin/dashboard/chartTokens.js

// Màu biểu đồ Dashboard — theo bảng màu "sơn then và lụa ngà" (01/10/2026).
// Bản trước còn nguyên màu của giao diện TỐI cũ (nền khe và lưới gần như đen) và hai màu mặc định
// Tailwind (xanh dương, tím) — biểu đồ vẽ màu tối trên trang sáng. Ảnh data-URI/SVG của recharts không đọc biến CSS nên ghi mã hex, nhưng
// giữ ĐÚNG giá trị token trong index.css.
// 05/10/2026: bốn màu nền/lưới/trục đọc từ biến CSS để ăn theo chủ đề màn vận hành (SVG nhận var() ở fill/stroke).
export const SURFACE = 'var(--color-card)'   // màu khe 2px giữa các đoạn cột chồng
export const GRID = 'var(--color-line)'
export const AXIS_TEXT = 'var(--color-ink-mute)'
export const CURSOR = 'var(--color-sunken)'

// Màu đi theo NGUỒN, giữ đúng màu ở mọi khối trên trang — không đảo thứ tự.
// Ba độ đậm của MỰC, phân biệt bằng độ sáng (đọc được khi mù màu); không mượn ember (chỉ buổi đang diễn) hay son (chỉ
// trạng thái tiền). Đo 01/10/2026 so với nền thẻ #FBF8F3: 16.1 / 5.9 / 3.1 : 1 (WCAG 1.4.11 cần >= 3:1). Hai màu liền kề
// chỉ 2.8 và 1.9 : 1 — tách được nhờ khe 2px + chú giải; muốn tăng thì thêm hoa văn, đừng thêm màu ngoài bảng.
// 04/10/2026: ĐÃ thêm hoa văn — nguồn giữa (gói dịch vụ) vẽ sọc chéo (`hoaVan`), nên hai cặp kề nhau khác nhau bằng KẾT CẤU,
// không chỉ bằng độ sáng (WCAG 1.4.11 / 1.4.1: không dùng màu là cách phân biệt duy nhất). Ba màu nâu cùng tông dưới 3:1
// là thứ chủ dự án gọi là "mờ nhạt"; không thêm sắc mới vì bảng màu chỉ dành son cho tiền và ember cho buổi đang diễn.
// 05/10/2026: chủ dự án muốn trang quản trị ĐA DẠNG MÀU — ba nguồn nay là ba SẮC khác nhau (lam · hổ phách · mận) lấy từ
// bảng màu số liệu (index.css `--color-sl-*`), thay ba độ đậm của mực và sọc chéo. Chọn bộ ba này vì mô phỏng mù màu
// đỏ–lục vẫn tách được (lam / vàng ô-liu / xám); KHÔNG dùng lục cạnh mận hay lam cạnh tím trong cùng biểu đồ.
export const SOURCES = [
  { key: 'ticket',   label: 'Vé',          color: '#1D5FA8' }, // = --color-sl-khangia (lam)
  { key: 'package',  label: 'Gói dịch vụ', color: '#A86400' }, // = --color-sl-uytin (hổ phách)
  { key: 'donation', label: 'Tiền ủng hộ', color: '#A3355F' }, // = --color-sl-buoidien (mận)
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
