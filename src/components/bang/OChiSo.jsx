// src/components/bang/OChiSo.jsx
//
// Ô CHỈ SỐ DÙNG CHUNG cho tổng quan vận hành (01/10/2026). Trước đây ít nhất 6 kiểu tự dựng (StatsCards, VenuesStatsCards,
// AdminDashboard, AdminInsights, OwnerSubscription, OwnerDonations…): ô biểu tượng màu, viền màu khi chọn, cỡ số khác nhau.
//
// Luật (reports/Form lọc vé và màn vận hành.md, mục bảng điều khiển):
//  - Mỗi ô trả lời "so với cái gì": `phu` mang mẫu số hoặc bối cảnh ("trên 240 vé", "14 đang bị khoá").
//  - Số tiền làm tròn gọn trong ô (truyền chuỗi đã định dạng), số đầy đủ để ở bảng chi tiết.
//  - Biểu tượng chỉ trang trí (aria-hidden); màu không mang nghĩa — ô cần chú ý dùng `canChuY` (viền + chữ son), có chữ đi kèm.
//  - Ô bấm được (lọc danh sách) là <button aria-pressed>; ô chỉ đọc là <div>. Không dựng ô bấm được mà không có tác dụng.
//
// Props: nhan, so (chuỗi/số), phu?, icon? (lucide), canChuY?, dangChon?, onClick?
const OChiSo = ({ nhan, so, phu, icon: Icon, canChuY = false, dangChon, onClick }) => {
  const lop = `text-left w-full border-2 p-4 sm:p-5 flex flex-col gap-1 min-h-[96px] ${dangChon ? 'border-ink bg-sunken' : canChuY ? 'border-danger bg-card' : 'border-ink/25 bg-card'}`
  const noiDung = (
    <>
      <span className="flex items-center gap-2 text-sm text-ink-soft">
        {Icon && <Icon size={16} aria-hidden="true" className="flex-shrink-0" />}
        {nhan}
      </span>
      <span className={`font-mono text-2xl sm:text-3xl font-semibold tabular-nums ${canChuY ? 'text-danger' : 'text-ink'}`}>
        {typeof so === 'number' ? so.toLocaleString('vi-VN') : so}
      </span>
      {phu && <span className="text-xs text-ink-soft">{phu}</span>}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={!!dangChon} className={`${lop} hover:border-ink transition-colors`}>{noiDung}</button>
  ) : (
    <div className={lop}>{noiDung}</div>
  )
}

export default OChiSo
