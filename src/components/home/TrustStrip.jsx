// src/components/home/TrustStrip.jsx
// Một dòng ngang mỏng kiểu bảng chú thích — 3 sự thật của hệ thống, không phải 3 thẻ icon quảng cáo
const FACTS = [
  'Hồ sơ phòng trà được xác minh trước khi mở bán',
  'Sơ đồ chỗ ngồi thời gian thực, giữ chỗ 15 phút',
  'Hoàn 100% nếu phòng trà huỷ đêm diễn',
]

const TrustStrip = () => (
  <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs sm:text-sm text-gray-300">
    {FACTS.map((f, i) => (
      <span key={f} className="flex items-center gap-3">
        {i > 0 && <span className="hidden sm:inline w-px h-4 bg-line-strong" aria-hidden="true" />}
        {f}
      </span>
    ))}
  </div>
)

export default TrustStrip