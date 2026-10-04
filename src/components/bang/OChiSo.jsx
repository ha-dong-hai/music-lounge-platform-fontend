// src/components/bang/OChiSo.jsx
//
// Ô CHỈ SỐ DÙNG CHUNG cho tổng quan vận hành (01/10/2026). Trước đây ít nhất 6 kiểu tự dựng (StatsCards, VenuesStatsCards,
// AdminDashboard, AdminInsights, OwnerSubscription, OwnerDonations…): ô biểu tượng màu, viền màu khi chọn, cỡ số khác nhau.
//
// Luật (reports/Form lọc vé và màn vận hành.md, mục bảng điều khiển):
//  - Mỗi ô trả lời "so với cái gì": `phu` mang mẫu số hoặc bối cảnh ("trên 240 vé", "14 đang bị khoá").
//  - Số tiền làm tròn gọn trong ô (truyền chuỗi đã định dạng), số đầy đủ để ở bảng chi tiết.
//  - Biểu tượng chỉ trang trí (aria-hidden); ô cần chú ý dùng `canChuY` (viền + chữ son), có chữ đi kèm.
//  - Ô bấm được (lọc danh sách) là <button aria-pressed>; ô chỉ đọc là <div>. Không dựng ô bấm được mà không có tác dụng.
//
// 05/10/2026 — MÀU (chủ dự án: trang quản trị phải đa dạng màu, làm nổi thành phần):
//  - `mau` (khoá của components/bang/mauSoLieu): dải màu 4px trên đầu ô cho biết ô thuộc nhóm nào (tiền, khán giả, gợi ý…).
//    Màu mang NGHĨA nhóm, không phải trang trí ngẫu nhiên; số vẫn màu mực để đọc rõ nhất.
//  - Dòng phụ bắt đầu bằng "Tăng"/"Giảm" (utils/kyBaoCao.cauSoVoiKyTruoc) tô xanh/đỏ KÈM mũi tên ▲▼ — không chỉ dựa vào
//    màu (WCAG 1.4.1). Chỉ số mà "tăng là xấu" (khiếu nại, vi phạm) thì truyền `trungTinh` để không tô.
//
// Props: nhan, so (chuỗi/số), phu?, icon? (lucide), canChuY?, dangChon?, onClick?, mau?, trungTinh?

// 05/10/2026 (lần 2): phần NHÌN của ô (nền, viền, ô biểu tượng, bo góc) do CSS theo chủ đề quyết định — index.css, khối
// "Ô SỐ" (`.o-chi-so`, `data-nhom`): D Materio = thẻ trắng + ô biểu tượng màu; E CoreUI = tô đặc; F Berry = nhuộm nhạt.
// Ở đây chỉ còn cấu trúc + nghĩa (nhóm, đang chọn, cần chú ý, tăng/giảm).
const OChiSo = ({ nhan, so, phu, icon: Icon, canChuY = false, dangChon, onClick, mau, trungTinh = false }) => {
  const lop = `o-chi-so text-left w-full border p-4 sm:p-5 flex flex-col gap-1 min-h-[96px] ${canChuY ? 'border-danger' : 'border-line'}`
  const tang = !trungTinh && typeof phu === 'string' && phu.startsWith('Tăng ')
  const giam = !trungTinh && typeof phu === 'string' && phu.startsWith('Giảm ')
  const noiDung = (
    <>
      {Icon && <span className="o-chi-so__bieu-tuong" aria-hidden="true"><Icon size={22} /></span>}
      <span className={`text-sm ${dangChon ? 'text-ink font-semibold' : 'text-ink-soft'}`}>{nhan}</span>
      <span className={`font-mono text-2xl sm:text-3xl font-semibold tabular-nums ${canChuY ? 'text-danger' : 'text-ink'}`}>
        {typeof so === 'number' ? so.toLocaleString('vi-VN') : so}
      </span>
      {phu && (
        <span className={`text-xs ${tang ? 'text-success font-semibold' : giam ? 'text-danger font-semibold' : 'text-ink-soft'}`}>
          {tang && <span aria-hidden="true">▲ </span>}{giam && <span aria-hidden="true">▼ </span>}{phu}
        </span>
      )}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={!!dangChon} data-nhom={mau} className={lop}>{noiDung}</button>
  ) : (
    <div data-nhom={mau} className={lop}>{noiDung}</div>
  )
}

export default OChiSo
