import { useState } from 'react'
import { X, Check, Loader2, ShieldAlert, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import { AIScoreCircle, RiskLevelBadge, AiRecommendationBadge } from '../shows/ShowBadges'

const ModerationModal = ({ moderation, onClose, onDecision, isProcessing }) => {
  const [reviewNote, setReviewNote] = useState('')

  if (!moderation) return null

  const isSlaOverdue = moderation.slaDeadline && dayjs(moderation.slaDeadline).isBefore(dayjs())

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="absolute inset-0 bg-ink/80"></div>

      <div className="relative bg-card border-2 border-warning/40 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-soft duration-300" onClick={(e) => e.stopPropagation()}>

        {/* ===== HEADER ===== */}
        <div className="flex-none flex items-center gap-3 p-6 border-b border-line">
          <div className="w-11 h-11 bg-warning/10 border border-warning/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl text-ink">Duyệt nội dung</h2>
            <p className="text-sm text-ink-mute">Show #{moderation.targetId} • Need Admin approval</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* ===== BODY (scroll) ===== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* 4 thông số AI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-sunken/50 p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-mute">Điểm AI</p>
              <AIScoreCircle score={moderation.aiScore} />
            </div>
            <div className="bg-sunken/50 p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-mute">Mức rủi ro</p>
              <RiskLevelBadge level={moderation.riskLevel} />
            </div>
            <div className="bg-sunken/50 p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-mute">Đề xuất</p>
              <AiRecommendationBadge recommendation={moderation.aiRecommendation} />
            </div>
            <div className="bg-sunken/50 p-4 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs text-ink-mute">Hạn duyệt</p>
              <p className={`text-sm font-bold ${isSlaOverdue ? 'text-danger' : 'text-ink'}`}>
                {moderation.slaDeadline ? dayjs(moderation.slaDeadline).format('HH:mm DD/MM') : '-'}
              </p>
              {isSlaOverdue && <p className="text-[10px] text-danger font-bold">QUÁ HẠN</p>}
            </div>
          </div>

          {/* Lý do bị flag */}
          {moderation.flagReason && (
            <div className="flex items-start gap-2 bg-warning/5 border border-warning/20 p-3">
              <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-warning mb-1">Lý do gắn cờ</p>
                <p className="text-sm text-warning/90">{moderation.flagReason}</p>
              </div>
            </div>
          )}

          {/* Ghi chú duyệt */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">Ghi chú duyệt (không bắt buộc)</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Lý do duyệt hoặc từ chối…"
              disabled={isProcessing}
              className="w-full px-4 py-2.5 bg-page border border-line text-ink text-sm focus:outline-none focus:border-ink/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* ===== FOOTER: 2 NÚT ===== */}
        <div className="flex-none flex flex-col sm:flex-row gap-3 p-6 border-t border-line">
          <button
            onClick={() => onDecision('approve', reviewNote)}
            disabled={isProcessing}
            className="flex-1 py-3 bg-success text-lamp font-bold hover:bg-success transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'approve'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><Check size={18} strokeWidth={3} /> Duyệt</>}
          </button>
          <button
            onClick={() => onDecision('reject', reviewNote)}
            disabled={isProcessing}
            className="flex-1 py-3 bg-danger text-lamp font-bold hover:bg-danger transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'reject'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><X size={18} strokeWidth={3} /> Từ chối</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModerationModal