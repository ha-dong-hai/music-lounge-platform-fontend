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
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>

      <div className="relative bg-card border-2 border-yellow-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>

        {/* ===== HEADER ===== */}
        <div className="flex-none flex items-center gap-3 p-6 border-b border-line">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-ink">Content approval</h2>
            <p className="text-sm text-ink-mute">Show #{moderation.targetId} • Need Admin approval</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-sunken rounded-full text-ink-soft disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* ===== BODY (scroll) ===== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* 4 thông số AI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-sunken/50 rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-mute">AI Score</p>
              <AIScoreCircle score={moderation.aiScore} />
            </div>
            <div className="bg-sunken/50 rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-mute">Risk</p>
              <RiskLevelBadge level={moderation.riskLevel} />
            </div>
            <div className="bg-sunken/50 rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-mute">Recomendation</p>
              <AiRecommendationBadge recommendation={moderation.aiRecommendation} />
            </div>
            <div className="bg-sunken/50 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs text-ink-mute">Deadline SLA</p>
              <p className={`text-sm font-bold ${isSlaOverdue ? 'text-danger' : 'text-ink'}`}>
                {moderation.slaDeadline ? dayjs(moderation.slaDeadline).format('HH:mm DD/MM') : '-'}
              </p>
              {isSlaOverdue && <p className="text-[10px] text-danger font-bold">OVERDUE</p>}
            </div>
          </div>

          {/* Lý do bị flag */}
          {moderation.flagReason && (
            <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-warning mb-1">Flag reason</p>
                <p className="text-sm text-warning/90">{moderation.flagReason}</p>
              </div>
            </div>
          )}

          {/* Ghi chú duyệt */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">Review note (Optional)</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Reason for approval / rejection..."
              disabled={isProcessing}
              className="w-full px-4 py-2.5 bg-page border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-brand/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* ===== FOOTER: 2 NÚT ===== */}
        <div className="flex-none flex flex-col sm:flex-row gap-3 p-6 border-t border-line">
          <button
            onClick={() => onDecision('approve', reviewNote)}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'approve'
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><Check size={18} strokeWidth={3} /> Approval</>}
          </button>
          <button
            onClick={() => onDecision('reject', reviewNote)}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'reject'
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><X size={18} strokeWidth={3} /> Reject</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModerationModal