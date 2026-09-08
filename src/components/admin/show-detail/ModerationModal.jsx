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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border-2 border-yellow-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>

        {/* ===== HEADER ===== */}
        <div className="flex-none flex items-center gap-3 p-6 border-b border-gray-800">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} className="text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Phê duyệt nội dung</h2>
            <p className="text-sm text-gray-500">Show #{moderation.targetId} • Cần quyết định của Admin</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* ===== BODY (scroll) ===== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* 4 thông số AI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-black/30 rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">Điểm AI</p>
              <AIScoreCircle score={moderation.aiScore} />
            </div>
            <div className="bg-black/30 rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">Rủi ro</p>
              <RiskLevelBadge level={moderation.riskLevel} />
            </div>
            <div className="bg-black/30 rounded-xl p-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500">Khuyến nghị</p>
              <AiRecommendationBadge recommendation={moderation.aiRecommendation} />
            </div>
            <div className="bg-black/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs text-gray-500">Hạn SLA</p>
              <p className={`text-sm font-bold ${isSlaOverdue ? 'text-red-400' : 'text-white'}`}>
                {moderation.slaDeadline ? dayjs(moderation.slaDeadline).format('HH:mm DD/MM') : '-'}
              </p>
              {isSlaOverdue && <p className="text-[10px] text-red-400 font-bold">ĐÃ QUÁ HẠN</p>}
            </div>
          </div>

          {/* Lý do bị flag */}
          {moderation.flagReason && (
            <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-yellow-400 mb-1">Lý do AI đánh dấu</p>
                <p className="text-sm text-yellow-300/90">{moderation.flagReason}</p>
              </div>
            </div>
          )}

          {/* Ghi chú duyệt */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Ghi chú duyệt (tùy chọn)</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Lý do phê duyệt / từ chối..."
              disabled={isProcessing}
              className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* ===== FOOTER: 2 NÚT ===== */}
        <div className="flex-none flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-800">
          <button
            onClick={() => onDecision('approve', reviewNote)}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'approve'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
              : <><Check size={18} strokeWidth={3} /> Xác nhận duyệt</>}
          </button>
          <button
            onClick={() => onDecision('reject', reviewNote)}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'reject'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
              : <><X size={18} strokeWidth={3} /> Từ chối nội dung</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModerationModal