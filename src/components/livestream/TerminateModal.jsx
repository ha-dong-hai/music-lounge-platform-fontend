// src/components/livestream/TerminateModal.jsx
// CẮT SÓNG (W22) — chỉ Admin, lý do bắt buộc, KHÔNG hoàn tác.
// Trạng thái Terminated là TRẠNG THÁI CUỐI: sau khi cắt, stream không thể phát lại và buổi diễn bị
// đồng bộ sang Ended. Backend ghi lại ai cắt và lý do, rồi thông báo cho mọi người đang xem qua
// SignalR để client ngừng gọi HLS. Vì vậy không có nút "bật lại".
// Modal tự quản lý do (unmount tự reset) — page lo gọi API.
import { useState } from 'react'
import { X, Loader2, ShieldOff } from 'lucide-react'
import toast from 'react-hot-toast'

const TerminateModal = ({ isProcessing, onClose, onConfirm }) => {
  const [lyDo, setLyDo] = useState('')

  const xacNhan = () => {
    if (!lyDo.trim()) {
      toast.error('Phải ghi lý do cắt sóng — lý do được lưu lại cùng tên người cắt.')
      return
    }
    onConfirm(lyDo.trim())
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/85 backdrop-blur-sm" onClick={() => !isProcessing && onClose()} />
      <div className="relative bg-card border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-danger flex items-center gap-2">
            <ShieldOff size={19} /> Cắt sóng buổi phát này?
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-ink-soft leading-relaxed">
            Buổi phát sẽ dừng NGAY và <strong className="text-danger">không phát lại được</strong> —
            đây là trạng thái cuối. Buổi diễn cũng bị chuyển sang đã kết thúc, và mọi người đang
            xem bị ngắt.
          </p>

          <div>
            <label className="text-xs text-ink-mute">
              Lý do <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={lyDo}
              maxLength={500}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder="Nội dung vi phạm cụ thể là gì"
              className="mt-1 w-full px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink resize-none focus:outline-none focus:border-red-500/50"
            />
            <p className="text-xs text-ink-mute mt-1">Lý do được lưu lại cùng tên người cắt.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              onClick={xacNhan}
              disabled={isProcessing || !lyDo.trim()}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing && <Loader2 size={16} className="animate-spin" />} Cắt sóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TerminateModal