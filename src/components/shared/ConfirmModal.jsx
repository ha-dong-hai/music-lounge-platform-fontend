import { X, AlertTriangle, Loader2 } from 'lucide-react'

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  processingText = 'Processing...',
  danger = true,
  isProcessing = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>

      <div
        className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
  
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 hover:bg-sunken rounded-full text-ink-mute hover:text-ink transition-colors disabled:opacity-30 z-10"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* ===== BODY — mọi thứ căn giữa ===== */}
        <div className="px-8 pt-10 pb-8 text-center">

          <div className={`
            relative w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center
            ${danger
              ? 'bg-red-500/10 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
              : 'bg-brand/10 border border-brand/30 shadow-[0_0_30px_rgba(195,182,101,0.15)]'}
          `}>
            <AlertTriangle size={30} className={danger ? 'text-danger' : 'text-brand-text'} />
          </div>

          <h2 className="text-xl font-bold text-ink mb-2">{title}</h2>

          <p className="text-sm text-ink-soft leading-relaxed max-w-[320px] mx-auto mb-8">{message}</p>

          {/* ===== BUTTONS ===== */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 border border-line text-ink-soft rounded-xl font-medium hover:bg-sunken hover:border-line-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Huỷ
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                danger
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
                  : 'bg-brand text-on-brand hover:bg-brand-hover shadow-lg shadow-brand/20'
              }`}
            >
              {isProcessing && <Loader2 size={16} className="animate-spin" />}
              {isProcessing ? processingText : confirmText}
            </button>
          </div>
        </div>

        <div className={`h-1 w-full ${danger ? 'bg-gradient-to-r from-transparent via-red-500/60 to-transparent' : 'bg-gradient-to-r from-transparent via-brand/60 to-transparent'}`} />
      </div>
    </div>
  )
}

export default ConfirmModal