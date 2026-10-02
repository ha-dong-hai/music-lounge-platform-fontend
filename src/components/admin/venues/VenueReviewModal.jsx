import { useState } from 'react'
import { X, Check, Loader2, ShieldAlert, MapPin, User } from 'lucide-react'
import dayjs from 'dayjs'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'
import { anhChuCai } from '../../../utils/anhChuCai'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'
import { maNgan } from '../../../utils/format'


const VenueReviewModal = ({ venue, onClose, onDecision, isProcessing }) => {
  const [reviewNote, setReviewNote] = useState('')

  if (!venue) return null

  return (
    <HopThoai onDong={onClose} dongKhiBamNgoai={false} className="bg-board max-w-lg max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex-none flex items-center gap-3 p-5 border-b border-ink">
          <div className="w-11 h-11 bg-ink/10 border border-ink/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} className="text-ink" />
          </div>
          <div className="flex-1 min-w-0">
            <TieuDeHop><h2 className="text-3xl text-lamp">Duyệt phòng trà</h2></TieuDeHop>
            <p className="text-sm text-ink-soft truncate">#{maNgan(venue.loungeId)} · {venue.name}</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-board text-ink-mute disabled:opacity-30" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Thông tin venue */}
          <div className="bg-board/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <img
                src={venue.primaryImageUrl || anhChuCai(venue.name || 'V')}
                alt={venue.name}
                className="w-14 h-14 object-cover border border-ink flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-lamp font-bold truncate">{venue.name}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  Submitted {dayjs(venue.createdAt).format('HH:mm DD/MM/YYYY')}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <VenueStatusBadge status={venue.status} />
                  <LicenseBadge hasLicense={venue.hasBusinessLicense} />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-ink pt-3">
              <p className="flex items-start gap-2 text-ink-mute">
                <MapPin size={14} className="text-ink flex-shrink-0 mt-0.5" />
                <span>{venue.fullAddress || '—'}</span>
              </p>
              <p className="flex items-center gap-2 text-ink-mute">
                <User size={14} className="text-ink flex-shrink-0" />
                <span className="truncate">{venue.ownerName} · {venue.ownerEmail} · {venue.ownerPhone}</span>
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Ghi chú duyệt (không bắt buộc)</label>
            <textarea aria-label="Ghi chú duyệt (không bắt buộc)"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              disabled={!!isProcessing}
              placeholder="Lý do duyệt hoặc từ chối…"
              className="w-full px-4 py-2.5 bg-board border border-ink text-lamp text-sm focus:outline-none focus:border-ink/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* FOOTER: 2 nút */}
        <div className="flex-none flex gap-3 p-5 border-t border-ink flex-wrap">
          <button
            onClick={() => onDecision('Approved', reviewNote)}
            disabled={!!isProcessing}
            className="flex-1 bg-success flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-4 border-2 border-success bg-success text-lamp text-sm font-semibold hover:bg-success/90"
          >
            {isProcessing === 'Approved'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><Check size={18} strokeWidth={3} /> Duyệt</>}
          </button>
          <button
            onClick={() => onDecision('Rejected', reviewNote)}
            disabled={!!isProcessing}
            className="flex-1 bg-danger flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] px-4 border-2 border-danger bg-danger text-lamp text-sm font-semibold hover:bg-danger/90"
          >
            {isProcessing === 'Rejected'
              ? <><Loader2 size={18} className="animate-spin" /> Đang xử lý…</>
              : <><X size={18} strokeWidth={3} /> Từ chối</>}
          </button>
        </div>
      </HopThoai>
  )
}

export default VenueReviewModal