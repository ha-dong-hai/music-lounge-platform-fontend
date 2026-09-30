// src/components/admin/ledger/RecurringJobsCard.jsx
import { Loader2, Clock, Play, ExternalLink } from 'lucide-react'

// Id job của Hangfire là mã kỹ thuật — chỉ bỏ dấu gạch cho đọc được, KHÔNG dịch
// (id là thứ duy nhất khớp với log + dashboard Hangfire)
const tenDocDuoc = (jobId) => jobId.replace(/[-_]/g, ' ')

/**
 * Khối tác vụ định kỳ — thuần UI
 * @param {string[]} jobs - mảng id job từ getRecurringJobs
 * @param {boolean} isLoading
 * @param {boolean} isTriggering - đang chạy 1 job → khóa toàn bộ nút
 * @param {function} onTrigger - (jobId) — page mở ConfirmModal
 */
const RecurringJobsCard = ({ jobs, isLoading, isTriggering, onTrigger }) => (
  <div>
    <h2 className="text-sm font-semibold text-ink-soft flex items-center gap-2">
      <Clock size={15} /> Tác vụ định kỳ
    </h2>
    <p className="text-xs text-ink-mute mt-0.5 mb-3 leading-relaxed">
      Các job chạy theo lịch. Bấm chạy khi job lỡ nhịp, hoặc khi vừa sửa dữ liệu và muốn thấy kết quả ngay.
    </p>

    {isLoading ? (
      <div className="bg-card border border-line py-12 flex justify-center">
        <Loader2 size={22} className="animate-spin text-ink" />
      </div>
    ) : jobs.length === 0 ? (
      <div className="bg-card border border-line p-6">
        <p className="text-sm text-ink-mute">Không có tác vụ định kỳ nào đang đăng ký.</p>
      </div>
    ) : (
      <div className="bg-card border border-line divide-y divide-line">
        {jobs.map((jobId) => (
          <div key={jobId} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-ink capitalize">{tenDocDuoc(jobId)}</p>
              <p className="text-xs text-ink-mute mt-0.5 font-mono break-all">{jobId}</p>
            </div>
            <button onClick={() => onTrigger(jobId)} disabled={isTriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-line text-ink-soft text-xs font-bold hover:bg-sunken disabled:opacity-50 flex-shrink-0">
              <Play size={13} /> Chạy ngay
            </button>
          </div>
        ))}
      </div>
    )}

    <p className="text-xs text-ink-mute mt-3 flex items-start gap-1.5 leading-relaxed">
      <ExternalLink size={12} className="mt-0.5 flex-shrink-0" />
      Lịch chạy, lần chạy gần nhất và log chi tiết nằm ở dashboard Hangfire của backend, không phải ở đây.
    </p>
  </div>
)

export default RecurringJobsCard