// src/components/admin/penalty-appeals/PenaltyAppealCard.jsx
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import { PenaltyTypeBadge, penaltyStatusLabel, penaltyStatusCls } from './PenaltyBadges'

/**
 * Card 1 khiếu nại án phạt — thuần UI
 * @param {object} p - VenuePenaltyDto từ getPenaltyAppeals
 * @param {boolean} choXuLy - có hiện 2 nút quyết định không
 *   (page tính: đang tab chờ xử lý && !p.appealResult — điều kiện theo appealResult thay vì
 *    status enum, đổi tên enum không làm nút biến mất; bấm vào dòng đã quyết sẽ bị 409)
 * @param {function} onDecide - (item, 'Overturned'|'Upheld') → page mở modal
 */
const PenaltyAppealCard = ({ p, choXuLy, onDecide }) => (
  <li className="bg-card border border-line rounded-xl p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <PenaltyTypeBadge type={p.penaltyType} />
          <Link to={`/lounge/${p.loungeId}`} target="_blank"
            className="text-ink font-bold hover:text-brand-text">
            {p.loungeName}
          </Link>
          <span className={`text-xs ${penaltyStatusCls(p.status)}`}>· {penaltyStatusLabel(p.status)}</span>
        </div>

        <p className="text-xs text-ink-mute mt-1">
          Áp dụng {dayjs(p.issuedAt).format('DD/MM/YYYY')}
          {p.suspensionDays ? ` · ${p.suspensionDays} ngày` : ''}
          {p.suspensionEnd ? ` · hết hiệu lực ${dayjs(p.suspensionEnd).format('DD/MM/YYYY')}` : ''}
        </p>

        <p className="text-sm text-ink-soft mt-3 leading-relaxed">
          <span className="text-ink-mute">Lý do phạt: </span>{p.reason}
        </p>
        {p.evidenceRef && (
          <p className="text-xs text-ink-mute mt-1">Bằng chứng: {p.evidenceRef}</p>
        )}

        {p.appealReason && (
          <div className="mt-3 pl-3 border-l-2 border-yellow-500/40">
            <p className="text-xs text-ink-mute">
              Khiếu nại {p.appealedAt ? dayjs(p.appealedAt).format('DD/MM/YYYY') : ''}
            </p>
            <p className="text-sm text-ink-soft italic mt-0.5 leading-relaxed">“{p.appealReason}”</p>
          </div>
        )}

        {p.appealResult && (
          <div className="mt-3 pt-3 border-t border-line text-xs">
            <p className={p.appealResult === 'Overturned' ? 'text-success' : 'text-ink-soft'}>
              Đã quyết: {p.appealResult === 'Overturned' ? 'huỷ án phạt' : 'giữ nguyên án phạt'}
              {p.reviewedAt && ` · ${dayjs(p.reviewedAt).format('DD/MM/YYYY')}`}
            </p>
            {p.reviewNote && <p className="text-ink-mute mt-0.5 leading-relaxed">{p.reviewNote}</p>}
          </div>
        )}
      </div>

      {choXuLy && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={() => onDecide(p, 'Overturned')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/40 text-success text-xs font-bold hover:bg-green-500/10">
            <CheckCircle2 size={13} /> Huỷ án phạt
          </button>
          <button onClick={() => onDecide(p, 'Upheld')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink-soft text-xs font-bold hover:bg-sunken">
            <XCircle size={13} /> Giữ nguyên
          </button>
        </div>
      )}
    </div>
  </li>
)

export default PenaltyAppealCard