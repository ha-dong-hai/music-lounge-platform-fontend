import { Loader2, ChevronLeft, ChevronRight, Building2, ExternalLink, ShieldAlert } from 'lucide-react'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { VenueStatusBadge, LicenseBadge } from './VenueBadges'

// Component thuần UI: nhận data đã lọc + callbacks từ cha
// onViewPublicPage cu bi bo: bang dung <Link> mo trang cong khai, khong qua callback nao.
const VenuesTable = ({ venues, isLoading, pagination, onPageChange, onReview, onPenalize }) => {
  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-sunken/70 border-b border-line">
            <tr>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Venue</th>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Owner</th>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Address</th>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">License</th>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-ink-mute">
                  <Loader2 size={24} className="mx-auto animate-spin text-brand-text" />
                </td>
              </tr>
            ) : venues.length > 0 ? (
              venues.map(v => (
                <tr key={v.loungeId} className="hover:bg-sunken/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.primaryImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${v.name || 'V'}&backgroundColor=1f2937`}
                        alt={v.name}
                        className="w-10 h-10 rounded-lg object-cover border border-line flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-ink font-medium truncate">{v.name}</p>
                        <p className="text-xs text-ink-mute">#{v.loungeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-ink-soft font-medium">{v.ownerName}</p>
                    <p className="text-xs text-ink-mute mt-0.5">{v.ownerEmail}</p>
                    <p className="text-xs text-ink-mute">{v.ownerPhone}</p>
                  </td>
                  <td className="p-4 max-w-[240px]">
                    <p className="text-sm text-ink-soft truncate">{v.fullAddress || '—'}</p>
                  </td>
                  <td className="p-4"><LicenseBadge hasLicense={v.hasBusinessLicense} /></td>
                  <td className="p-4"><VenueStatusBadge status={v.status} /></td>
                  <td className="p-4 text-sm text-ink-soft">{dayjs(v.createdAt).format('DD/MM/YYYY')}</td>
                  <td className="p-4 text-right">
                    {/* Nút xem trang public của venue */}
                    <Link
                      to={`/lounge/${v.loungeId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-brand-text border border-brand/30 hover:bg-brand-hover/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                    >
                      <ExternalLink size={12} /> Xem
                    </Link>
                    {/* Phòng trà ở Pending không hiện công khai và không bán vé được — không duyệt
                        thì chủ phòng trà treo vô thời hạn. */}
                    {onReview && v.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onReview(v, 'Approved')}
                          className="ml-2 inline-flex items-center gap-1.5 text-success border border-green-500/40 hover:bg-green-500/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => onReview(v, 'Rejected')}
                          className="ml-2 inline-flex items-center gap-1.5 text-danger border border-red-500/40 hover:bg-red-500/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {/* Ra án phạt: KHÔNG hiện cho hồ sơ chưa duyệt (Pending/Rejected) — phòng trà
                        chưa hoạt động thì phạt không có nghĩa, và duyệt hồ sơ là việc khác hẳn. */}
                    {onPenalize && !['Pending', 'Rejected'].includes(v.status) && (
                      <button
                        onClick={() => onPenalize(v)}
                        className="ml-2 inline-flex items-center gap-1.5 text-orange-700 border border-orange-500/40 hover:bg-orange-500/10 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <ShieldAlert size={12} /> Án phạt
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-ink-mute">
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
        <div className="flex items-center justify-between p-4 border-t border-line">
          <p className="text-sm text-ink-mute">
            Trang {pagination.page} / {pagination.totalPages} (Tổng: {pagination.totalCount} venue)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-md border border-line text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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