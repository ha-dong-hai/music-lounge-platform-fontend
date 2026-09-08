import { useState, useRef, useEffect } from 'react'
import { Send, DollarSign, Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import DonateModal from './DonateModal'

const ChatPanel = ({ messages, performers, onSendMessage, onSendDonation }) => {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  // TỰ ĐỘNG SCROLL XUỐNG DƯỚI KHI CÓ MESSAGE MỚI
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSendMessage(text.trim())
    setText('')
    setShowEmoji(false)
  }

  const handleEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full">
      
      {/* HEADER */}
      <div className="flex-none px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-sm">Live Chat</h3>
        <button 
          onClick={() => setShowDonate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C3B665] text-black text-xs font-bold hover:bg-[#d4c87f] transition-colors"
        >
          <DollarSign size={14} /> Donate
        </button>
      </div>

      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
        {messages.map((msg, idx) => (
          msg.type === 'donate' ? (
            // MESSAGE DONATE (Nổi bật)
            <div key={idx} className="flex items-start gap-2 bg-[#C3B665]/10 border border-[#C3B665]/20 p-2 rounded-lg">
              <img src={msg.user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.user?.name}`} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#C3B665] truncate">{msg.user?.name} <span className="text-white font-normal">donated {msg.amount?.toLocaleString('vi-VN')}đ</span></p>
                <p className="text-xs text-gray-300 truncate">to {msg.performerName}: "{msg.message}"</p>
              </div>
            </div>
          ) : (
            // MESSAGE CHAT THƯỜNG
            <div key={idx} className="flex items-start gap-2">
              <img src={msg.user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.user?.name}`} className="w-6 h-6 rounded-full flex-shrink-0 border border-gray-700" alt="" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 truncate">{msg.user?.name}</p>
                <p className="text-sm text-white break-words">{msg.content}</p>
              </div>
            </div>
          )
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="flex-none border-t border-gray-800 p-3 relative">
        
        {showEmoji && (
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50" style={{ maxWidth: '350px', margin: '0 auto' }}>
            <EmojiPicker 
              onEmojiClick={handleEmojiClick} 
              theme="dark" 
              height={300} 
              width="100%"
              searchDisabled={false}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-2 rounded-lg transition-colors ${showEmoji ? 'text-[#C3B665] bg-gray-800' : 'text-gray-400 hover:text-white'}`}>
            <Smile size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#C3B665] placeholder:text-gray-500"
          />
          <button type="submit" className="p-2 text-[#C3B665] hover:text-[#d4c87f] transition-colors disabled:opacity-30" disabled={!text.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* DONATE MODAL */}
      {showDonate && (
        <DonateModal 
          performers={performers}
          onClose={() => setShowDonate(false)}
          onSendDonation={onSendDonation}
        />
      )}
    </div>
  )
}

export default ChatPanel