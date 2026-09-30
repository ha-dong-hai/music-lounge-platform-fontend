// src/components/livestream/RatingModal.jsx
//
// HỘP ĐÁNH GIÁ, tự mở khi buổi phát kết thúc (LivestreamWatchPage).
//
// LÀM LẠI 01/10/2026: chọn sao là NHÓM RADIO (mỗi sao có tên "3 sao — Tạm được"; bản cũ là năm nút "Rate 3 star" tiếng
// Anh và chỉ báo bằng màu); bỏ biểu tượng cảm xúc trong nhãn; "Description" → "Nhận xét", tối đa 1000 ký tự
// (RateShowCommandValidator); lỗi (kể cả "đã đánh giá rồi" — 409) in trong hộp thay vì toast; <dialog> của trình duyệt.
import { useState, useEffect, useRef } from 'react'
import { X, Star, Loader2 } from 'lucide-react'

const NHAN_SAO = { 1: 'Rất tệ', 2: 'Chưa ổn', 3: 'Tạm được', 4: 'Hay', 5: 'Tuyệt vời' }
const DAI_NHAN_XET = 1000

const RatingModal = ({ showName, onClose, onSubmit }) => {
  const ref = useRef(null)
  const [diem, setDiem] = useState(0)
  const [nhanXet, setNhanXet] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState(null)
  const [daGui, setDaGui] = useState(false)

  useEffect(() => { ref.current?.showModal() }, [])

  // Màn cảm ơn tự đóng sau 2 giây.
  useEffect(() => {
    if (!daGui) return
    const t = setTimeout(() => ref.current?.close(), 2000)
    return () => clearTimeout(t)
  }, [daGui])

  const gui = async (e) => {
    e.preventDefault()
    if (!diem) { setLoi('Chọn số sao trước khi gửi.'); return }
    setLoi(null)
    setDangGui(true)
    try {
      await onSubmit(diem, nhanXet.trim())
      setDaGui(true)
    } catch (err) {
      setLoi(err.message || 'Chưa gửi được đánh giá. Hãy thử lại.')
      setDangGui(false)
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="danh-gia-td" onClose={onClose}
      onCancel={(e) => { if (dangGui) e.preventDefault() }}
      className="bg-card text-ink border-2 border-ink shadow-lift w-[calc(100vw-2rem)] max-w-md max-h-[90vh] p-0 m-auto backdrop:bg-board/80">
      {daGui ? (
        <div className="p-8 text-center" role="status">
          <h2 id="danh-gia-td" className="text-3xl">Cảm ơn bạn.</h2>
          <p className="mt-2 text-ink-soft">Đánh giá của bạn đã được ghi nhận.</p>
        </div>
      ) : (
        <form onSubmit={gui} noValidate>
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b-2 border-ink">
            <div className="min-w-0">
              <h2 id="danh-gia-td" className="text-3xl">Đánh giá buổi diễn</h2>
              {showName && <p className="text-sm text-ink-soft break-words">{showName}</p>}
            </div>
            <button type="button" onClick={() => ref.current?.close()} disabled={dangGui} aria-label="Để sau, đóng hộp đánh giá"
              className="inline-flex items-center justify-center w-11 h-11 border-2 border-ink hover:bg-ink hover:text-lamp flex-shrink-0 disabled:opacity-60">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <fieldset aria-describedby={loi && !diem ? 'loi-danh-gia' : undefined}>
              <legend className="font-semibold">Buổi phát đã kết thúc. Bạn thấy thế nào?</legend>
              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <label key={i} className="cursor-pointer p-1" title={`${i} sao — ${NHAN_SAO[i]}`}>
                    <input type="radio" name="so-sao" value={i} checked={diem === i} className="sr-only peer"
                      aria-label={`${i} sao — ${NHAN_SAO[i]}`}
                      onChange={() => { setDiem(i); setLoi(null) }} />
                    <Star size={40} aria-hidden="true"
                      className={`peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ink ${i <= diem ? 'fill-ink text-ink' : 'text-ink-mute'}`} />
                  </label>
                ))}
              </div>
              <p className="text-center font-semibold min-h-[24px]" aria-live="polite">{diem ? `${diem} sao — ${NHAN_SAO[diem]}` : ''}</p>
            </fieldset>

            <div>
              <label htmlFor="nhan-xet" className="block font-semibold">Nhận xét <span className="font-normal text-ink-mute">(không bắt buộc)</span></label>
              <textarea id="nhan-xet" rows={3} maxLength={DAI_NHAN_XET} value={nhanXet} onChange={(e) => setNhanXet(e.target.value)} disabled={dangGui}
                aria-describedby="nhan-xet-dem"
                className="mt-1 w-full px-3 py-2 bg-card border-2 border-ink focus:outline-none focus:ring-2 focus:ring-ink resize-none" />
              <p id="nhan-xet-dem" className="text-right text-xs font-mono text-ink-mute">{nhanXet.length}/{DAI_NHAN_XET}</p>
            </div>

            {loi && <p id="loi-danh-gia" role="alert" className="font-semibold text-danger">{loi}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 px-5 py-4 border-t-2 border-ink">
            <button type="button" onClick={() => ref.current?.close()} disabled={dangGui}
              className="flex-1 min-h-[48px] border-2 border-ink font-semibold hover:bg-ink hover:text-lamp disabled:opacity-60">Để sau</button>
            <button type="submit" disabled={dangGui}
              className="flex-1 min-h-[48px] bg-ink text-lamp font-semibold inline-flex items-center justify-center gap-2 hover:bg-board disabled:opacity-60">
              {dangGui && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Gửi đánh giá
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

export default RatingModal
