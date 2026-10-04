// src/components/bang/mauSoLieu.js
//
// MÀU SỐ LIỆU của trang quản trị (05/10/2026) — một bảng tra cho ô số, tiêu đề mục và biểu đồ, để cùng một nghĩa luôn cùng
// một màu ở mọi nơi. Token và số đo tương phản: src/index.css (`--color-sl-*`). Lớp Tailwind viết ĐẦY ĐỦ (không ghép chuỗi)
// vì Tailwind chỉ sinh lớp nó đọc thấy nguyên văn. `hex` dành cho recharts (SVG không đọc biến CSS) — PHẢI khớp token.
export const MAU_SO_LIEU = {
  tien:     { hex: '#1F7A5C', vien: 'border-t-sl-tien',     nen: 'bg-sl-tien' },
  khangia:  { hex: '#1D5FA8', vien: 'border-t-sl-khangia',  nen: 'bg-sl-khangia' },
  goiy:     { hex: '#6B3FA0', vien: 'border-t-sl-goiy',     nen: 'bg-sl-goiy' },
  uytin:    { hex: '#A86400', vien: 'border-t-sl-uytin',    nen: 'bg-sl-uytin' },
  buoidien: { hex: '#A3355F', vien: 'border-t-sl-buoidien', nen: 'bg-sl-buoidien' },
}
