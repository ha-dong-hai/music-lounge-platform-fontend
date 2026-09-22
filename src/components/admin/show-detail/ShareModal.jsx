import { useState } from 'react'
import { X, Check, Copy } from 'lucide-react'

const ShareModal = ({ onClose }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-ink">Chia sẻ sự kiện</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft transition-colors"><X size={20} /></button>
        </div>
        <p className="text-ink-soft text-sm mb-3">Sao chép đường link bên dưới để gửi cho bạn bè:</p>
        <div className="flex items-center gap-2 bg-page border border-line rounded-lg p-2 pl-4">
          <span className="text-ink-soft text-sm flex-1 truncate">{window.location.href}</span>
          <button onClick={handleCopyLink} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${isCopied ? 'bg-green-500 text-white' : 'bg-brand text-on-brand hover:bg-brand-hover'}`}>
            {isCopied ? <><Check size={14} /> Đã copy</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal