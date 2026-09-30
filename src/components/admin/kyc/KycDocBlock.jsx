// src/components/admin/kyc/KycDocBlock.jsx
import { CheckCircle2, XCircle } from 'lucide-react'
import { KycStatusChip } from './KycBadges'

const KycDocBlock = ({ icon: Icon, title, status, children, onApprove, onReject, coDuLieu }) => (
  <div className="bg-sunken/70 border border-line p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={15} className="text-ink-mute flex-shrink-0" />
        <span className="text-sm text-ink font-medium">{title}</span>
      </div>
      {status && <KycStatusChip status={status} />}
    </div>

    <div className="mt-2 space-y-1">{children}</div>

    {/* Chỉ duyệt khi: đã gửi dữ liệu + đang chờ */}
    {coDuLieu && status === 'Pending' && (
      <div className="mt-3 flex gap-2">
        <button onClick={onApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/40 text-success text-xs font-bold hover:bg-success/20">
          <CheckCircle2 size={13} /> Duyệt
        </button>
        <button onClick={onReject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/40 text-danger text-xs font-bold hover:bg-danger/20">
          <XCircle size={13} /> Từ chối
        </button>
      </div>
    )}
  </div>
)

export default KycDocBlock