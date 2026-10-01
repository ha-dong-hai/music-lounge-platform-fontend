// src/components/admin/ledger/RecurringJobsCard.jsx
import { Loader2, Clock, Play, ExternalLink } from 'lucide-react'

// Id job của Hangfire là mã kỹ thuật — chỉ bỏ dấu gạch cho đọc được, KHÔNG dịch
// (id là thứ duy nhất khớp với log + dashboard Hangfire)
// Tên tiếng Việt của 28 tác vụ định kỳ backend đăng ký (Infrastructure/DependencyInjection.cs, 01/10/2026). Mã nào
// không có ở đây (backend thêm tác vụ mới) thì hiện nguyên mã — không đoán tên.
const TEN_TAC_VU = {
  'release-expired-holds': 'Nhả chỗ giữ vé đã hết hạn',
  'recompute-user-event-scores': 'Tính lại điểm sở thích của khán giả (cho gợi ý)',
  'refresh-recommendations': 'Làm mới gợi ý buổi diễn',
  'auto-confirm-donations': 'Tự xác nhận tiền ủng hộ khi chủ phòng trà không bấm',
  'expire-stuck-donations': 'Đóng lượt ủng hộ thanh toán dở',
  'expire-stuck-stitch-attempts': 'Đóng lượt ghép ảnh 360° bị treo',
  'expire-poster-jobs': 'Trả lại hàng đợi các yêu cầu tạo poster bị bỏ dở',
  'cancel-abandoned-payments': 'Huỷ giao dịch thanh toán bị bỏ dở',
  'remind-owner-to-start-show': 'Nhắc chủ phòng trà bắt đầu buổi diễn',
  'refund-undelivered-livestream-tickets': 'Hoàn tiền vé xem trực tuyến của buổi không phát',
  'notify-undelivered-offline-show': 'Báo buổi diễn tại chỗ không diễn ra',
  'release-due-settlements': 'Giải ngân các đợt quyết toán đến hạn',
  'auto-end-stale-shows': 'Tự kết thúc buổi diễn đã quá giờ',
  'send-event-reminders': 'Gửi nhắc lịch buổi diễn cho khán giả',
  'check-overdue-donations': 'Kiểm tiền ủng hộ quá hạn chuyển cho nghệ sĩ',
  'expire-ticket-transfers': 'Huỷ lời chuyển vé quá hạn',
  'warn-expiring-subscriptions': 'Báo gói dịch vụ sắp hết hạn',
  'expire-subscriptions': 'Kết thúc gói dịch vụ đã hết hạn',
  'apply-due-venue-penalties': 'Áp án phạt phòng trà đến ngày hiệu lực',
  'expire-served-suspensions': 'Gỡ tạm khoá phòng trà đã đủ hạn',
  'auto-approve-overdue-appeals': 'Tự chấp nhận khiếu nại án phạt quá hạn xử lý',
  'alert-moderation-sla-breaches': 'Cảnh báo kiểm duyệt quá hạn xử lý',
  'alert-content-report-sla-breaches': 'Cảnh báo báo cáo vi phạm quá hạn xử lý',
  'alert-complaint-sla-breaches': 'Cảnh báo khiếu nại quá hạn xử lý',
  'alert-refund-sla-breaches': 'Cảnh báo yêu cầu hoàn tiền quá hạn xử lý',
  'auto-approve-overdue-refunds': 'Tự duyệt yêu cầu hoàn tiền quá hạn xử lý',
  'detect-login-spikes': 'Phát hiện đăng nhập sai tăng đột biến',
  'detect-admin-role-drift': 'Phát hiện thay đổi bất thường quyền Admin',
}
const tenDocDuoc = (jobId) => TEN_TAC_VU[jobId] ?? jobId

/**
 * Khối tác vụ định kỳ — thuần UI
 * @param {string[]} jobs - mảng id job từ getRecurringJobs
 * @param {boolean} isLoading
 * @param {boolean} isTriggering - đang chạy 1 job → khóa toàn bộ nút
 * @param {function} onTrigger - (jobId) — page mở ConfirmModal
 */
const RecurringJobsCard = ({ jobs, isLoading, isTriggering, onTrigger }) => (
  <div>
    <h2 className="font-sans font-bold text-sm text-ink-soft flex items-center gap-2">
      <Clock size={15} /> Tác vụ định kỳ
    </h2>
    <p className="text-xs text-ink-mute mt-0.5 mb-3 leading-relaxed">
      Các tác vụ chạy theo lịch. Bấm chạy khi một tác vụ lỡ nhịp, hoặc khi vừa sửa dữ liệu và muốn thấy kết quả ngay.
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
              <p className="text-sm text-ink">{tenDocDuoc(jobId)}</p>
              <p className="text-xs text-ink-mute mt-0.5 font-mono break-all">{jobId}</p>
            </div>
            <button onClick={() => onTrigger(jobId)} disabled={isTriggering}
              className="flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
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