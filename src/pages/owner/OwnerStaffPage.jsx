// src/pages/owner/OwnerStaffPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Nhân viên là TÀI KHOẢN ĐÃ CÓ trên hệ thống được gán vào phòng trà, không phải tài khoản mới do
//   chủ tạo. Vì vậy luồng là: tra cứu theo email → xác nhận đúng người → gán.
// - Backend giới hạn: MỘT tài khoản chỉ làm nhân viên ở ĐÚNG MỘT phòng trà đang hoạt động. Gán người
//   đang làm chỗ khác sẽ bị từ chối. Câu trả lời của backend nói rõ lý do, nên hiển thị nguyên văn —
//   thay bằng "Thao tác thất bại" là lấy đi manh mối duy nhất của người dùng.
// - Endpoint tra cứu CỐ TÌNH không trả vai trò người dùng, để nó không thành công cụ tra thông tin
//   người khác. Vì vậy màn này chỉ hiện tên + email, không hiện vai trò.
// - Gỡ nhân viên là "ngừng hoạt động", không xoá: bản ghi được giữ kèm mốc thời gian để còn tra lại
//   ai từng làm việc trong đêm diễn nào.
// - Nhân viên dùng được gì: soát vé, bán vé tại quầy, đơn gọi món, vận hành livestream. KHÔNG vào
//   được hồ sơ phòng trà, buổi diễn, báo cáo doanh thu, gói dịch vụ (những cái đó backend chỉ cho chủ).
import { useState, useEffect, useCallback } from 'react'
import { Loader2, UserPlus, Search, UserX, Users, CheckCircle2, X } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { getLounges, getLoungeStaff, lookupUserByEmail, assignStaff, deactivateStaff } from '../../services/loungeServices'
import ConfirmModal from '../../components/shared/ConfirmModal'

const inputCls = 'px-3 py-2 bg-page border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-brand/50'

