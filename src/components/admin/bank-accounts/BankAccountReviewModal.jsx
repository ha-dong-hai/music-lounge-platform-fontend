import { useState } from 'react'
import { X, Check, Loader2, Landmark, Star, AlertCircle } from 'lucide-react'

const BankAccountReviewModal = ({ account, onClose, onDecision, isProcessing }) => {
  const [note, setNote] = useState('')

  if (!account) return null

  // Checklist tín hiệu xác minh — trợ giúp quyết định của admin
  const checklist = [
    {
      label: 'Account holder matches owner',
      ok: account.holderNameMatches,
      detail: `"${account.accountHolder}" vs "${account.expectedAccountHolder}"`,
    },
    { label: 'Owner identity approved', ok: account.ownerIdentityApproved, detail: null },
    { label: 'Account number readable', ok: !account.accountNumberUnreadable, detail: account.accountNumberUnreadable ? 'OCR could not read the number' : null },
  ]
  const hasRedFlag = checklist.some(c => !c.ok)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-center gap-3 p-5 border-b border-gray-800">
          <div className="w-11 h-11 rounded-xl bg-[#C3B665]/10 border border-[#C3B665]/30 flex items-center justify-center flex-shrink-0">
            <Landmark size={22} className="text-[#C3B665]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Bank Account Review</h2>
            <p className="text-sm text-gray-500 truncate">
              {account.bankName} · {account.accountNumberMasked}
            </p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Info: lounge + owner + default */}
          <div className="bg-black/30 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Lounge</span>
              <span className="text-gray-200 font-medium text-right truncate">{account.loungeName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Owner</span>
              <span className="text-gray-200 font-medium text-right truncate">{account.ownerName}</span>
            </div>
            {account.isDefault && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Payout account</span>
                <span className="text-[#C3B665] font-bold flex items-center gap-1">
                  <Star size={12} className="fill-[#C3B665]" /> Default
                </span>
              </div>
            )}
          </div>

          {/* Cảnh báo red flag */}
          {hasRedFlag && (
            <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/25 rounded-lg p-3">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300/90">
                This account has failed verification signals — review carefully before approving.
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.label} className={`flex items-start gap-3 p-3 rounded-lg border ${item.ok ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/25'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                  {item.ok
                    ? <Check size={13} strokeWidth={3} className="text-green-400" />
                    : <X size={13} strokeWidth={3} className="text-red-400" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${item.ok ? 'text-gray-200' : 'text-red-300'}`}>{item.label}</p>
                  {item.detail && <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Review note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!!isProcessing}
              placeholder="Reason for approval / rejection..."
              className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* FOOTER — approve=true / reject=false theo contract BE */}
        <div className="flex-none flex gap-3 p-5 border-t border-gray-800">
          <button
            onClick={() => onDecision(true, note)}
            disabled={!!isProcessing}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === true
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><Check size={18} strokeWidth={3} /> Approve</>}
          </button>
          <button
            onClick={() => onDecision(false, note)}
            disabled={!!isProcessing}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === false
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><X size={18} strokeWidth={3} /> Reject</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankAccountReviewModal