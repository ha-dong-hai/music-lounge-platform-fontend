import { X, AlertTriangle, Loader2 } from 'lucide-react'

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  danger = true,
  isProcessing = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/10 border border-red-500/30' : 'bg-[#C3B665]/10 border border-[#C3B665]/30'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-[#C3B665]'} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white mb-1">{title}</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#C3B665] text-black hover:bg-[#d4c87f]'
            }`}
          >
            {isProcessing && <Loader2 size={15} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal