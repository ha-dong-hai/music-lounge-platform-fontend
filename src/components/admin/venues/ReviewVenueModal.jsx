// src/components/admin/venues/ReviewVenueModal.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Duyệt hồ sơ phòng trà là CỬA CHẶN ĐẦU TIÊN của toàn bộ luồng: phòng trà ở trạng thái Pending
//   không hiện trong danh sách công khai và không mở bán vé được. Không ai duyệt thì chủ phòng trà
//   treo vô thời hạn và mọi màn quản lý của họ vô dụng.
// - Khi TỪ CHỐI, ghi chú là thứ DUY NHẤT cho chủ phòng trà biết phải sửa gì trước khi gửi lại — nên
//   bắt buộc phải điền. "Bị từ chối" không kèm lý do chỉ dẫn tới việc họ gửi lại y nguyên.
// - Nên xem trang công khai và giấy phép kinh doanh trước khi duyệt; phần đó nằm ở bảng bên ngoài.
import { useState } from 'react'
import { Loader2, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { reviewVenue } from '../../../services/adminServices'

const ReviewVenueModal = ({ venue, decision, onClose, onSaved }) => {
  const [reviewNote, setReviewNote] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const laTuChoi = decision === 'Rejected'

  const submit = async (e) => {
    e.preventDefault()
    if (laTuChoi && !reviewNote.trim()) {
      toast.error('Từ chối thì phải ghi lý do — chủ phòng trà cần biết phải sửa gì.')
      return
    }
    setIsBusy(true)
    try {
      await reviewVenue(venue.loungeId ?? venue.id, decision, reviewNote.trim())
      toast.success(laTuChoi ? 'Đã từ chối hồ sơ kèm lý do.' : 'Đã duyệt phòng trà.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được hồ sơ.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">
            {laTuChoi ? 'Từ chối hồ sơ phòng trà' : 'Duyệt phòng trà'}
          </h2>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-sunken/70 border border-line rounded-lg p-3">
            <p className="text-sm text-ink font-medium">{venue.name ?? venue.loungeName}</p>
            {venue.ownerName && <p className="text-xs text-ink-mute mt-0.5">Chủ: {venue.ownerName}</p>}
            {venue.hasBusinessLicense === false && (
              <p className="text-xs text-warning mt-2 flex items-start gap-1.5">
                <AlertTriangle size={12} className="mt-px flex-shrink-0" />
                Hồ sơ này CHƯA có giấy phép kinh doanh.
              </p>
            )}
          </div>

          {!laTuChoi && (
            <p className="text-xs text-ink-mute leading-relaxed">
              Sau khi duyệt, phòng trà hiện trong danh sách công khai và mở bán vé được.
              Hãy xem trang công khai và giấy phép kinh doanh trước khi duyệt.
            </p>
          )}

          <div>
            <label className="text-xs text-ink-mute">
              Ghi chú {laTuChoi && <span className="text-danger">* (bắt buộc khi từ chối)</span>}
            </label>
            <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={4}
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50 resize-none"
              placeholder={laTuChoi
                ? 'Ví dụ: ảnh giấy phép kinh doanh không đọc được; địa chỉ không khớp giấy phép.'
                : 'Không bắt buộc.'} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${
                laTuChoi ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>
              {isBusy ? <Loader2 size={16} className="animate-spin" /> : laTuChoi ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
              {laTuChoi ? 'Từ chối' : 'Duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReviewVenueModal
