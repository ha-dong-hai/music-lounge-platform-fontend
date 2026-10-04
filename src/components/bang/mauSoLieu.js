// src/components/bang/mauSoLieu.js
//
// MÀU SỐ LIỆU của trang quản trị (05/10/2026) — một bảng tra cho ô số, tiêu đề mục và biểu đồ, để cùng một nghĩa luôn cùng
// một màu ở mọi nơi. Token và số đo tương phản: src/index.css (`--color-sl-*`). Lớp Tailwind viết ĐẦY ĐỦ (không ghép chuỗi)
// vì Tailwind chỉ sinh lớp nó đọc thấy nguyên văn. `hex` là tên cũ: nay chứa `var(--color-sl-*)` (thuộc tính fill/stroke của SVG nhận var()) để màu đổi theo chủ đề màn vận hành.
export const MAU_SO_LIEU = {
  tien:     { hex: 'var(--color-sl-tien)', vien: 'border-t-sl-tien',     nen: 'bg-sl-tien' },
  khangia:  { hex: 'var(--color-sl-khangia)', vien: 'border-t-sl-khangia',  nen: 'bg-sl-khangia' },
  goiy:     { hex: 'var(--color-sl-goiy)', vien: 'border-t-sl-goiy',     nen: 'bg-sl-goiy' },
  uytin:    { hex: 'var(--color-sl-uytin)', vien: 'border-t-sl-uytin',    nen: 'bg-sl-uytin' },
  buoidien: { hex: 'var(--color-sl-buoidien)', vien: 'border-t-sl-buoidien', nen: 'bg-sl-buoidien' },
}
