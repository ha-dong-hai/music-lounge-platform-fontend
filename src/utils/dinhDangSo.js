// src/utils/dinhDangSo.js
//
// MỘT bộ định dạng số tiếng Việt cho trang số liệu (luật Q6 — reports/Trang quản trị - rà soát thị giác và luật trình bày
// số liệu.md ở repo backend). Rà soát 04/10/2026 thấy cùng một màn in "73.0%" (toFixed, dấu chấm kiểu Anh) cạnh "94,6%"
// (vi-VN): người đọc không biết dấu chấm là phần nghìn hay phần thập phân. Mọi phần trăm trên trang quản trị đi qua đây.

// `v` là số ĐÃ ở đơn vị phần trăm (67.57 → "67,6%"). Bỏ ",0" thừa: 73 → "73%", không "73,0%".
export const phanTram = (v, soLe = 1) =>
  `${Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: soLe })}%`

// Tỷ lệ a/b dưới dạng phần trăm; b = 0 thì null (nơi gọi in chữ, không in "0%" hay "NaN%").
export const tyLe = (a, b) => (Number(b) > 0 ? (Number(a || 0) / Number(b)) * 100 : null)

export const soNguyen = (v) => Number(v || 0).toLocaleString('vi-VN')
