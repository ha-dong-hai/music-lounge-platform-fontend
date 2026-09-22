import { useState } from 'react'
import { X, Flag, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Tạm dùng các lý do UI — khi BE có enum complaint thật thì thay
const REPORT_REASONS = [
  { value: 'Spam', label: 'Tin nhắn rác / quảng cáo' },
  { value: 'Harassment', label: 'Quấy rối và công kích cá nhân' },
  { value: 'Inappropriate', label: 'Ngôn từ không phù hợp' },
  { value: 'Scam', label: 'Lừa đảo' },
  { value: 'Other', label: 'Khác' },
]

const ReportModal = ({ onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState(null)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = selectedReason && description.trim().length >= 10

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedReason, description.trim())
      toast.success('Đã gửi báo cáo. Quản trị viên sẽ xem xét sớm.')
      onClose()
    } catch (err) {
      toast.error('Gửi báo cáo không thành công. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isSubmitting && onClose()}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>

      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-center justify-between p-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <Flag size={18} className="text-danger" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Báo cáo</h2>
              <p className="text-xs text-ink-mute">Báo cáo nội dung của buổi phát này.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form id="report-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* CHỌN LÝ DO */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2.5">
              Reason for report <span className="text-danger">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedReason(r.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                    selectedReason === r.value
                      ? 'border-brand bg-brand/10 text-brand-text font-semibold'
                      : 'border-line text-ink-soft hover:border-line-strong'
                  }`}
                >
                  {/* Radio */}
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedReason === r.value ? 'border-brand' : 'border-line-strong'
                  }`}>
                    {selectedReason === r.value && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* MÔ TẢ */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2.5">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Mô tả vấn đề…"
              className="w-full px-4 py-3 bg-page border border-line rounded-xl text-ink text-sm focus:outline-none focus:border-brand/50 resize-none disabled:opacity-50 placeholder:text-ink-mute"
            />
            <p className={`text-xs mt-1.5 ${description.trim().length > 0 && description.trim().length < 10 ? 'text-warning' : 'text-ink-mute'}`}>
              Minimum of 10 characters ({description.trim().length}/10)
            </p>
          </div>
        </form>

        {/* FOOTER */}
        <div className="flex-none p-5 border-t border-line flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="report-form"
            disabled={!canSubmit || isSubmitting}
            className="flex-1 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 text-white hover:bg-red-600"
          >
            {isSubmitting
              ? <><Loader2 size={16} className="animate-spin" /> đang gửi…</>
              : <><Flag size={15} /> Gửi báo cáo</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportModal