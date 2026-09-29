// src/components/admin/venues/IssuePenaltyModal.jsx
//
// GHI CHÚ CHO ĐỘI FE — ĐÂY LÀ HÀNH ĐỘNG CHẶN VIỆC KINH DOANH CỦA NGƯỜI KHÁC:
// - Đình chỉ và Cấm làm phòng trà KHÔNG mở buổi diễn mới và KHÔNG bán vé được. Vì vậy màn này nói
//   rõ hiệu lực của từng mức trước khi bấm, thay vì chỉ có một danh sách chọn khô khan.
// - `reason` BẮT BUỘC (tối đa 1000 ký tự): chủ phòng trà đọc đúng câu này để biết mình sai gì và có
//   căn cứ khiếu nại. Viết "vi phạm quy định" là vô nghĩa với họ.
// - `suspensionDays` CHỈ bắt buộc với Suspension và phải > 0. Gửi kèm ở mức Warning/Ban là gửi thứ
//   backend không đọc, nên form chỉ hiện ô đó khi chọn Đình chỉ.
// - KHÔNG CÓ endpoint gỡ án phạt. Ra án là chủ phòng trà chỉ còn đường khiếu nại — nói trước.
// - Backend trả 201 kèm id án phạt, KHÔNG có GET /venue-penalties/{id}: chủ phòng trà tra lại qua
//   danh sách của họ. Đừng cố điều hướng tới một trang chi tiết không tồn tại.
import { useState } from 'react'
import { X, Loader2, ShieldAlert, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { issuePenalty } from '../../../services/penaltyServices'

const MUC = [
  {
    value: 'Warning',
    label: 'Cảnh cáo',
    hieuLuc: 'Phòng trà vẫn hoạt động bình thường. Đây là lần nhắc chính thức, được lưu vào hồ sơ.',
    mau: 'border-yellow-500/40 bg-yellow-500/5 text-warning',
  },
  {
    value: 'Suspension',
    label: 'Đình chỉ có thời hạn',
    hieuLuc: 'Trong thời gian đình chỉ: KHÔNG mở buổi diễn mới và KHÔNG bán vé. Buổi đã bán vé vẫn phải xử lý theo chính sách hoàn tiền.',
    mau: 'border-orange-500/40 bg-orange-500/5 text-orange-700',
  },
  {
    value: 'Ban',
    label: 'Cấm',
    hieuLuc: 'Chặn vô thời hạn. Đây là mức nặng nhất và không có ngày tự hết hiệu lực.',
    mau: 'border-red-500/40 bg-red-500/5 text-danger',
  },
]

const IssuePenaltyModal = ({ venue, onClose, onSaved }) => {
  const [penaltyType, setPenaltyType] = useState('Warning')
  const [reason, setReason] = useState('')
  const [evidenceRef, setEvidenceRef] = useState('')
  const [suspensionDays, setSuspensionDays] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const mucDangChon = MUC.find((m) => m.value === penaltyType)

  const submit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Phải ghi lý do phạt — chủ phòng trà đọc đúng câu này.')
      return
    }
    if (penaltyType === 'Suspension' && (!suspensionDays || Number(suspensionDays) <= 0)) {
      toast.error('Đình chỉ cần số ngày lớn hơn 0.')
      return
    }
    setIsBusy(true)
    try {
      await issuePenalty({
        loungeId: venue.id ?? venue.loungeId,
        penaltyType,
        reason: reason.trim(),
        evidenceRef: evidenceRef.trim() || null,
        // Chỉ gửi số ngày cho Suspension; hai mức kia backend không đọc trường này.
        suspensionDays: penaltyType === 'Suspension' ? Number(suspensionDays) : null,
      })
      toast.success(`Đã ra án ${mucDangChon?.label.toLowerCase()} cho ${venue.name}.`)
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không ra được án phạt.', { duration: 6000 })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={() => !isBusy && onClose()} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex-none flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2 min-w-0">
            <ShieldAlert size={19} className="text-danger flex-shrink-0" />
            <span className="truncate">Ra án phạt · {venue.name}</span>
          </h2>
          <button onClick={onClose} disabled={isBusy}
            className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs text-ink-mute">Mức phạt</label>
            <div className="mt-2 space-y-2">
              {MUC.map((m) => (
                <button key={m.value} type="button" onClick={() => setPenaltyType(m.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    penaltyType === m.value ? m.mau : 'border-line hover:border-line-strong text-ink-soft'
                  }`}>
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="text-xs text-ink-soft mt-1 leading-relaxed">{m.hieuLuc}</p>
                </button>
              ))}
            </div>
          </div>

          {penaltyType === 'Suspension' && (
            <div>
              <label className="text-xs text-ink-mute">Số ngày đình chỉ <span className="text-danger">*</span></label>
              <input type="number" min="1" value={suspensionDays}
                onChange={(e) => setSuspensionDays(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 tabular-nums" />
            </div>
          )}

          <div>
            <label className="text-xs text-ink-mute">Lý do <span className="text-danger">*</span></label>
            <textarea rows={4} value={reason} maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu cụ thể việc đã xảy ra, ngày nào, buổi diễn nào — chủ phòng trà dùng đúng câu này để sửa hoặc để khiếu nại."
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink resize-none focus:outline-none focus:border-brand/50" />
            <p className="text-xs text-ink-mute mt-1">{reason.length}/1000 ký tự</p>
          </div>

          <div>
            <label className="text-xs text-ink-mute">Dẫn chứng <span className="text-ink-mute">(không bắt buộc)</span></label>
            <input value={evidenceRef} maxLength={500}
              onChange={(e) => setEvidenceRef(e.target.value)}
              placeholder="Mã báo cáo vi phạm, liên kết ảnh chụp, số biên bản..."
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50" />
          </div>

          <p className="text-xs text-danger/90 flex items-start gap-1.5 leading-relaxed bg-red-500/5 border border-red-500/30 rounded-lg p-3">
            <AlertTriangle size={13} className="mt-px flex-shrink-0" />
            Không có đường gỡ án phạt. Sau khi ra án, chủ phòng trà chỉ còn cách khiếu nại trong thời
            hạn quy định.
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50">
              {isBusy && <Loader2 size={16} className="animate-spin" />} Ra án phạt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IssuePenaltyModal
