// src/components/admin/dashboard/chartTokens.js
//
// Màu biểu đồ Dashboard Admin. KHÔNG chọn bằng mắt — đã chạy trình kiểm bảng màu (dataviz
// validate_palette.js) trên đúng nền thẻ bg-gray-900 (#101828), chế độ tối, xét MỌI cặp màu:
// độ sáng trong dải, độ bão hoà đủ, tách biệt với người mù màu ΔE 9,4 (mục tiêu ≥ 8), với mắt
// thường ΔE 20,9 (sàn 15), tương phản ≥ 3:1 với nền. Đổi màu hay đổi nền thẻ thì chạy lại trình kiểm.
// Thứ tự màu là cơ chế an toàn mù màu, không phải trang trí: không đảo, không sinh thêm màu thứ tư —
// có nguồn thứ tư thì gộp vào "Khác" hoặc tách thành biểu đồ riêng.
export const SURFACE = '#101828'   // bg-gray-900; cũng là màu khe 2px giữa các đoạn cột chồng
export const GRID = '#1e2939'      // gray-800; lưới và trục là nét mảnh, liền, lùi về sau
export const AXIS_TEXT = '#6a7282' // gray-500
export const CURSOR = '#1e2939'

// Màu đi theo NGUỒN, không theo thứ hạng: nguồn nào cũng giữ đúng màu của nó ở mọi khối trên trang.
export const SOURCES = [
  { key: 'ticket', label: 'Vé', color: '#3987e5' },
  { key: 'package', label: 'Gói dịch vụ', color: '#d95926' },
  { key: 'donation', label: 'Donate', color: '#199e70' },
]

// Biểu đồ một chuỗi: MỘT màu cho mọi thanh. Không tô đậm nhạt theo độ lớn — chiều dài thanh đã
// nói điều đó, tô thêm chỉ mã hoá trùng lần hai.
export const SINGLE_SERIES = '#3987e5'

export const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

// Nhãn trục gọn (1,4 tr / 350 k). Chỉ dùng cho vạch trục; giá trị đầy đủ nằm trong tooltip và bảng.
export const fmtCompact = (v) => {
  const n = Number(v || 0)
  const abs = Math.abs(n)
  const f = (x, d) => x.toLocaleString('vi-VN', { maximumFractionDigits: d })
  if (abs >= 1e9) return `${f(n / 1e9, 1)} tỷ`
  if (abs >= 1e6) return `${f(n / 1e6, 1)} tr`
  if (abs >= 1e3) return `${f(n / 1e3, 0)} k`
  return f(n, 0)
}
