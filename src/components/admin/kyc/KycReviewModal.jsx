// src/components/admin/kyc/KycReviewModal.jsx
import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const KycReviewModal = ({ target, isProcessing, onClose, onSubmit }) => {
  const [note, setNote] = useState('')
  const laTuChoi = !target.approve

  // Backend bắt buộc lý do khi TỪ CHỐI — chặn ở đây để user khỏi đi một vòng lỗi
  const submit = (e) => {
    e.preventDefault()
    if (laTuChoi && !note.trim()) {
      toast.error('Từ chối thì phải ghi lý do — người gửi cần biết phải sửa gì.')
      return
    }
    onSubmit(note.trim() || null)
  }

  const tenGiayTo = target.document === 'CitizenCard' ? 'CCCD' : 'hồ sơ thuế'
  const canhBaoThue = target.approve && target.document === 'TaxProfile' && target.item.withholdingWouldStopIfApproved

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={() => !isProcessing && onClose()} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">
            {target.approve ? 'Duyệt' : 'Từ chối'} {tenGiayTo}
          </h2>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-sunken/70 border border-line rounded-lg p-3">
            <p className="text-sm text-ink font-medium">{target.item.fullName}</p>
            <p className="text-xs text-ink-mute mt-0.5">{target.item.email}</p>
          </div>

          {canhBaoThue && (
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-yellow-500/5 border border-yellow-500/30 rounded-lg p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Duyệt hồ sơ thuế này sẽ NGỪNG việc tạm giữ thuế với người đó. Đây là thay đổi về tiền, hãy chắc chắn mã số thuế đúng.
            </p>
          )}

          <div>
            <label className="text-xs text-ink-mute">
              Ghi chú {laTuChoi && <span className="text-danger">* (bắt buộc khi từ chối)</span>}
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} disabled={isProcessing}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 resize-none disabled:opacity-50"
              placeholder={laTuChoi
                ? 'Ví dụ: ảnh mặt sau bị mờ, không đọc được số; hãy chụp lại rõ hơn.'
                : 'Không bắt buộc.'} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isProcessing}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isProcessing}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                target.approve ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              {target.approve ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KycReviewModal