// src/components/owner/VcpmcRoyaltyCard.jsx
//
// KHAI MÃ ĐÃ NỘP TÁC QUYỀN VCPMC cho một buổi diễn — PUT /lounge-shows/{id}/vcpmc-royalty (RequireOwner).
// Backend CHẶN bắt đầu buổi diễn khi chưa có mã này, với MỌI hình thức (D19, StartLoungeShowCommandHandler),
// còn buổi có livestream thì chặn ở lệnh bắt đầu phát.
//
// Vì sao tách thành component: bản trước chỉ có form này ở trang Livestream, mà trang đó chỉ liệt kê buổi
// Online — nên buổi diễn TẠI CHỖ không có chỗ nào khai được mã, nhân viên bấm "Bắt đầu buổi diễn" luôn bị
// từ chối, và cả chuỗi soát vé đêm đó đứt (đo 30/09 trên backend chạy máy). Nay trang Cài đặt buổi diễn
// (mọi hình thức) và trang Livestream dùng chung một khối.
//
// `declared`/`reference` lấy từ operatorInfo của chi tiết buổi diễn (chỉ người vận hành nhận được; khán
// giả nhận null).
import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { setVcpmcRoyalty } from '../../services/showServices'

const VcpmcRoyaltyCard = ({ showId, declared, reference, onSaved }) => {
  const [ma, setMa] = useState('')
  const [dangLuu, setDangLuu] = useState(false)

  const luu = async () => {
    if (!ma.trim()) return
    setDangLuu(true)
    try {
      await setVcpmcRoyalty(showId, ma.trim())
      toast.success('Đã lưu mã tác quyền VCPMC.')
      setMa('')
      // Tải lại chi tiết để khối "đã khai" hiện đúng mã vừa lưu, thay vì phải đoán.
      await onSaved?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không lưu được mã tác quyền.')
    } finally {
      setDangLuu(false)
    }
  }

  return (
    <div className="space-y-3">
      {declared ? (
        <div className="p-3 bg-sunken/70 border border-line">
          <p className="text-xs text-ink-mute">Đã khai mã tác quyền VCPMC</p>
          <p className="text-sm text-ink mt-0.5 break-all">{reference || '(đã khai, không đọc lại được mã)'}</p>
          <p className="text-[11px] text-ink-mute mt-1">Khai lại sẽ ghi đè mã trên.</p>
        </div>
      ) : (
        <p className="text-xs text-warning leading-relaxed">
          Chưa khai. Buổi diễn sẽ KHÔNG bắt đầu được (kể cả soát vé vào cửa) cho tới khi có mã này.
        </p>
      )}
      <div className="flex gap-2">
        <input aria-label="Mã khai báo bản quyền VCPMC"
          value={ma}
          onChange={(e) => setMa(e.target.value)}
          placeholder={declared ? 'Nhập mã mới để thay mã đang khai' : 'Mã tham chiếu đã thanh toán tác quyền VCPMC'}
          className="flex-1 px-3 py-2 bg-page border border-line text-sm text-ink placeholder:text-ink-mute"
        />
        <button
          onClick={luu}
          disabled={dangLuu || !ma.trim()}
          className="flex items-center gap-1.5 disabled:opacity-50 justify-center min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp"
        >
          {dangLuu ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          {declared ? 'Thay mã' : 'Lưu VCPMC'}
        </button>
      </div>
    </div>
  )
}

export default VcpmcRoyaltyCard
