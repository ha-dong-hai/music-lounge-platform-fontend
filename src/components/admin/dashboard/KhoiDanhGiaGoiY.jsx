// src/components/admin/dashboard/KhoiDanhGiaGoiY.jsx
//
// Chất lượng mô hình gợi ý (GET /analytics/recommender-evaluation). MLACP-595: chuyển từ trang Tổng quan sang trang Nội
// dung và tương tác — đây là số liệu kỹ thuật, không theo kỳ, không phải việc Admin xem hằng ngày; trang tổng quan chỉ giữ
// số liệu kinh doanh theo kỳ (NN/g: dashboard là thông tin "at-a-glance" để hành động nhanh).
import { Brain } from 'lucide-react'

const KhoiDanhGiaGoiY = ({ recommender }) => {
  if (!recommender) return null
  return (
    <div className="bg-card border border-line p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-ink/10">
          <Brain size={20} className="text-ink" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">Chất lượng mô hình gợi ý</h3>
          <p className="text-ink-mute text-xs mt-0.5 leading-relaxed">{recommender.method}</p>
        </div>
      </div>

      {/* BE cố tình KHÔNG trả con số khi chưa đủ dữ liệu — hiển thị đúng như vậy,
          không quy về 0% kẻo người đọc tưởng mô hình đo được và đang sai */}
      {recommender.status === 'NotEnoughHistory' ? (
        <div className="bg-warning/5 border border-warning/20 p-4">
          <p className="text-warning text-sm font-medium mb-1">Chưa đủ dữ liệu để đo</p>
          <p className="text-ink-soft text-xs leading-relaxed">{recommender.caveat}</p>
          <div className="flex flex-wrap gap-6 mt-3 text-xs">
            <span className="text-ink-mute">
              Người dùng đủ lịch sử: <span className="text-ink font-medium">{recommender.usersWithEnoughHistory}</span>
            </span>
            <span className="text-ink-mute">
              Kho buổi diễn: <span className="text-ink font-medium">{recommender.catalogueSize}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {(recommender.models || []).map((m, i) => (
            <div key={m.name ?? i} className="flex items-center justify-between bg-sunken/70 border border-line px-4 py-3">
              <span className="text-sm text-ink font-medium">{m.name}</span>
              <span className="text-sm text-ink font-bold">
                HR@{recommender.k}: {((m.hitRate ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
          {recommender.caveat && <p className="text-ink-mute text-xs leading-relaxed pt-1">{recommender.caveat}</p>}
        </div>
      )}
    </div>
  )
}

export default KhoiDanhGiaGoiY
