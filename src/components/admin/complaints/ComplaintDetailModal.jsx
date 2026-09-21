import { X, Phone, Paperclip, User, ShieldCheck, Clock } from 'lucide-react'
import dayjs from 'dayjs'
import { CategoryBadge, StatusBadge, TARGET_TYPE_LABELS } from './ComplaintBadges'

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>

      <div className="relative bg-card border border-line rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="flex-none flex justify-between items-start p-6 border-b border-line">
          <div>
            <p className="text-sm text-ink-mute mb-1">Report detail</p>
            <h2 className="text-xl font-bold text-ink font-mono">#{c.id}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Complaint Target</p>
              <p className="text-sm text-ink font-medium">
                {TARGET_TYPE_LABELS[c.targetType] || c.targetType} <span className="text-ink-mute">#{c.targetId}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Catergory</p>
              <CategoryBadge category={c.category} />
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Status</p>
              <StatusBadge status={c.status} />
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Created at</p>
              <p className="text-sm text-ink">{dayjs(c.createdAt).format('HH:mm:ss DD/MM/YYYY')}</p>
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Sender</p>
              <p className="text-sm text-ink font-medium flex items-center gap-1.5">
                <User size={13} className="text-ink-mute" />
                {c.complainantName || <span className="italic text-ink-mute">Anonymous</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-mute mb-1.5">Contact Number</p>
              <p className="text-sm text-ink font-mono flex items-center gap-1.5">
                <Phone size={13} className="text-ink-mute" />
                {c.contactPhone || '—'}
              </p>
            </div>
          </div>

          {/* NỘI DUNG KHIẾU NẠI */}
          <div>
            <p className="text-xs text-ink-mute mb-1.5">Complaint description</p>
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
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                     className="block text-sm text-brand-text underline truncate hover:text-brand-text">
                    {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* KẾT QUẢ XỬ LÝ */}
          {isResolved ? (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-2">
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
                <p className="text-sm text-ink-soft bg-espresso/30 rounded-md p-2.5 italic">"{c.resolution}"</p>
              )}
              {c.resolvedAt && (
                <p className="text-xs text-ink-mute flex items-center gap-1.5">
                  <Clock size={11} /> Resolved at {dayjs(c.resolvedAt).format('HH:mm DD/MM/YYYY')}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-warning/80 font-medium">⏳ This complaint has not yet been processed.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex-none p-6 pt-4 border-t border-line flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken transition-colors">
            Close
          </button>
          {/* Chưa xử lý xong thì mới có việc để làm — đã Resolved/Rejected rồi thì chỉ còn xem kết quả. */}
          {!isResolved && onResolve && (
            <button onClick={() => onResolve(c)}
              className="flex-1 py-2.5 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover transition-colors">
              Xử lý khiếu nại
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplaintDetailModal