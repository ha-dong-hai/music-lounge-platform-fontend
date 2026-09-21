// GHI CHÚ — VÌ SAO CÒN BỌC mocUtc() DÙ LỖI ĐÃ ĐƯỢC SỬA:
// `createdAt` của UserAdminDto từng về KHÔNG kèm múi giờ ("2026-08-17T13:12:19.838") dù giá trị là
// giờ UTC, nên dayjs hiểu thành giờ máy và lệch đúng 7 tiếng ở Việt Nam. Backend đã sửa DTO sang
// DateTimeOffset và deploy 21/09; chuỗi nay về kèm "+00:00".
// mocUtc() chỉ thêm 'Z' KHI chuỗi chưa có múi giờ, nên với dữ liệu hiện tại nó KHÔNG LÀM GÌ CẢ.
// Giữ lại vì nó không tốn gì và là lưới chắn nếu có ai đổi DTO về kiểu cũ — KHÔNG phải vá tạm quên
// gỡ. Nó không cộng trừ giờ, chỉ diễn giải một chuỗi thiếu thông tin.
import { X, Loader2, Ban, Unlock, ShieldCheck } from 'lucide-react'
import dayjs from 'dayjs'
import { mocUtc } from '../../../utils/format'
import { RoleBadge, StatusBadge } from './Badges'

const AccountDetailModal = ({ selectedAcc, isModalLoading, isUpdating, onClose, onToggleBan }) => {
  if (!selectedAcc) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => !isModalLoading && onClose()}>
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm"></div>
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {isModalLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 size={32} className="animate-spin text-brand-text mb-3" />
            <p className="text-ink-soft">Loading info...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <img src={selectedAcc.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedAcc.fullName}&backgroundColor=1f2937`} alt="avatar" className="w-16 h-16 rounded-full border-2 border-brand/30 object-cover" />
                <div>
                  <h2 className="text-xl font-bold text-ink">{selectedAcc.fullName}</h2>
                  <p className="text-sm text-ink-mute">{selectedAcc.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
            </div>

            <div className="space-y-4 border-t border-line pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink-mute mb-1">Phone number</p>
                  <p className="text-sm text-ink font-medium">{selectedAcc.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Created at</p>
                  <p className="text-sm text-ink font-medium">{dayjs(mocUtc(selectedAcc.createdAt)).format('HH:mm DD/MM/YYYY')}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Role</p>
                  <RoleBadge role={selectedAcc.role} />
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Status</p>
                  <StatusBadge isActive={selectedAcc.isActive} />
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Verify Email</p>
                  <p className={`text-sm font-medium ${selectedAcc.isEmailVerified ? 'text-success' : 'text-danger'}`}>
                    {selectedAcc.isEmailVerified ? 'Verified' : 'Unverified '}
                  </p>
                </div>
              </div>

              {selectedAcc.role === 'Admin' && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple-700" />
                  <p className="text-sm text-purple-700">Administration system</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {selectedAcc.role !== 'Admin' && (
                <button
                  onClick={() => onToggleBan(selectedAcc.id, selectedAcc.isActive)}
                  disabled={isUpdating}
                  className={`flex-1 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    selectedAcc.isActive
                      ? 'bg-red-500/10 text-danger border border-red-500/30 hover:bg-red-500/20'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {selectedAcc.isActive ? <><Ban size={18} /> Ban account</> : <><Unlock size={18} /> Unbanned account</>}
                </button>
              )}
              <button onClick={onClose} className={`py-2.5 border border-line-strong text-ink-soft rounded-lg font-medium hover:bg-sunken transition-colors ${selectedAcc.role === 'Admin' ? 'flex-1' : 'px-6'}`}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AccountDetailModal