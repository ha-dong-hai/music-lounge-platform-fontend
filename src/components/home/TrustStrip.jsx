// src/components/home/TrustStrip.jsx
//
// GHI CHÚ CHO ĐỘI FE — thay cho khối "3 vòng tròn icon tính năng" (dấu hiệu AI slop đã tra cứu
// được, xem docs/design/TRANG-CHU-BRIEF.md §6): một dòng ngang mỏng kiểu bảng chú thích, không phải
// 3 thẻ giống hệt nhau. Ba câu ở đây đều là SỰ THẬT có trong sản phẩm, không phải lời quảng cáo
// chung chung ("nhanh, an toàn, đáng tin cậy"):
//   1. MLACP-307: hồ sơ phòng trà phải Admin duyệt mới lên sàn công khai.
//   2. TicketHoldMinutes = 15 (appsettings.json) + ShowMap.jsx: giữ chỗ có hạn, sơ đồ thời gian thực.
//   3. ShowMap.jsx: "Nếu phòng trà huỷ buổi diễn thì bạn được hoàn 100%, bất kể điều kiện trên."
const FACTS = [
  'Hồ sơ phòng trà được xác minh trước khi mở bán',
  'Sơ đồ chỗ ngồi thời gian thực, giữ chỗ 15 phút',
  'Hoàn 100% nếu phòng trà huỷ đêm diễn',
]

const TrustStrip = () => (
  <div className="rounded-xl border border-line bg-card px-5 py-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-ink-soft">
    {FACTS.map((f, i) => (
      <span key={f} className="flex items-center gap-3">
        {i > 0 && <span className="hidden sm:inline w-px h-4 bg-line-strong" aria-hidden="true" />}
        {f}
      </span>
    ))}
  </div>
)

export default TrustStrip
