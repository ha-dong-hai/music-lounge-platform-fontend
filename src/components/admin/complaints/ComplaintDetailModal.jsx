import { X, Phone, Paperclip, User, ShieldCheck, Clock } from 'lucide-react'
import dayjs from 'dayjs'
import { CategoryBadge, StatusBadge, TARGET_TYPE_LABELS } from './ComplaintBadges'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'
import { maNgan } from '../../../utils/format'
import LienKetMuiTen from '../../shared/LienKetMuiTen'

// Component thuần UI: nhận complaint + onClose từ cha
const ComplaintDetailModal = ({ complaint, onClose, onResolve }) => {
  if (!complaint) return null
  const c = complaint
  const isResolved = !!c.resolvedAt || c.status === 'Resolved'
  // Backend khai EvidenceUrls la string? — mot CHUOI chua mang JSON, khong phai mang san.
  // Array.isArray tren chuoi luon false nen anh bang chung truoc day khong bao gio hien.
  const evidences = (() => {
    if (Array.isArray(c.evidenceUrls)) return c.evidenceUrls
    if (typeof c.evidenceUrls !== 'string' || !c.evidenceUrls.trim()) return []
    try {
      const parsed = JSON.parse(c.evidenceUrls)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [c.evidenceUrls]
    } catch {
      // Khong phai JSON hop le: coi nguyen chuoi la 1 duong dan de khong mat bang chung.
      return [c.evidenceUrls]
    }
  })()

  return (
    <HopThoai onDong={onClose} className="max-w-lg max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex-none flex justify-between items-start p-6 border-b border-line">
          <div>
            <p className="text-sm text-ink-mute mb-1">Chi tiết khiếu nại</p>
            <TieuDeHop><h2 className="text-xl text-ink font-mono">#{maNgan(c.id)}</h2></TieuDeHop>
          </div>
          <button onClick={onClose} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Đối tượng bị khiếu nại</p>
              <p className="text-sm text-ink font-medium">
                {TARGET_TYPE_LABELS[c.targetType] || c.targetType} <span className="text-ink-mute">#{maNgan(c.targetId)}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Phân loại</p>
              <CategoryBadge category={c.category} />
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Trạng thái</p>
              <StatusBadge status={c.status} />
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Ngày gửi</p>
              <p className="text-sm text-ink">{dayjs(c.createdAt).format('HH:mm:ss DD/MM/YYYY')}</p>
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Người gửi</p>
              <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                <User size={13} className="text-ink-mute" />
                {c.complainantName || <span className="italic text-ink-mute">Ẩn danh</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Số điện thoại liên hệ</p>
              <p className="text-sm text-ink font-mono flex items-center gap-1.5">
                <Phone size={13} className="text-ink-mute" />
                {c.contactPhone || '—'}
              </p>
            </div>
          </div>

          {/* NỘI DUNG KHIẾU NẠI */}
          <div>
            <p className="text-xs text-ink-mute mb-1.5">Nội dung khiếu nại</p>
            <p className="text-sm text-ink-soft leading-relaxed bg-sunken/50 p-3 rounded-md whitespace-pre-line">
              {c.description || 'None'}
            </p>
          </div>

          {/* BẰNG CHỨNG */}
          {evidences.length > 0 && (
            <div>
              <p className="text-xs text-ink-mute mb-1.5 flex items-center gap-1.5">
                <Paperclip size={12} /> Attached evidence
              </p>
              <div className="space-y-1.5">
                {evidences.map((url, i) => (
                  <LienKetMuiTen key={i} href={url} nho className="max-w-full"><span className="block truncate">{url}</span></LienKetMuiTen>
                ))}
              </div>
            </div>
          )}

          {/* KẾT QUẢ XỬ LÝ */}
          {isResolved ? (
            <div className="bg-success/5 border border-success/20 p-4 space-y-2">
              <p className="text-xs font-bold text-success flex items-center gap-1.5">
                <ShieldCheck size={14} /> RESULT
              </p>
              {c.adminName && (
                <p className="text-sm text-ink-soft">Handler: <span className="text-ink font-medium">{c.adminName}</span></p>
              )}
              {c.resolvedAction && (
                <p className="text-sm text-ink-soft">Action: <span className="text-ink">{c.resolvedAction}</span></p>
              )}
              {c.resolution && (
                <p className="text-sm text-ink-soft bg-sunken/50 rounded-md p-2.5 italic">"{c.resolution}"</p>
              )}
              {c.resolvedAt && (
                <p className="text-xs text-ink-mute flex items-center gap-1.5">
                  <Clock size={11} /> Resolved at {dayjs(c.resolvedAt).format('HH:mm DD/MM/YYYY')}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-warning/5 border border-warning/20 p-4">
              <p className="text-sm text-warning/80 font-medium">⏳ This complaint has not yet been processed.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex-none p-6 pt-4 border-t border-line flex gap-3 flex-wrap">
          <button onClick={onClose} className="inline-flex flex-1 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp">
            Đóng
          </button>
          {/* Chưa xử lý xong thì mới có việc để làm — đã Resolved/Rejected rồi thì chỉ còn xem kết quả. */}
          {!isResolved && onResolve && (
            <button onClick={() => onResolve(c)}
              className="inline-flex flex-1 items-center justify-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board">
              Xử lý khiếu nại
            </button>
          )}
        </div>
      </HopThoai>
  )
}

export default ComplaintDetailModal