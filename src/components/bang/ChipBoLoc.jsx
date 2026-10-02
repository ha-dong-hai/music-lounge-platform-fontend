// src/components/bang/ChipBoLoc.jsx
//
// CHIP BỘ LỌC ĐANG ÁP (01/10/2026) — dòng "Đang lọc: [Vai trò: Chủ phòng trà ×] [Từ khoá: “hà” ×]  Xoá tất cả".
// Nghiên cứu (reports/Thư viện bảng lọc phân trang dữ liệu lớn.md): người dùng hay quên mình đang lọc rồi tưởng dữ liệu
// mất; chip cho thấy bộ lọc đang áp và gỡ từng cái một chạm (Baymard "applied filters", Carbon "filter tag").
// Mỗi chip là một nút có tên đầy đủ "Bỏ lọc Vai trò: Chủ phòng trà" cho trình đọc màn hình — dấu × một mình không có nghĩa.
// Không có bộ lọc nào thì không vẽ gì.
import { X } from 'lucide-react'

const ChipBoLoc = ({ cacChip, onXoaTatCa, className = '' }) => {
  if (!cacChip?.length) return null
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-ink-soft">Đang lọc:</span>
      <ul className="contents">
        {cacChip.map((c) => (
          <li key={c.khoa}>
            <button type="button" onClick={c.xoa} aria-label={`Bỏ lọc ${c.nhan}`}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 border-2 border-ink bg-card text-sm font-semibold hover:bg-ink hover:text-lamp">
              {c.nhan} <X size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {cacChip.length > 1 && (
        <button type="button" onClick={onXoaTatCa} className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-semibold hover:text-ink-soft">
          <X size={16} strokeWidth={1.75} aria-hidden="true" /> Xoá tất cả
        </button>
      )}
    </div>
  )
}

export default ChipBoLoc
