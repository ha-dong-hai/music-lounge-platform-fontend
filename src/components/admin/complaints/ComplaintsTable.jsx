import { Eye, Loader2, ChevronLeft, ChevronRight, MessageSquareWarning } from 'lucide-react'
import dayjs from 'dayjs'
import { CategoryBadge, StatusBadge, TARGET_TYPE_LABELS } from './ComplaintBadges'

// Component thuần UI: nhận data đã lọc + callbacks từ cha
const ComplaintsTable = ({ complaints, isLoading, pagination, onViewDetail, onPageChange }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-black/40 border-b border-gray-800">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">#ID</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Target</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Number</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="p-10 text-center text-gray-500">
                  <Loader2 size={24} className="mx-auto animate-spin text-[#C3B665]" />
                </td>
              </tr>
            ) : complaints.length > 0 ? (
              complaints.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/30 transition-colors cursor-pointer" onClick={() => onViewDetail(c)}>
                  <td className="p-4 font-mono text-xs text-[#C3B665]">#{c.id}</td>
                  <td className="p-4"><CategoryBadge category={c.category} /></td>
                  <td className="p-4 max-w-[280px]">
                    <p className="text-sm text-gray-300 truncate">{c.description || '—'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-400">
                      {TARGET_TYPE_LABELS[c.targetType] || c.targetType} <span className="text-gray-600">#{c.targetId}</span>
                    </p>
                  </td>
                  <td className="p-4 text-sm text-gray-400 font-mono">{c.contactPhone || '—'}</td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                  <td className="p-4 text-sm text-gray-400">{dayjs(c.createdAt).format('HH:mm DD/MM/YYYY')}</td>
                  <td className="p-4 text-center">
                    <button className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors inline-flex">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-10 text-center text-gray-500">
                  <MessageSquareWarning size="32" className="mx-auto mb-3 opacity-50" />
                  No complaint.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!isLoading && complaints.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Trang {pagination.page} / {pagination.totalPages} (Total: {pagination.totalCount} complaint)
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

export default ComplaintsTable