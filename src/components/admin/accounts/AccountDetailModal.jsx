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
import { anhChuCai } from '../../../utils/anhChuCai'
import HopThoai, { TieuDeHop } from '../../shared/HopThoai'

const AccountDetailModal = ({ selectedAcc, isModalLoading, isUpdating, onClose, onToggleBan }) => {
  if (!selectedAcc) return null

  return (
    <HopThoai onDong={onClose} dongKhiBamNgoai={false} className="max-w-lg p-6">
        {isModalLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 size={32} className="animate-spin text-ink mb-3" />
            <p className="text-ink-soft">Đang tải thông tin…</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <img src={selectedAcc.avatarUrl || anhChuCai(selectedAcc.fullName)} alt="avatar" className="w-16 h-16 border-2 border-line object-cover" />
                <div>
                  <TieuDeHop><h2 className="text-xl text-ink">{selectedAcc.fullName}</h2></TieuDeHop>
                  <p className="text-sm text-ink-mute">{selectedAcc.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 hover:bg-sunken text-ink-soft" aria-label="Đóng"><X size={20} /></button>
            </div>

            <div className="space-y-4 border-t border-line pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink-mute mb-1">Số điện thoại</p>
                  <p className="text-sm text-ink font-medium">{selectedAcc.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Ngày tạo</p>
                  <p className="text-sm text-ink font-medium">{dayjs(mocUtc(selectedAcc.createdAt)).format('HH:mm DD/MM/YYYY')}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Vai trò</p>
                  <RoleBadge role={selectedAcc.role} />
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Trạng thái</p>
                  <StatusBadge isActive={selectedAcc.isActive} />
                </div>
                <div>
                  <p className="text-xs text-ink-mute mb-1">Xác thực email</p>
                  <p className={`text-sm font-medium ${selectedAcc.isEmailVerified ? 'text-success' : 'text-danger'}`}>
                    {selectedAcc.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </p>
                </div>
              </div>

              {selectedAcc.role === 'Admin' && (
                <div className="bg-ink/5 border border-line p-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-ink" />
                  <p className="text-sm text-ink">Hệ thống quản trị</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {selectedAcc.role !== 'Admin' && (
                <button
                  onClick={() => onToggleBan(selectedAcc.id, selectedAcc.isActive)}
                  disabled={isUpdating}
                  className={`flex-1 py-2.5 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                    selectedAcc.isActive
                      ? 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20'
                      : 'bg-success text-lamp hover:bg-success'
                  }`}
                >
                  {selectedAcc.isActive ? <><Ban size={18} /> Khoá tài khoản</> : <><Unlock size={18} /> Mở khoá tài khoản</>}
                </button>
              )}
              <button onClick={onClose} className={`py-2.5 border border-line-strong text-ink-soft font-medium hover:bg-sunken transition-colors ${selectedAcc.role === 'Admin' ? 'flex-1' : 'px-6'}`}>
                Đóng
              </button>
            </div>
          </>
        )}
      </HopThoai>
  )
}

export default AccountDetailModal