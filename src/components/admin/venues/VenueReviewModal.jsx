import { useState } from 'react'
import { X, Check, Loader2, ShieldAlert, MapPin, User } from 'lucide-react'
import dayjs from 'dayjs'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'


const VenueReviewModal = ({ venue, onClose, onDecision, isProcessing }) => {
  const [reviewNote, setReviewNote] = useState('')

  if (!venue) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isProcessing && onClose()}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex-none flex items-center gap-3 p-5 border-b border-gray-800">
          <div className="w-11 h-11 rounded-xl bg-[#C3B665]/10 border border-[#C3B665]/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} className="text-[#C3B665]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Venue Review</h2>
            <p className="text-sm text-gray-500 truncate">#{venue.loungeId} · {venue.name}</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 disabled:opacity-30">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Thông tin venue */}
          <div className="bg-black/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <img
                src={venue.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${venue.name || 'V'}&backgroundColor=1f2937`}
                alt={venue.name}
                className="w-14 h-14 rounded-lg object-cover border border-gray-700 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{venue.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submitted {dayjs(venue.createdAt).format('HH:mm DD/MM/YYYY')}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <VenueStatusBadge status={venue.status} />
                  <LicenseBadge hasLicense={venue.hasBusinessLicense} />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-gray-800 pt-3">
              <p className="flex items-start gap-2 text-gray-400">
                <MapPin size={14} className="text-[#C3B665] flex-shrink-0 mt-0.5" />
                <span>{venue.fullAddress || '—'}</span>
              </p>
              <p className="flex items-center gap-2 text-gray-400">
                <User size={14} className="text-[#C3B665] flex-shrink-0" />
                <span className="truncate">{venue.ownerName} · {venue.ownerEmail} · {venue.ownerPhone}</span>
              </p>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Review note (optional)</label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              disabled={!!isProcessing}
              placeholder="Reason for approval / rejection..."
              className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#C3B665]/50 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* FOOTER: 2 nút */}
        <div className="flex-none flex gap-3 p-5 border-t border-gray-800">
          <button
            onClick={() => onDecision('Approved', reviewNote)}
            disabled={!!isProcessing}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'Approved'
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><Check size={18} strokeWidth={3} /> Approve</>}
          </button>
          <button
            onClick={() => onDecision('Rejected', reviewNote)}
            disabled={!!isProcessing}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === 'Rejected'
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><X size={18} strokeWidth={3} /> Reject</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VenueReviewModal