import { useState } from 'react'
import { X, Flag, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Tạm dùng các lý do UI — khi BE có enum complaint thật thì thay
const REPORT_REASONS = [
  { value: 'Spam', label: 'Tin nhắn spam / quảng cáo' },
  { value: 'Harassment', label: 'Quấy rối, công kích cá nhân' },
  { value: 'Inappropriate', label: 'Ngôn từ không phù hợp' },
  { value: 'Scam', label: 'Lừa đảo, dụ dập chuyển tiền' },
  { value: 'Other', label: 'Lý do khác' },
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
      toast.success('Đã gửi báo cáo! Quản trị viên sẽ xem xét sớm.')
      onClose()
    } catch (err) {
      toast.error('Gửi báo cáo thất bại. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isSubmitting && onClose()}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <Flag size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Báo cáo vi phạm</h2>
              <p className="text-xs text-gray-500">Báo cáo nội dung chat của buổi livestream này</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form id="report-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* CHỌN LÝ DO */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2.5">
              Lý do báo cáo <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedReason(r.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                    selectedReason === r.value
                      ? 'border-[#C3B665] bg-[#C3B665]/10 text-[#C3B665] font-semibold'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {/* Radio */}
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedReason === r.value ? 'border-[#C3B665]' : 'border-gray-500'
                  }`}>
                    {selectedReason === r.value && <span className="w-2 h-2 rounded-full bg-[#C3B665]" />}
                  </span>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* MÔ TẢ */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2.5">
              Mô tả chi tiết <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Mô tả rõ hành vi vi phạm để chúng tôi xử lý nhanh hơn (VD: ai, gửi gì, lúc nào)..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#C3B665]/50 resize-none disabled:opacity-50 placeholder:text-gray-600"
            />
            <p className={`text-xs mt-1.5 ${description.trim().length > 0 && description.trim().length < 10 ? 'text-yellow-500' : 'text-gray-600'}`}>
              Tối thiểu 10 ký tự ({description.trim().length}/10)
            </p>
          </div>
        </form>

        {/* FOOTER */}
        <div className="flex-none p-5 border-t border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
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
              ? <><Loader2 size={16} className="animate-spin" /> Đang gửi...</>
              : <><Flag size={15} /> Gửi báo cáo</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportModal