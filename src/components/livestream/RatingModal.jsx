import { useState, useEffect } from 'react'
import { X, Star, Loader2, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'

const RATING_LABELS = {
  1: 'Very bad 😞',
  2: 'Not so good 😕',
  3: 'Okay 🙂',
  4: 'Very good! 😃',
  5: 'Great! 🤩',
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
    if (rating === 0) return toast.error('Please Rate!')
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(rating, comment.trim())
      setIsSubmitted(true) // chuyển màn cảm ơn → tự đóng
    } catch (err) {
      toast.error('Rate Show failed. Try again.')
      setIsSubmitting(false)
    }
  }

  // ===== MÀN CẢM ƠN (sau khi gửi thành công) =====
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>
        <div className="relative bg-card border border-brand/40 rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <PartyPopper size={44} className="mx-auto text-brand-text mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Thank You!</h2>
          <p className="text-sm text-ink-soft">Your review has been recorded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={() => !isSubmitting && onClose()}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>

      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-start justify-between p-5 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center flex-shrink-0">
              <Star size={18} className="text-brand-text" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink">Đánh giá buổi phát trực tiếp</h2>
              <p className="text-xs text-ink-mute truncate">{showName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm text-ink-soft mb-6 text-center">
            The Livestream has ended. How was your experience?
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
                  className={`transition-colors ${i <= (hover || rating) ? 'fill-brand-text text-brand-text' : 'text-ink-mute'}`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-brand-text min-h-[20px] mb-6">
            {RATING_LABELS[hover || rating] || 'Chọn số sao'}
          </p>

          {/* COMMENT (tùy chọn) */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              Description <span className="text-ink-mute">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              placeholder="What you liked or would like to improve about this livestream..."
              className="w-full px-4 py-3 bg-page border border-line rounded-xl text-ink text-sm focus:outline-none focus:border-brand/50 resize-none disabled:opacity-50 placeholder:text-ink-mute"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-none p-5 border-t border-line flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken transition-colors disabled:opacity-50"
          >
            Later
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-brand text-on-brand hover:bg-brand-hover"
          >
            {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <> Review submitted</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingModal