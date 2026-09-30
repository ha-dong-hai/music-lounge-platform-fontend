// src/components/admin/system-config/ConfigAuditCard.jsx
import { PlugZap, AlertTriangle, CheckCircle2 } from 'lucide-react'

// Một khoá hạ tầng còn thiếu. severity: 'Broken' = tính năng KHÔNG dùng được (đi sửa ngay),
// 'Degraded' = vẫn chạy nhưng mất một lớp (đưa vào việc cần làm) — hai mức phải trông khác nhau.
const GapRow = ({ gap }) => {
  const vo = gap.severity === 'Broken'
  return (
    <div className={`p-4 rounded-lg border ${vo ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/25 bg-yellow-500/5'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${vo ? 'bg-red-500/15 text-danger' : 'bg-yellow-500/15 text-warning'}`}>
          {vo ? 'Không dùng được' : 'Chạy thiếu lớp'}
        </span>
        <p className="text-sm text-ink font-medium">{gap.feature}</p>
      </div>
      <p className="text-xs text-ink-soft mt-2 leading-relaxed">{gap.impact}</p>
      <p className="text-xs text-ink-mute mt-1.5 font-mono break-all">{gap.key}</p>
    </div>
  )
}

/**
 * Khối "Cấu hình hạ tầng" — KHÁC HẲN phần bảng tham số dưới: đây là khoá biến môi trường
 * server (Mux, Firebase…), KHÔNG sửa được ở giao diện, và không bao giờ trả giá trị (không lộ secret).
 * @param {Array|null} gaps - null = chưa soát được (lỗi) | [] = đã soát, không thiếu | [...] có thiếu
 *   ⚠ null và [] KHÔNG được hiện giống nhau — lỗi mà trông như "mọi thứ đủ" là nói sai.
 */
const ConfigAuditCard = ({ gaps }) => (
  <div className="bg-card border border-line rounded-xl p-6">
    <h2 className="text-base font-semibold text-ink flex items-center gap-2">
      <PlugZap size={16} /> Cấu hình hạ tầng
    </h2>
    <p className="text-xs text-ink-mute mt-1 leading-relaxed">
      Những khoá kết nối dịch vụ ngoài (phát trực tiếp, thông báo đẩy, thanh toán). Đây là chỗ
      xem TRƯỚC khi đi tìm lỗi &quot;tự nhiên tính năng này không chạy trên môi trường này&quot;.
      Không sửa được trên giao diện — phải đổi trong cấu hình triển khai của server.
    </p>

    {gaps === null ? (
      <p className="mt-4 text-xs text-warning flex items-start gap-1.5 leading-relaxed">
        <AlertTriangle size={13} className="mt-px flex-shrink-0" />
        Chưa soát được cấu hình hạ tầng. Đây KHÔNG có nghĩa là không thiếu gì.
      </p>
    ) : gaps.length === 0 ? (
      <p className="mt-4 text-sm text-success flex items-center gap-2">
        <CheckCircle2 size={15} /> Không thiếu khoá cấu hình nào.
      </p>
    ) : (
      <div className="mt-4 space-y-2">
        {/* Broken lên trước: đó là thứ đang làm người dùng không dùng được tính năng */}
        {[...gaps].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'Broken' ? -1 : 1))
          .map((g) => <GapRow key={g.key} gap={g} />)}
      </div>
    )}
  </div>
)

export default ConfigAuditCard