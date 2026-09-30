import { useState } from 'react'
import { X, Check, Loader2, Landmark, Star, AlertCircle } from 'lucide-react'

const BankAccountReviewModal = ({ account, onClose, onDecision, isProcessing }) => {
  const [note, setNote] = useState('')

  if (!account) return null

  // Checklist tín hiệu xác minh — trợ giúp quyết định của admin
  const checklist = [
    {
      label: 'Tên chủ tài khoản khớp chủ phòng trà',
      ok: account.holderNameMatches,
      detail: `"${account.accountHolder}" vs "${account.expectedAccountHolder}"`,
    },
    { label: 'Định danh chủ phòng trà đã được duyệt', ok: account.ownerIdentityApproved, detail: null },
    { label: 'Máy đọc được số tài khoản', ok: !account.accountNumberUnreadable, detail: account.accountNumberUnreadable ? 'Máy không đọc được số tài khoản' : null },
  ]
  const hasRedFlag = checklist.some(c => !c.ok)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="absolute inset-0 bg-board/80"></div>

      <div className="relative bg-board border border-ink w-full max-w-lg max-h-[90vh] flex flex-col shadow-soft" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-center gap-3 p-5 border-b border-ink">
          <div className="w-11 h-11 bg-ink/10 border border-ink/30 flex items-center justify-center flex-shrink-0">
            <Landmark size={22} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl text-lamp">Duyệt tài khoản nhận tiền</h2>
            <p className="text-sm text-ink-soft truncate">
              {account.bankName} · {account.accountNumberMasked}
            </p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-board text-ink-mute disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Info: lounge + owner + default */}
          <div className="bg-board/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-ink-soft">Phòng trà</span>
              <span className="text-ink-mute font-medium text-right truncate">{account.loungeName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-ink-soft">Chủ phòng trà</span>
              <span className="text-ink-mute font-medium text-right truncate">{account.ownerName}</span>
            </div>
            {account.isDefault && (
              <div className="flex justify-between gap-4">
                <span className="text-ink-soft">Tài khoản nhận tiền</span>
                <span className="text-ink font-bold flex items-center gap-1">
                  <Star size={12} className="fill-ink" aria-hidden="true" /> Mặc định
                </span>
              </div>
            )}
          </div>

          {/* Cảnh báo red flag */}
          {hasRedFlag && (
            <div className="flex items-start gap-2 bg-danger/5 border border-danger/25 p-3">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger/90">
                This account has failed verification signals — review carefully before approving.
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.label} className={`flex items-start gap-3 p-3 border ${item.ok ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/25'}`}>
                <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-success/15' : 'bg-danger/15'}`}>
                  {item.ok
                    ? <Check size={13} strokeWidth={3} className="text-success" />
                    : <X size={13} strokeWidth={3} className="text-danger" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${item.ok ? 'text-ink-mute' : 'text-danger'}`}>{item.label}</p>
                  {item.detail && <p className="text-xs text-ink-soft mt-0.5">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-ink-mute mb-2">Ghi chú duyệt (không bắt buộc)</label>
            <textarea aria-label="Ghi chú duyệt (không bắt buộc)"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!!isProcessing}
              placeholder="Lý do duyệt hoặc từ chối…"
              className="w-full px-4 py-2.5 bg-board border border-ink text-lamp text-sm focus:outline-none focus:border-ink/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* FOOTER — approve=true / reject=false theo contract BE */}
        <div className="flex-none flex gap-3 p-5 border-t border-ink">
          <button
            onClick={() => onDecision(true, note)}
            disabled={!!isProcessing}
            className="flex-1 py-3 bg-success text-lamp font-bold hover:bg-success transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === true
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><Check size={18} strokeWidth={3} aria-hidden="true" /> Duyệt</>}
          </button>
          <button
            onClick={() => onDecision(false, note)}
            disabled={!!isProcessing}
            className="flex-1 py-3 bg-danger text-lamp font-bold hover:bg-danger transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === false
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><X size={18} strokeWidth={3} aria-hidden="true" /> Từ chối</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankAccountReviewModal