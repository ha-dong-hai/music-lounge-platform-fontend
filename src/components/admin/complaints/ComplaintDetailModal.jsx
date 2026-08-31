import { X, Phone, Paperclip, User, ShieldCheck, Clock } from 'lucide-react'
import dayjs from 'dayjs'
import { CategoryBadge, StatusBadge, TARGET_TYPE_LABELS } from './ComplaintBadges'

// Component thuần UI: nhận complaint + onClose từ cha
const ComplaintDetailModal = ({ complaint, onClose }) => {
  if (!complaint) return null
  const c = complaint
  const isResolved = !!c.resolvedAt || c.status === 'Resolved'
  const evidences = Array.isArray(c.evidenceUrls) ? c.evidenceUrls : []

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="flex-none flex justify-between items-start p-6 border-b border-gray-800">
          <div>
            <p className="text-sm text-gray-500 mb-1">Chi tiết Khiếu nại</p>
            <h2 className="text-xl font-bold text-white font-mono">#{c.id}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Đối tượng bị khiếu nại</p>
              <p className="text-sm text-white font-medium">
                {TARGET_TYPE_LABELS[c.targetType] || c.targetType} <span className="text-gray-500">#{c.targetId}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Danh mục</p>
              <CategoryBadge category={c.category} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Trạng thái</p>
              <StatusBadge status={c.status} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Thời gian gửi</p>
              <p className="text-sm text-white">{dayjs(c.createdAt).format('HH:mm:ss DD/MM/YYYY')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Người gửi</p>
              <p className="text-sm text-white font-medium flex items-center gap-1.5">
                <User size={13} className="text-gray-500" />
                {c.complainantName || <span className="italic text-gray-500">Ẩn danh</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">SĐT liên hệ</p>
              <p className="text-sm text-white font-mono flex items-center gap-1.5">
                <Phone size={13} className="text-gray-500" />
                {c.contactPhone || '—'}
              </p>
            </div>
          </div>

          {/* NỘI DUNG KHIẾU NẠI */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Nội dung khiếu nại</p>
            <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 p-3 rounded-md whitespace-pre-line">
              {c.description || 'Không có nội dung'}
            </p>
          </div>

          {/* BẰNG CHỨNG */}
          {evidences.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Paperclip size={12} /> Bằng chứng đính kèm
              </p>
              <div className="space-y-1.5">
                {evidences.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                     className="block text-sm text-[#C3B665] underline truncate hover:text-[#d4c87f]">
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* KẾT QUẢ XỬ LÝ */}
          {isResolved ? (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-2">
              <p className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                <ShieldCheck size={14} /> KẾT QUẢ XỬ LÝ
              </p>
              {c.adminName && (
                <p className="text-sm text-gray-300">Người xử lý: <span className="text-white font-medium">{c.adminName}</span></p>
              )}
              {c.resolvedAction && (
                <p className="text-sm text-gray-300">Hành động: <span className="text-white">{c.resolvedAction}</span></p>
              )}
              {c.resolution && (
                <p className="text-sm text-gray-300 bg-black/30 rounded-md p-2.5 italic">"{c.resolution}"</p>
              )}
              {c.resolvedAt && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Clock size={11} /> Hoàn tất lúc {dayjs(c.resolvedAt).format('HH:mm DD/MM/YYYY')}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-300/80 font-medium">⏳ Khiếu nại này chưa được xử lý</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex-none p-6 pt-4 border-t border-gray-800">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComplaintDetailModal