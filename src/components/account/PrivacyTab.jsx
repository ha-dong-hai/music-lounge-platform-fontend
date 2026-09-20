// src/components/account/PrivacyTab.jsx
//
// GHI CHÚ CHO ĐỘI FE — HAI HÀNH ĐỘNG DƯỚI ĐÂY KHÔNG GIỐNG NHAU, ĐỪNG GỘP:
//   Vô hiệu hoá tài khoản (DELETE /me)        — ngừng sử dụng, dữ liệu vẫn còn.
//   Yêu cầu xoá dữ liệu (POST /me/data-erasure) — KHÔNG HOÀN TÁC, có thể cần mật khẩu để xác minh.
// Gộp hai cái thành một nút là để người dùng xoá vĩnh viễn dữ liệu trong khi họ chỉ định nghỉ dùng.
// Vì vậy mỗi cái một khối riêng, chữ giải thích riêng, và cái nặng hơn phải gõ chữ xác nhận.
import { useState } from 'react'
import { Loader2, Download, UserX, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyDataExport, deactivateMyAccount, requestDataErasure } from '../../services/userServices'
import { useAuthStore } from '../../store/useAuthStore'

const XAC_NHAN = 'XOA DU LIEU'

const PrivacyTab = () => {
  const logout = useAuthStore((s) => s.logout)
  const [busy, setBusy] = useState(null) // 'export' | 'deactivate' | 'erase'
  const [moXoa, setMoXoa] = useState(false)
  const [goXacNhan, setGoXacNhan] = useState('')
  const [matKhau, setMatKhau] = useState('')

  const taiDuLieu = async () => {
    setBusy('export')
    try {
      const res = await getMyDataExport()
      const noiDung = JSON.stringify(res.data ?? res, null, 2)
      const blob = new Blob([noiDung], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `du-lieu-ca-nhan-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Đã tải xuống dữ liệu cá nhân của bạn.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được dữ liệu.')
    } finally { setBusy(null) }
  }

  const voHieuHoa = async () => {
    setBusy('deactivate')
    try {
      await deactivateMyAccount()
      toast.success('Đã vô hiệu hoá tài khoản.')
      logout()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không vô hiệu hoá được tài khoản.')
    } finally { setBusy(null) }
  }

  const xoaDuLieu = async () => {
    if (goXacNhan.trim().toUpperCase() !== XAC_NHAN) {
      toast.error(`Hãy gõ "${XAC_NHAN}" để xác nhận.`)
      return
    }
    setBusy('erase')
    try {
      await requestDataErasure(matKhau || null)
      toast.success('Đã gửi yêu cầu xoá dữ liệu.')
      setMoXoa(false); setGoXacNhan(''); setMatKhau('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không gửi được yêu cầu xoá dữ liệu.')
    } finally { setBusy(null) }
  }

  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white">Tải dữ liệu cá nhân</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Tải về toàn bộ dữ liệu chúng tôi đang lưu về bạn: hồ sơ, vé đã mua, khiếu nại, lịch sử giao dịch.
        </p>
        <button onClick={taiDuLieu} disabled={busy !== null}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
          {busy === 'export' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Tải xuống
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white">Vô hiệu hoá tài khoản</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Bạn sẽ bị đăng xuất và không dùng tài khoản này nữa. Dữ liệu vẫn được giữ lại — đây KHÔNG phải
          là xoá dữ liệu. Vé đã mua và lịch sử giao dịch không mất đi.
        </p>
        <button onClick={voHieuHoa} disabled={busy !== null}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-bold hover:bg-gray-800 disabled:opacity-50">
          {busy === 'deactivate' ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />} Vô hiệu hoá tài khoản
        </button>
      </div>

      <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6">
        <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
          <AlertTriangle size={17} /> Yêu cầu xoá dữ liệu
        </h3>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Khác hẳn với vô hiệu hoá: đây là yêu cầu xoá vĩnh viễn dữ liệu cá nhân của bạn khỏi hệ thống.
          <strong className="text-red-400"> Không hoàn tác được.</strong> Một số dữ liệu giao dịch có thể
          phải giữ lại theo quy định pháp luật về kế toán và thuế.
        </p>

        {!moXoa ? (
          <button onClick={() => setMoXoa(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/10">
            <Trash2 size={15} /> Tôi muốn xoá dữ liệu
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-500">Mật khẩu hiện tại</label>
              <input type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/50" />
              <p className="text-xs text-gray-600 mt-1">Dùng để xác minh đúng là bạn. Đăng nhập bằng Google thì bỏ trống.</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Gõ <strong className="text-red-400">{XAC_NHAN}</strong> để xác nhận</label>
              <input value={goXacNhan} onChange={(e) => setGoXacNhan(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-black border border-red-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setMoXoa(false); setGoXacNhan(''); setMatKhau('') }} disabled={busy !== null}
                className="flex-1 py-2.5 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
                Huỷ
              </button>
              <button onClick={xoaDuLieu} disabled={busy !== null || goXacNhan.trim().toUpperCase() !== XAC_NHAN}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {busy === 'erase' && <Loader2 size={16} className="animate-spin" />} Gửi yêu cầu xoá
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PrivacyTab
