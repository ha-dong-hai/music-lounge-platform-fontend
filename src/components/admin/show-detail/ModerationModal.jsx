import { useState } from 'react'
import { X, Check, Loader2, ShieldAlert, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import { AIScoreCircle, RiskLevelBadge, AiRecommendationBadge } from '../shows/ShowBadges'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'
import { maNgan } from '../../../utils/format'

// SỬA 01/10/2026: ReviewShowCommandValidator BẮT BUỘC ReviewNote khi Rejected, và ReviewShowCommandHandler gửi nguyên văn
// lý do cho chủ phòng trà. Bản cũ ghi "Ghi chú duyệt (không bắt buộc)" → bấm Từ chối không lý do thì nhận 400. Nay chặn
// sớm, lỗi in dưới ô, và nói rõ ai đọc lý do.
const ModerationModal = ({ moderation, onClose, onDecision, isProcessing }) => {
  const [reviewNote, setReviewNote] = useState('')
  const [loiLyDo, setLoiLyDo] = useState(null)
  const tuChoi = () => {
    if (!reviewNote.trim()) { setLoiLyDo('Từ chối thì phải ghi lý do — chủ phòng trà đọc đúng câu này để sửa.'); return }
    onDecision('reject', reviewNote.trim())
  }

  if (!moderation) return null

  const isSlaOverdue = moderation.slaDeadline && dayjs(moderation.slaDeadline).isBefore(dayjs())

  return (
    <HopThoai onDong={onClose} dongKhiBamNgoai={false} className="border-warning/40 max-w-2xl max-h-[90vh] flex flex-col duration-300">

        {/* ===== HEADER ===== */}
        <div className="flex-none flex items-center gap-3 p-6 border-b border-line">
          <div className="w-11 h-11 bg-warning/10 border border-warning/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <TieuDeHop><h2 className="text-3xl text-ink">Duyệt nội dung</h2></TieuDeHop>
            <p className="text-sm text-ink-mute">Buổi diễn #{maNgan(moderation.targetId)} · chờ quản trị viên duyệt</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft disabled:opacity-30" aria-label="Đóng">
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
              {isSlaOverdue && <p className="text-xs text-danger font-bold">QUÁ HẠN</p>}
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
            <label htmlFor="ghi-chu-duyet" className="block font-semibold text-ink">Lý do / ghi chú</label>
            <p id="ghi-chu-duyet-goi-y" className="text-sm text-ink-soft mb-1">Bắt buộc khi từ chối. Được gửi nguyên văn cho chủ phòng trà.</p>
            <textarea id="ghi-chu-duyet"
              rows={3} maxLength={1000}
              value={reviewNote}
              onChange={(e) => { setReviewNote(e.target.value); setLoiLyDo(null) }}
              disabled={isProcessing}
              aria-invalid={loiLyDo ? 'true' : undefined}
              aria-describedby={`ghi-chu-duyet-goi-y${loiLyDo ? ' ghi-chu-duyet-loi' : ''}`}
              className={`w-full px-3 py-2 bg-card border-2 text-ink resize-none focus:outline-none focus:ring-2 focus:ring-ink disabled:opacity-50 ${loiLyDo ? 'border-danger' : 'border-ink'}`}
            />
            {loiLyDo && <p id="ghi-chu-duyet-loi" className="mt-1 text-sm font-semibold text-danger">{loiLyDo}</p>}
          </div>
        </div>

        {/* ===== FOOTER: 2 NÚT ===== */}
        <div className="flex-none flex flex-col sm:flex-row gap-3 p-6 border-t border-line">
          <button
            type="button" onClick={() => onDecision('approve', reviewNote.trim())}
            disabled={isProcessing}
            className="flex-1 bg-success flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-4 border-2 border-success bg-success text-lamp text-sm font-semibold hover:bg-success/90"
          >
            {isProcessing === 'approve'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><Check size={18} strokeWidth={3} /> Duyệt</>}
          </button>
          <button
            type="button" onClick={tuChoi}
            disabled={isProcessing}
            className="flex-1 bg-danger flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-4 border-2 border-danger bg-danger text-lamp text-sm font-semibold hover:bg-danger/90"
          >
            {isProcessing === 'reject'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><X size={18} strokeWidth={3} /> Từ chối</>}
          </button>
        </div>
      </HopThoai>
  )
}

export default ModerationModal