// src/components/admin/complaints/ResolveComplaintModal.jsx
//
// GHI CHÚ CHO ĐỘI FE — BỐN HÀNH ĐỘNG NÀY CÓ HẬU QUẢ THẬT, KHÔNG PHẢI ĐỔI NHÃN TRONG DB:
//   Refund          → hoàn tiền vé của RIÊNG người khiếu nại. Buổi diễn vẫn diễn ra bình thường.
//   IssueWarning    → tạo án phạt cảnh cáo cho phòng trà. Phòng trà thấy nó trong mục Án phạt và
//                     khiếu nại lại được.
//   TakeDownContent → HUỶ HẲN buổi diễn và hoàn 100% cho MỌI người đang giữ vé. Đây là hành động
//                     nặng nhất trong hệ thống, nên cần bước xác nhận riêng, không bấm một nhịp.
//   Dismiss         → bỏ qua, không làm gì thêm.
// Vì vậy: chọn hành động xong vẫn phải bấm nút xác nhận cuối, và riêng TakeDownContent phải gõ chữ
// để xác nhận — cùng một cú bấm nhầm ở đây làm hàng chục người mất vé.
import { useState } from 'react'
import { Loader2, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolveComplaint } from '../../../services/complaintServices'

const inputCls = 'mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C3B665]/50'

const STATUSES = [
  { value: 'Investigating', label: 'Đang xem xét', hint: 'Ghi nhận là đang điều tra, chưa kết luận. Không tạo hậu quả nào.' },
  { value: 'Resolved', label: 'Đã xử lý', hint: 'Kết luận khiếu nại là có cơ sở và chọn một hành động bên dưới.' },
  { value: 'Rejected', label: 'Từ chối', hint: 'Kết luận khiếu nại không có cơ sở. Không tạo hậu quả nào.' },
]

const ACTIONS = [
  { value: 'Dismiss', label: 'Bỏ qua', danger: false,
    desc: 'Không làm gì thêm. Dùng khi khiếu nại đã được giải quyết ngoài hệ thống.' },
  { value: 'Refund', label: 'Hoàn tiền cho người khiếu nại', danger: false,
    desc: 'Hoàn tiền vé của RIÊNG người khiếu nại. Buổi diễn vẫn diễn ra, người khác không bị ảnh hưởng.' },
  { value: 'IssueWarning', label: 'Cảnh cáo phòng trà', danger: false,
    desc: 'Tạo án phạt cảnh cáo. Phòng trà nhìn thấy và có quyền khiếu nại lại.' },
  { value: 'TakeDownContent', label: 'Huỷ buổi diễn và hoàn tiền tất cả', danger: true,
    desc: 'HUỶ HẲN buổi diễn và hoàn 100% cho MỌI người đang giữ vé. Không hoàn tác được.' },
]

const XAC_NHAN = 'HUY BUOI DIEN'

const ResolveComplaintModal = ({ complaint, onClose, onSaved }) => {
  const [status, setStatus] = useState('Investigating')
  const [action, setAction] = useState('Dismiss')
  const [resolution, setResolution] = useState('')
  const [goXacNhan, setGoXacNhan] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const canResolved = status === 'Resolved'
  const hanhDong = ACTIONS.find((a) => a.value === action)
  const canGoXacNhan = canResolved && action === 'TakeDownContent'
  const chuaGoDung = canGoXacNhan && goXacNhan.trim().toUpperCase() !== XAC_NHAN

  const submit = async (e) => {
    e.preventDefault()
    if (chuaGoDung) {
      toast.error(`Hãy gõ "${XAC_NHAN}" để xác nhận huỷ buổi diễn.`)
      return
    }
    setIsBusy(true)
    try {
      await resolveComplaint(complaint.id, {
        status,
        resolution: resolution.trim() || null,
        // resolvedAction chỉ có ý nghĩa khi kết luận là Resolved.
        resolvedAction: canResolved ? action : null,
      })
      toast.success('Đã xử lý khiếu nại.')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không xử lý được khiếu nại.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-white">Xử lý khiếu nại #{complaint.id}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{complaint.targetType} #{complaint.targetId}</p>
          </div>
          <button onClick={onClose} disabled={isBusy} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
          <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Nội dung khiếu nại</p>
            <p className="text-sm text-gray-300 leading-relaxed">{complaint.description}</p>
            {complaint.contactPhone && (
              <p className="text-xs text-gray-500 mt-2">Liên hệ: {complaint.contactPhone}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">Kết luận</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p className="text-xs text-gray-600 mt-1">{STATUSES.find((s) => s.value === status)?.hint}</p>
          </div>

          {canResolved && (
            <div>
              <label className="text-xs text-gray-500">Hành động</label>
              <select value={action} onChange={(e) => { setAction(e.target.value); setGoXacNhan('') }} className={inputCls}>
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <p className={`text-xs mt-1.5 leading-relaxed ${hanhDong?.danger ? 'text-red-400' : 'text-gray-600'}`}>
                {hanhDong?.danger && <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />}
                {hanhDong?.desc}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500">Phản hồi cho người khiếu nại</label>
            <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={4}
              className={`${inputCls} resize-none`}
              placeholder="Người khiếu nại đọc được nội dung này khi tra cứu kết quả." />
          </div>

          {canGoXacNhan && (
            <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-red-400 leading-relaxed">
                Hành động này huỷ buổi diễn và hoàn tiền cho tất cả người đang giữ vé. Gõ <strong>{XAC_NHAN}</strong> để xác nhận.
              </p>
              <input value={goXacNhan} onChange={(e) => setGoXacNhan(e.target.value)}
                className="mt-2 w-full px-3 py-2 bg-black border border-red-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
              Huỷ
            </button>
            <button type="submit" disabled={isBusy || chuaGoDung}
              className={`flex-1 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                canGoXacNhan ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#C3B665] text-black hover:bg-[#d4c87f]'}`}>
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {isBusy ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResolveComplaintModal
