// src/components/shared/SaoPhaLe.jsx
//
// SAO PHA LÊ (03/10/2026) — hàng sao điểm đánh giá vẽ thành khối cắt mặt như viên pha lê ánh sâm-panh. Chủ dự án: "ngôi
// sao có màu giống pha lê"; chọn bản D trong 4 bản mẫu (J:/MVP/ML_FE/ban-mau/ban-mau-sao-pha-le.html) vì gần màu vàng thếp
// của trang, ít lạ tông nhất. Đây là NGOẠI LỆ chủ dự án duyệt cho luật "sao màu lamp" của DESIGN.md (mục Đêm đã qua).
//
// - 10 mặt tam giác từ tâm ra mỗi cạnh; mặt trái-trên hứng sáng, mặt phải-dưới khuất. Màu lấy từ biến --pha-le-1..5
//   (index.css), không viết hex trong component.
// - Sao trống: cùng hình, pha lê mờ (lamp 22%) — vẫn thấy "4 trên 5".
// - Lấp lánh: một đốm sáng lướt qua từng sao, lệch nhịp, CHỈ 2 lượt rồi đứng yên (< 5 giây — WCAG 2.2.2 không đòi nút dừng,
//   cùng cách với .song-am / .vach-quet). Giảm chuyển động: không lấp lánh.
// - Trình đọc màn hình đọc "4 trên 5 sao"; hình vẽ aria-hidden.
const DIEM = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 19 : 47
  const g = -Math.PI / 2 + (i * Math.PI) / 5
  return [+(50 + r * Math.cos(g)).toFixed(2), +(52 + r * Math.sin(g)).toFixed(2)]
})
const VIEN = DIEM.map((p) => p.join(',')).join(' ')
// Sắc độ từng mặt, đi vòng theo chiều kim đồng hồ từ đỉnh trên.
const MAT = [1, 2, 3, 1, 4, 2, 5, 2, 3, 1]

const MotSao = ({ day, tre }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" className="w-full h-full overflow-visible">
    <g opacity={day ? 1 : 0.22}>
      {DIEM.map((a, i) => {
        const b = DIEM[(i + 1) % 10]
        return (
          <polygon key={i} points={`50,52 ${a.join(',')} ${b.join(',')}`}
            fill={day ? `var(--pha-le-${MAT[i]})` : 'var(--color-lamp)'}
            stroke={day ? 'var(--pha-le-1)' : 'var(--color-lamp)'} strokeOpacity={day ? 0.7 : 1} strokeWidth=".8" strokeLinejoin="round" />
        )
      })}
    </g>
    <polygon points={VIEN} fill="none" stroke={day ? 'var(--pha-le-1)' : 'var(--color-lamp)'} strokeOpacity={day ? 1 : 0.55}
      strokeWidth={day ? 2 : 2.5} strokeLinejoin="round" />
    {day && <path className="sao-loe" style={{ animationDelay: `${tre}s` }} fill="white" d="M34 30 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5z" />}
  </svg>
)

const SaoPhaLe = ({ diem, className = 'w-8 h-8' }) => (
  <span className="inline-flex gap-1.5 align-middle">
    {[0, 1, 2, 3, 4].map((i) => (
      <span key={i} className={`block shrink-0 ${className}`}><MotSao day={i < diem} tre={i * 0.35} /></span>
    ))}
    <span className="sr-only">{diem} trên 5 sao</span>
  </span>
)

export default SaoPhaLe
