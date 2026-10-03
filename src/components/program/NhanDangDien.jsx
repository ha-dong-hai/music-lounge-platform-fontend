// src/components/program/NhanDangDien.jsx
//
// NHÃN "ĐANG DIỄN" + SÓNG ÂM — một nguồn cho mọi chỗ báo buổi diễn đang diễn (bảng giờ diễn, dòng buổi diễn, đầu trang
// buổi diễn). Trước 03/10/2026 ba chỗ tự viết ba nhãn khác cỡ. Khối vàng thếp = Ember-Is-Live (DESIGN.md): chỉ khi
// status Ongoing.
//
// SÓNG ÂM (D4, chủ dự án chọn 02/10): 4 thanh nhấp nhô lệch nhịp — "đang có nhạc" bằng hình, không thêm chữ.
//  - Chỉ nhảy 4 nhịp (~4,4 giây) rồi đứng yên: chuyển động TỰ chạy > 5 giây cạnh nội dung khác thì WCAG 2.2.2 đòi nút dừng;
//    giữ dưới 5 giây là cách không cần nút cho một nhãn nhỏ (keyframes `song-am` trong index.css).
//  - prefers-reduced-motion: đứng yên ngay từ đầu.
//  - aria-hidden: chữ "Đang diễn" bên cạnh đã nói đủ.
const CO = {
  nho: { khung: 'gap-1.5 px-2 min-h-[24px] font-sans font-semibold text-xs', song: 'h-2.5' },
  vua: { khung: 'gap-2 px-2.5 min-h-[28px] font-display text-base leading-none', song: 'h-3' },
  lon: { khung: 'gap-2 px-2.5 min-h-[30px] font-display text-lg leading-none', song: 'h-3.5' },
}

export const SongAm = ({ className = '' }) => (
  <span aria-hidden="true" className={`song-am inline-flex items-end gap-[2px] ${className}`}>
    <span /><span /><span /><span />
  </span>
)

const NhanDangDien = ({ co = 'vua', className = '' }) => {
  const c = CO[co] ?? CO.vua
  return (
    <span className={`inline-flex items-center bg-ember text-board ${c.khung} ${className}`}>
      <SongAm className={c.song} />
      Đang diễn
    </span>
  )
}

export default NhanDangDien
