import { useState, useEffect } from 'react'
import { X, Star, Loader2, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'

const RATING_LABELS = {
  1: 'Rất tệ 😞',
  2: 'Chưa ổn lắm 😕',
  3: 'Tạm được 🙂',
  4: 'Rất hay! 😃',
  5: 'Tuyệt vời! 🤩',
}

const RatingModal = ({ showName, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0) // preview sao khi rê chuột
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setIsSubmitted] = useState(false)

  // Màn cảm ơn → tự động đóng sau 2s
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(onClose, 2000)
    return () => clearTimeout(t)
  }, [submitted, onClose])

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Vui lòng chọn số sao!')
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(rating, comment.trim())
      setIsSubmitted(true) // chuyển màn cảm ơn → tự đóng
    } catch (err) {
      toast.error('Gửi đánh giá không thành công. Vui lòng thử lại.')
      setIsSubmitting(false)
    }
  }

  // ===== MÀN CẢM ƠN (sau khi gửi thành công) =====
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ink/80"></div>
        <div className="relative bg-card border border-ink/40 w-full max-w-sm p-8 text-center shadow-soft animate-in fade-in zoom-in-95 duration-300">
          <PartyPopper size={44} className="mx-auto text-ink mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Cảm ơn bạn!</h2>
          <p className="text-sm text-ink-soft">Đánh giá của bạn đã được ghi nhận.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => !isSubmitting && onClose()}>
      <div className="absolute inset-0 bg-ink/80"></div>

      <div className="relative bg-card border border-line w-full max-w-md max-h-[90vh] flex flex-col shadow-soft animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-start justify-between p-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ink/10 border border-ink/30 flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-ink" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink">Đánh giá buổi phát trực tiếp</h2>
              <p className="text-xs text-ink-mute truncate">{showName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-sunken text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm text-ink-soft mb-6 text-center">
            Buổi phát đã kết thúc. Trải nghiệm của bạn thế nào?
          </p>

          {/* STAR RATING — hover preview, click chọn */}
          <div className="flex justify-center gap-1.5 mb-3" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                disabled={isSubmitting}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                className="p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                aria-label={`Rate ${i} star`}
              >
                <Star
                  size={38}
                  className={`transition-colors ${i <= (hover || rating) ? 'fill-ink text-ink' : 'text-ink-mute'}`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-ink min-h-[20px] mb-6">
            {RATING_LABELS[hover || rating] || 'Chọn số sao'}
          </p>

          {/* COMMENT (tùy chọn) */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              Description <span className="text-ink-mute">(không bắt buộc)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              placeholder="Bạn thích điều gì, hoặc muốn cải thiện điều gì ở buổi phát này…"
              className="w-full px-4 py-3 bg-page border border-line text-ink text-sm focus:outline-none focus:border-ink/50 resize-none disabled:opacity-50 placeholder:text-ink-mute"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-none p-5 border-t border-line flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 border border-line-strong text-ink-soft font-medium hover:bg-sunken transition-colors disabled:opacity-50"
          >
            Để sau
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 py-2.5 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-ink text-lamp hover:bg-board"
          >
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Đang gửi…</> : <> Gửi đánh giá</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingModal