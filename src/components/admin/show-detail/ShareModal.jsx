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
      <div className="absolute inset-0 bg-ink/80"></div>
      <div className="relative bg-card border border-line w-full max-w-md p-6 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-ink">Chia sẻ buổi diễn</h2>
          <button onClick={onClose} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft transition-colors" aria-label="Đóng"><X size={20} /></button>
        </div>
        <p className="text-ink-soft text-sm mb-3">Sao chép đường link bên dưới để gửi cho bạn bè:</p>
        <div className="flex items-center gap-2 bg-page border border-line p-2 pl-4">
          <span className="text-ink-soft text-sm flex-1 truncate">{window.location.href}</span>
          <button onClick={handleCopyLink} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-1.5 ${isCopied ? 'bg-success text-lamp' : 'bg-ink text-lamp hover:bg-board'}`}>
            {isCopied ? <><Check size={14} /> Đã copy</> : <><Copy size={14} /> Sao chép</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareModal