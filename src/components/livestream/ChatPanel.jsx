import { useState, useRef, useEffect } from 'react'
// 01/10/2026: chữ tiếng Anh sót ("donated … to", "(You)", "new message") đổi sang tiếng Việt; dòng ủng hộ không in tên
// nghệ sĩ nữa (DonationAlertDto không có trường đó — bản cũ in "to undefined"); nút ủng hộ có chữ, không dùng ký hiệu
// đô-la cho sản phẩm tính tiền đồng; menu ba chấm chỉ có MỘT mục nên thay bằng nút "Báo cáo" đứng thẳng.
import { Send, Heart, Smile, ChevronDown, Flag } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import DonateModal from './DonateModal'
import ReportModal from './ReportModal'
import TopDonorsBar from './TopDonorsBar'
import { anhChuCai } from '../../utils/anhChuCai'

const ChatPanel = ({ messages, performers, onSendMessage, onSendDonation, onReport }) => {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const chatContainerRef = useRef(null)
  const inputRef = useRef(null)

  // SMART SCROLL: user đang ở đáy hay đang cuộn lên đọc?
  const isNearBottomRef = useRef(true)
  const [unreadCount, setUnreadCount] = useState(0)


  // 1. THEO DÕI VỊ TRÍ CUỘN (chỉ của container chat)
  const handleScroll = () => {
    const el = chatContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isNearBottomRef.current = distanceFromBottom < 80
    if (isNearBottomRef.current) setUnreadCount(0)
  }

  // 2. TIN MỚI → chỉ cuộn container chat, KHÔNG đụng page
  useEffect(() => {
    const el = chatContainerRef.current
    if (!el) return
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
    } else {
      setUnreadCount(prev => prev + 1)
    }
  }, [messages])

  const scrollToBottom = () => {
    const el = chatContainerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    setUnreadCount(0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    isNearBottomRef.current = true
    onSendMessage(text.trim())
    setText('')
    setShowEmoji(false)
  }

  const handleEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const handleReportSubmit = async (reason, description) => {
    // Gọi callback từ page (sau này nối API/SignalR ở đó)
    if (onReport) await onReport(reason, description)
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      <div className="flex-none px-4 py-2 border-b border-line flex items-center justify-between">
        <h2 className="font-sans font-bold text-sm">Trò chuyện trực tiếp</h2>
        <button type="button" onClick={() => setShowReport(true)} aria-label="Báo cáo buổi phát này"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm text-ink-soft hover:text-ink hover:bg-sunken">
          <Flag size={15} aria-hidden="true" /> Báo cáo
        </button>
      </div>

      <TopDonorsBar messages={messages} />

      {/* ===== MESSAGE LIST ===== */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          role="log" aria-live="polite" aria-label="Tin nhắn trò chuyện"
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3 chat-scrollbar"
        >
          {messages.map((msg, idx) => (
            msg.type === 'donate' ? (
              <div key={idx} className="flex items-start gap-2 bg-ink/10 border border-ink/20 p-2">
                <img src={msg.user?.avatarUrl || anhChuCai(msg.user?.name)} className="w-6 h-6 flex-shrink-0" alt="" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink truncate">
                    {msg.user?.name || 'Một khán giả'} <span className="font-normal">đã ủng hộ {msg.amount?.toLocaleString('vi-VN')} đ</span>
                  </p>
                  {msg.message && <p className="text-xs text-ink-soft break-words">“{msg.message}”</p>}
                </div>
              </div>
            ) : (
              <div key={idx} className="flex items-start gap-2">
                <img src={msg.user?.avatarUrl || anhChuCai(msg.user?.name)} className="w-6 h-6 flex-shrink-0 border border-line" alt="" />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${msg.isMine ? 'text-ink' : 'text-ink-soft'}`}>
                    {msg.user?.name}{msg.isMine && ' (bạn)'}
                  </p>
                  <p className="text-sm text-ink break-words">{msg.content}</p>
                </div>
              </div>
            )
          ))}
        </div>

        {/* NÚT "TIN NHẮN MỚI" */}
        {unreadCount > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1.5 bg-ink text-lamp text-xs font-bold shadow-soft shadow-black/50 hover:bg-board transition-colors z-10"
          >
            <ChevronDown size={14} />
            {unreadCount} tin nhắn mới
          </button>
        )}
      </div>

      {/* ===== INPUT AREA — Donate nằm bên phải Send ===== */}
      <div className="flex-none border-t border-line p-3 relative">

        {showEmoji && (
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50" style={{ maxWidth: '350px', margin: '0 auto' }}>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="light"
              height={300}
              width="100%"
              searchDisabled={false}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`inline-flex items-center justify-center w-11 h-11 transition-colors flex-shrink-0 ${showEmoji ? 'text-ink bg-sunken' : 'text-ink-soft hover:text-ink'}`} aria-label="Chèn biểu tượng cảm xúc" aria-expanded={showEmoji}>
            <Smile size={20} />
          </button>
          <input aria-label="Nhắn gì đó"
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Nhắn gì đó…"
            className="flex-1 min-w-0 min-h-[44px] bg-sunken text-ink text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ink placeholder:text-ink-mute"
          />
          {/* NÚT SEND — donate chuyển sang phải của nó */}
          <button type="submit" className="inline-flex items-center justify-center w-11 h-11 text-ink hover:bg-sunken transition-colors disabled:opacity-30 flex-shrink-0" disabled={!text.trim()} aria-label="Gửi">
            <Send size={20} />
          </button>
          {/* NÚT DONATE — vị trí mới */}
          <button
            type="button"
            onClick={() => setShowDonate(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3 bg-ink text-lamp text-sm font-semibold hover:bg-board transition-colors"
          >
            <Heart size={16} aria-hidden="true" /> Ủng hộ
          </button>
        </form>
      </div>

      {/* ===== MODALS ===== */}
      {showDonate && (
        <DonateModal
          performers={performers}
          onClose={() => setShowDonate(false)}
          onSendDonation={onSendDonation}
        />
      )}

      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  )
}

export default ChatPanel