const AddStaffModal = ({ loungeId, onClose, onSaved }) => {
  const [email, setEmail] = useState('')
  const [nguoiTim, setNguoiTim] = useState(null)
  const [busy, setBusy] = useState(null) // 'lookup' | 'assign'

  const traCuu = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setBusy('lookup')
    setNguoiTim(null)
    try {
      const res = await lookupUserByEmail(email.trim())
      if (res.success) setNguoiTim(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tìm thấy tài khoản với email này.')
    } finally { setBusy(null) }
  }

  const gan = async () => {
    setBusy('assign')
    try {
      await assignStaff(loungeId, nguoiTim.id)
      toast.success(`Đã thêm ${nguoiTim.fullName} làm nhân viên.`)
      onSaved(); onClose()
    } catch (err) {
      // Trường hợp hay gặp nhất: người này đang là nhân viên ở phòng trà khác.
      toast.error(err.response?.data?.message || 'Không gán được nhân viên.')
    } finally { setBusy(null) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-line rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">Thêm nhân viên</h2>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-full text-ink-soft"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-ink-mute leading-relaxed">
            Người này cần đã có tài khoản trên hệ thống. Nhập email họ dùng để đăng ký.
          </p>

          <form onSubmit={traCuu} className="flex gap-2">
            <input value={email} onChange={(e) => { setEmail(e.target.value); setNguoiTim(null) }}
              type="email" placeholder="email@example.com" autoFocus className={`flex-1 ${inputCls}`} />
            <button type="submit" disabled={busy !== null || !email.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line text-ink-soft text-sm font-bold hover:bg-sunken disabled:opacity-50">
              {busy === 'lookup' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Tìm
            </button>
          </form>

          {nguoiTim && (
            <div className="bg-sunken/70 border border-line rounded-lg p-4">
              <p className="text-ink font-medium">{nguoiTim.fullName}</p>
              <p className="text-xs text-ink-mute mt-0.5">{nguoiTim.email}</p>
              <button onClick={gan} disabled={busy !== null}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-on-brand font-bold text-sm hover:bg-brand-hover disabled:opacity-50">
                {busy === 'assign' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Gán làm nhân viên phòng trà
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const OwnerStaffPage = () => {
  const [lounge, setLounge] = useState(null)
  const [staff, setStaff] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dangThem, setDangThem] = useState(false)
  const [goTarget, setGoTarget] = useState(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getLounges({ mine: true })
      const ds = res.success ? (Array.isArray(res.data) ? res.data : res.data?.items) : null
      const cuaToi = ds?.[0] ?? null
      setLounge(cuaToi)
      if (!cuaToi) return

      const sRes = await getLoungeStaff(cuaToi.id)
      if (sRes.success) setStaff(sRes.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách nhân viên.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { const chay = async () => { await load() }; chay() }, [load])

  const xacNhanGo = async () => {
    setIsRemoving(true)
    try {
      await deactivateStaff(lounge.id, goTarget.id)
      toast.success('Đã ngừng phân công nhân viên này.')
      setGoTarget(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gỡ được nhân viên.')
    } finally {
      setIsRemoving(false)
    }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-brand-text" /></div>
  }

  if (!lounge) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink mb-1">Nhân viên</h1>
        <div className="mt-4 bg-card border border-line rounded-xl p-6">
          <p className="text-sm text-ink-soft">Hãy tạo hồ sơ phòng trà trước — nhân viên được gán vào phòng trà.</p>
        </div>
      </div>
    )
  }

  const dangLam = staff.filter((s) => s.isActive)
  const daNgung = staff.filter((s) => !s.isActive)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-1">Nhân viên</h1>
          <p className="text-ink-soft text-sm leading-relaxed">
            Nhân viên soát vé, bán vé tại quầy, xử lý đơn gọi món và vận hành livestream.
            Họ không xem được báo cáo doanh thu, gói dịch vụ hay hồ sơ phòng trà.
          </p>
        </div>
        <button onClick={() => setDangThem(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-on-brand rounded-lg text-xs font-bold hover:bg-brand-hover">
          <UserPlus size={14} /> Thêm nhân viên
        </button>
      </div>

      <div className="bg-card border border-line rounded-xl p-6">
        <h2 className="text-base font-semibold text-ink mb-4">Đang làm việc ({dangLam.length})</h2>
        {dangLam.length === 0 ? (
          <div className="py-8 text-center">
            <Users size={26} className="mx-auto mb-3 text-ink-mute" />
            <p className="text-sm text-ink-mute">Chưa có nhân viên nào.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {dangLam.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 bg-sunken/70 border border-line rounded-lg p-4">
                <div className="min-w-0">
                  <p className="text-ink font-medium truncate">{s.fullName}</p>
                  <p className="text-xs text-ink-mute mt-0.5 truncate">{s.email}</p>
                  <p className="text-xs text-ink-mute mt-0.5">
                    Vào làm từ {dayjs(s.assignedAt).format('DD/MM/YYYY')}
                  </p>
                </div>
                <button onClick={() => setGoTarget(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-danger text-xs font-bold hover:bg-red-500/10 flex-shrink-0">
                  <UserX size={14} /> Ngừng phân công
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {daNgung.length > 0 && (
        <div className="bg-card border border-line rounded-xl p-6">
          <h2 className="text-base font-semibold text-ink mb-1">Đã ngừng ({daNgung.length})</h2>
          <p className="text-xs text-ink-mute mb-4">Giữ lại để tra được ai từng làm việc trong đêm diễn nào.</p>
          <ul className="space-y-2">
            {daNgung.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 bg-sunken/40 border border-line/60 rounded-lg p-3 opacity-70">
                <div className="min-w-0">
                  <p className="text-ink-soft text-sm truncate">{s.fullName}</p>
                  <p className="text-xs text-ink-mute truncate">{s.email}</p>
                </div>
                <span className="text-xs text-ink-mute flex-shrink-0">
                  {dayjs(s.assignedAt).format('DD/MM/YYYY')}
                  {s.deactivatedAt && ` – ${dayjs(s.deactivatedAt).format('DD/MM/YYYY')}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dangThem && (
        <AddStaffModal loungeId={lounge.id} onClose={() => setDangThem(false)} onSaved={load} />
      )}
      {goTarget && (
        <ConfirmModal
          isOpen
          title="Ngừng phân công nhân viên này?"
          message={`${goTarget.fullName} sẽ không còn soát vé, bán vé hay xử lý đơn cho phòng trà của bạn. Bản ghi vẫn được giữ lại trong danh sách "Đã ngừng".`}
          confirmText="Ngừng phân công"
          processingText="Đang xử lý..."
          isProcessing={isRemoving}
          onConfirm={xacNhanGo}
          onClose={() => setGoTarget(null)}
        />
      )}
    </div>
  )
}

export default OwnerStaffPage
