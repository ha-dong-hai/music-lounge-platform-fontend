// GHI CHÚ — VÌ SAO CÒN BỌC mocUtc() DÙ LỖI ĐÃ ĐƯỢC SỬA:
// `createdAt` của UserAdminDto từng về KHÔNG kèm múi giờ ("2026-08-17T13:12:19.838") dù giá trị là
// giờ UTC, nên dayjs hiểu thành giờ máy và lệch đúng 7 tiếng ở Việt Nam. Backend đã sửa DTO sang
// DateTimeOffset và deploy 21/09; chuỗi nay về kèm "+00:00".
// mocUtc() chỉ thêm 'Z' KHI chuỗi chưa có múi giờ, nên với dữ liệu hiện tại nó KHÔNG LÀM GÌ CẢ.
// Giữ lại vì nó không tốn gì và là lưới chắn nếu có ai đổi DTO về kiểu cũ — KHÔNG phải vá tạm quên
// gỡ. Nó không cộng trừ giờ, chỉ diễn giải một chuỗi thiếu thông tin.
import { Eye, Ban, Unlock, Loader2, ChevronLeft, ChevronRight, Users as UsersIcon } from 'lucide-react'
import dayjs from 'dayjs'
import { mocUtc } from '../../../utils/format'
import { RoleBadge, StatusBadge } from './Badges'

const AccountsTable = ({ 
  accounts, isLoading, isUpdating, pagination, 
  onViewDetail, onToggleBan, onPageChange 
}) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-black/40 border-b border-gray-800">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created at</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-500">
                  <Loader2 size={24} className="mx-auto animate-spin text-[#C3B665]" />
                </td>
              </tr>
            ) : accounts.length > 0 ? (
              accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={acc.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${acc.fullName}&backgroundColor=1f2937`} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                      <div>
                        <p className="text-sm text-white font-medium">{acc.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.email} | {acc.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><RoleBadge role={acc.role} /></td>
                  <td className="p-4 text-sm text-gray-400">{dayjs(mocUtc(acc.createdAt)).format('DD/MM/YYYY')}</td>
                  <td className="p-4"><StatusBadge isActive={acc.isActive} /></td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onViewDetail(acc.id)} className="p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors" title="Xem chi tiết">
                        <Eye size={16} />
                      </button>
                      {acc.role !== 'Admin' && (
                        <button
                          onClick={() => onToggleBan(acc.id, acc.isActive)}
                          disabled={isUpdating}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${acc.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                          title={acc.isActive ? 'Banned account' : 'Unbanned account'}
                        >
                          {acc.isActive ? <Ban size={16} /> : <Unlock size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-500">
                  <UsersIcon size="32" className="mx-auto mb-3 opacity-50" />
                  No matching account found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Trang {pagination.page} / {pagination.totalPages} (Total: {pagination.totalCount} account)
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

export default AccountsTable