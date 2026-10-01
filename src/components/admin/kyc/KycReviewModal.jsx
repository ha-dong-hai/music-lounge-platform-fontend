// src/components/admin/kyc/KycReviewModal.jsx
import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'

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
    <HopThoai onDong={onClose} dongKhiBamNgoai={false} className="max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <TieuDeHop><h2 className="text-3xl text-ink">
            {target.approve ? 'Duyệt' : 'Từ chối'} {tenGiayTo}
          </h2></TieuDeHop>
          <button onClick={onClose} disabled={isProcessing} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-sunken/70 border border-line p-3">
            <p className="text-sm text-ink font-medium">{target.item.fullName}</p>
            <p className="text-xs text-ink-mute mt-0.5">{target.item.email}</p>
          </div>

          {canhBaoThue && (
            <p className="text-xs text-warning flex items-start gap-1.5 leading-relaxed bg-warning/5 border border-warning/30 p-3">
              <AlertTriangle size={13} className="mt-px flex-shrink-0" />
              Duyệt hồ sơ thuế này sẽ NGỪNG việc tạm giữ thuế với người đó. Đây là thay đổi về tiền, hãy chắc chắn mã số thuế đúng.
            </p>
          )}

          <div>
            <label className="text-sm font-semibold text-ink">
              Ghi chú {laTuChoi && <span className="text-danger">* (bắt buộc khi từ chối)</span>}
            </label>
            <textarea aria-label={laTuChoi ? "Ghi chú (bắt buộc khi từ chối)" : "Ghi chú"} value={note} onChange={(e) => setNote(e.target.value)} rows={4} disabled={isProcessing}
              className="mt-1 w-full resize-none disabled:opacity-50 min-h-[44px] px-3 py-2 bg-card border-2 border-ink text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
              placeholder={laTuChoi
                ? 'Ví dụ: ảnh mặt sau bị mờ, không đọc được số; hãy chụp lại rõ hơn.'
                : 'Không bắt buộc.'} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isProcessing}
              className="inline-flex flex-1 disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
              Huỷ
            </button>
            <button type="submit" disabled={isProcessing}
              className={`flex-1 py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                target.approve ? 'bg-success text-lamp hover:bg-success' : 'bg-danger text-lamp hover:bg-danger'}`}>
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              {target.approve ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </HopThoai>
  )
}

export default KycReviewModal