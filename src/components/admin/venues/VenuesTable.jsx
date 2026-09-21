import { Loader2, ChevronLeft, ChevronRight, Building2, ExternalLink, ShieldCheck } from 'lucide-react'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'

// Component thuần UI: nhận data đã lọc + callbacks từ cha
const VenuesTable = ({ venues, isLoading, pagination, onViewPublicPage, onPageChange, onReview }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-black/40 border-b border-gray-800">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Venue</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Owner</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">License</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-500">
                  <Loader2 size={24} className="mx-auto animate-spin text-[#C3B665]" />
                </td>
              </tr>
            ) : venues.length > 0 ? (
              venues.map(v => (
                <tr key={v.loungeId} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${v.name || 'V'}&backgroundColor=1f2937`}
                        alt={v.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{v.name}</p>
                        <p className="text-xs text-gray-600">#{v.loungeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-200 font-medium">{v.ownerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{v.ownerEmail}</p>
                    <p className="text-xs text-gray-500">{v.ownerPhone}</p>
                  </td>
                  <td className="p-4 max-w-[240px]">
                    <p className="text-sm text-gray-400 truncate">{v.fullAddress || '—'}</p>
                  </td>
                  <td className="p-4"><LicenseBadge hasLicense={v.hasBusinessLicense} /></td>
                  <td className="p-4"><VenueStatusBadge status={v.status} /></td>
                  <td className="p-4 text-sm text-gray-400">{dayjs(v.createdAt).format('DD/MM/YYYY')}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* NÚT REVIEW — hiện với venue chờ duyệt / bị từ chối (duyệt lại được) */}
                      {(v.status === 'Pending' || v.status === 'Rejected') && (
                        <button
                          onClick={() => onReview(v)}
                          className="inline-flex items-center gap-1.5 bg-[#C3B665] text-black px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#d4c87f] transition-colors"
                        >
                          <ShieldCheck size={12} /> Review
                        </button>
                      )}
                      <Link
                        to={`/lounge/${v.loungeId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-[#C3B665] border border-[#C3B665]/30 hover:bg-[#C3B665]/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <ExternalLink size={12} /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-500">
                  <Building2 size="32" className="mx-auto mb-3 opacity-50" />
                  Không tìm thấy venue nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!isLoading && venues.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.totalCount} venue)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-gray-700 text-gray-400 hover:border-[#C3B665] hover:text-[#C3B665] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VenuesTable