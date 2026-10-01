// src/components/admin/penalty-appeals/PenaltyAppealReviewModal.jsx
import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { PENALTY_TYPE_VIEW } from './PenaltyBadges'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'

/**
 * Modal quyết định khiếu nại — tự quản reviewNote (unmount tự reset)
 * HAI QUYẾT ĐỊNH, KHÔNG ĐỐI XỨNG VỀ HẬU QUẢ:
 *   Overturned = HUỶ án phạt → phòng trà bị đình chỉ sẽ hoạt động lại (nút XANH)
 *   Upheld     = GIỮ NGUYÊN  → án phạt tiếp tục hiệu lực, không khiếu nại lại được (nút TRUNG TÍNH)
 * reviewNote BẮT BUỘC cho cả hai: "bác đơn" không kèm lý do là câu trả lời vô nghĩa.
 *
 * @param {object} target - { item, decision: 'Overturned'|'Upheld' }
 * @param {boolean} isProcessing
 * @param {function} onClose
 * @param {function} onSubmit - (reviewNote) => page gọi reviewPenaltyAppeal
 */
const PenaltyAppealReviewModal = ({ target, isProcessing, onClose, onSubmit }) => {
  const [reviewNote, setReviewNote] = useState('')
  const laHuy = target.decision === 'Overturned'
  const item = target.item

  const submit = (e) => {
    e.preventDefault()
    if (!reviewNote.trim()) {
      toast.error('Phải ghi lý do — chủ phòng trà đọc đúng câu này để hiểu quyết định.')
      return
    }
    onSubmit(reviewNote.trim())
  }

  return (
    <HopThoai onDong={onClose} dongKhiBamNgoai={false} className="max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex-none flex justify-between items-center p-5 border-b border-line">
          <TieuDeHop><h2 className="text-3xl text-ink">
            {laHuy ? 'Huỷ án phạt này?' : 'Giữ nguyên án phạt?'}
          </h2></TieuDeHop>
          <button onClick={onClose} disabled={isProcessing}
            className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3 bg-sunken/80 border border-line space-y-1.5">
            <p className="text-sm text-ink">{item.loungeName}</p>
            <p className="text-xs text-ink-soft">
              {PENALTY_TYPE_VIEW[item.penaltyType]?.label ?? item.penaltyType}
              {item.suspensionDays ? ` · ${item.suspensionDays} ngày` : ''}
            </p>
            <p className="text-xs text-ink-mute leading-relaxed">Lý do phạt: {item.reason}</p>
            {item.appealReason && (
              <p className="text-xs text-ink-soft italic leading-relaxed pt-1.5 border-t border-line">
                Chủ phòng trà khiếu nại: “{item.appealReason}”
              </p>
            )}
          </div>

          <p className={`text-xs flex items-start gap-1.5 leading-relaxed p-3 border ${
            laHuy ? 'text-success bg-success/5 border-success/30' : 'text-ink-soft bg-sunken/40 border-line'
          }`}>
            <AlertTriangle size={13} className="mt-px flex-shrink-0" />
            {laHuy
              ? 'Án phạt bị huỷ. Nếu phòng trà đang bị đình chỉ thì sẽ hoạt động trở lại ngay.'
              : 'Án phạt tiếp tục có hiệu lực như cũ. Chủ phòng trà không khiếu nại lại được.'}
          </p>

          <div>
            <label className="text-xs text-ink-mute">Lý do quyết định <span className="text-danger">*</span></label>
            <textarea aria-label="Lý do quyết định" rows={4} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} disabled={isProcessing}
              placeholder={laHuy
                ? 'VD: đã xem lại bằng chứng, sự việc do lỗi hệ thống chứ không do phòng trà'
                : 'VD: bằng chứng chủ phòng trà đưa ra không bác được sự việc đã ghi nhận ngày 12/09'}
              className="mt-1 w-full resize-none disabled:opacity-50 min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isProcessing}
              className="inline-flex flex-1 disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              Huỷ bỏ
            </button>
            <button type="submit" disabled={isProcessing}
              className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                laHuy ? 'bg-success text-lamp hover:bg-success' : 'bg-line text-lamp hover:bg-line-strong'
              }`}>
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              {laHuy ? 'Huỷ án phạt' : 'Giữ nguyên'}
            </button>
          </div>
        </form>
      </HopThoai>
  )
}

export default PenaltyAppealReviewModal