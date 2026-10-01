// src/components/bang/NhomTab.jsx
//
// NHÓM TAB LỌC TRONG TRANG (01/10/2026) — "Chờ duyệt / Đã duyệt", "Tất cả / Nháp / Đã đăng…". Trước đây ~60 chỗ tự dựng,
// đa số nút cao ~30px (px-3 py-1.5 text-xs), dưới mức 44px đã chốt trong DESIGN.md (WCAG 2.5.8 là 24px tối thiểu; dự án
// chọn 44px), và mỗi trang một kiểu tô nút đang chọn.
//
// Đây là NHÓM NÚT LỌC (role="group" + aria-pressed), không phải tablist ARIA: bấm là đổi bộ lọc của danh sách bên dưới
// (thường ghi lên URL qua useDanhSachMayChu), không chuyển panel — tablist đòi phím mũi tên + aria-controls cho từng panel,
// dùng sai còn tệ hơn không dùng (WAI-ARIA APG, "No ARIA is better than bad ARIA").
//
// Props:
//   nhan     — tên nhóm cho trình đọc màn hình ("Lọc theo trạng thái").
//   cacTab   — [{ khoa, nhan, dem? }]; dem (số) hiện sau nhãn, bỏ trống thì không hiện.
//   dangChon — khoa đang chọn.
//   onChon   — (khoa) => void.
const NhomTab = ({ nhan, cacTab, dangChon, onChon, className = '' }) => (
  <div role="group" aria-label={nhan} className={`flex flex-wrap gap-2 ${className}`}>
    {cacTab.map((t) => {
      const chon = t.khoa === dangChon
      return (
        <button key={`tab-${String(t.khoa)}`} type="button" aria-pressed={chon} onClick={() => onChon(t.khoa)}
          className={`inline-flex items-center gap-2 min-h-[44px] px-4 border-2 border-ink text-sm font-semibold transition-colors ${chon ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-sunken'}`}>
          {t.nhan}
          {t.dem != null && <span className={`font-mono text-xs ${chon ? 'text-lamp/80' : 'text-ink-soft'}`}>{Number(t.dem).toLocaleString('vi-VN')}</span>}
        </button>
      )
    })}
  </div>
)

export default NhomTab
