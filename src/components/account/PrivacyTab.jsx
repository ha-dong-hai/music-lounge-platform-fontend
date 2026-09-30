// src/components/account/PrivacyTab.jsx
//
// GHI CHÚ CHO ĐỘI FE — HAI HÀNH ĐỘNG DƯỚI ĐÂY KHÔNG GIỐNG NHAU, ĐỪNG GỘP:
//   Vô hiệu hoá tài khoản (DELETE /me)        — ngừng sử dụng, dữ liệu vẫn còn.
//   Xoá dữ liệu cá nhân (POST /me/data-erasure) — KHÔNG HOÀN TÁC, tài khoản dùng mật khẩu phải nhập lại mật khẩu.
// Gộp hai cái thành một nút là để người dùng xoá vĩnh viễn dữ liệu trong khi họ chỉ định nghỉ dùng.
// Vì vậy mỗi cái một khối riêng, chữ giải thích riêng, và cái nặng hơn phải gõ chữ xác nhận.
//
// SỬA 30/09/2026 — chữ nói sai việc backend làm:
// - "Xoá dữ liệu" KHÔNG phải một yêu cầu chờ duyệt: RequestDataErasureCommandHandler xử lý NGAY trong lần gọi — ẩn danh
//   hoá hồ sơ, xoá mật khẩu, xoá theo dõi/yêu thích/sở thích/hồ sơ gợi ý, và đặt IsActive = false. Bản cũ báo "Đã gửi
//   yêu cầu" rồi để người dùng ở lại trang như vẫn còn tài khoản. Giờ: nói rõ hậu quả trước, xong thì đăng xuất.
// - Hồ sơ giao dịch (vé, thanh toán, tiền ủng hộ) KHÔNG bị xoá mà chỉ còn trỏ tới một tài khoản đã ẩn danh — Luật Kế toán
//   buộc giữ chứng từ 10 năm (chú thích đầu handler). Nói điều đó thay cho câu mơ hồ "một số dữ liệu có thể phải giữ lại".
// - Chữ xác nhận in có dấu ("XOÁ DỮ LIỆU") và nhận cả khi gõ không dấu: bắt người Việt gõ "XOA DU LIEU" là bắt họ tắt bộ gõ.
// - Sai mật khẩu → backend trả 401; axios.js thử làm mới phiên một lần rồi trả lỗi — người dùng KHÔNG bị đăng xuất nhầm.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Download, Bell, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyDataExport, deactivateMyAccount, requestDataErasure } from '../../services/userServices'
import { registerDevice, unregisterDevice } from '../../services/notificationServices'
import { layMaThietBi, xoaMaThietBi, laCauHinhDuPush } from '../../config/firebaseMessaging'
import { useAuthStore } from '../../store/useAuthStore'
import NutXacNhan from '../shared/NutXacNhan'
import OTruong from '../shared/OTruong'

const XAC_NHAN = 'XOÁ DỮ LIỆU'
// So sánh bỏ dấu, không phân biệt hoa thường: "xoá dữ liệu", "XOA DU LIEU", "Xóa dữ liệu" đều được.
const boDau = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toUpperCase().replace(/\s+/g, ' ').trim()
const khopXacNhan = (s) => boDau(s) === boDau(XAC_NHAN)

const NUT_VIEN = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink font-semibold hover:bg-ink hover:text-lamp transition-colors disabled:opacity-60'

const Khoi = ({ id, tieuDe, children, nguyHiem = false }) => (
  <section aria-labelledby={id} className={`py-6 ${nguyHiem ? 'border-l-4 border-danger pl-5' : ''}`}>
    <h3 id={id} className={`text-3xl ${nguyHiem ? 'text-danger' : ''}`}>{tieuDe}</h3>
    {children}
  </section>
)

const PrivacyTab = () => {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null) // 'export' | 'deactivate' | 'erase' | 'push-on' | 'push-off'
  const [moXoa, setMoXoa] = useState(false)
  const [goXacNhan, setGoXacNhan] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [loiXoa, setLoiXoa] = useState({})
  // Mã thiết bị nhận thông báo đẩy. Giữ trong state của phiên: mỗi trình duyệt một mã riêng,
  // và ta chỉ cần nó để gỡ đúng thiết bị này khi người dùng tắt.
  const [maThietBi, setMaThietBi] = useState(null)

  // Bật thông báo đẩy: phải lấy mã ở Firebase TRƯỚC rồi mới đăng ký với backend. Làm ngược lại thì
  // backend có một mã không ai dùng. Quyền hiện thông báo chỉ xin được khi có hành động của người
  // dùng — đó là lý do nó nằm sau một cái nút chứ không tự chạy lúc tải trang.
  const batThongBao = async () => {
    setBusy('push-on')
    try {
      const { token, lyDo } = await layMaThietBi()
      if (!token) { toast.error(lyDo); return }
      await registerDevice(token, 'Web')
      setMaThietBi(token)
      toast.success('Đã bật thông báo trên thiết bị này.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa bật được thông báo.')
    } finally {
      setBusy(null)
    }
  }

  const tatThongBao = async () => {
    setBusy('push-off')
    try {
      // Phải gỡ CẢ HAI bên: gỡ một bên thì bên kia vẫn nghĩ thiết bị này đang nhận thông báo.
      if (maThietBi) await unregisterDevice(maThietBi)
      await xoaMaThietBi()
      setMaThietBi(null)
      toast.success('Đã tắt thông báo trên thiết bị này.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa tắt được thông báo.')
    } finally {
      setBusy(null)
    }
  }

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
      toast.error(err.response?.data?.message || 'Chưa tải được dữ liệu.')
    } finally { setBusy(null) }
  }

  const voHieuHoa = async () => {
    setBusy('deactivate')
    try {
      await deactivateMyAccount()
      toast.success('Đã vô hiệu hoá tài khoản.')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chưa vô hiệu hoá được tài khoản.')
    } finally { setBusy(null) }
  }

  const dongXoa = () => { setMoXoa(false); setGoXacNhan(''); setMatKhau(''); setLoiXoa({}) }

  const xoaDuLieu = async (e) => {
    e.preventDefault()
    if (!khopXacNhan(goXacNhan)) { setLoiXoa({ xacNhan: `Gõ đúng "${XAC_NHAN}" để xác nhận.` }); return }
    setLoiXoa({})
    setBusy('erase')
    try {
      await requestDataErasure(matKhau || null)
      toast.success('Dữ liệu cá nhân đã được xoá và tài khoản đã đóng.')
      logout()
      navigate('/')
    } catch (err) {
      setLoiXoa({ chung: err.response?.data?.message || 'Chưa xoá được dữ liệu. Hãy thử lại.' })
      setBusy(null)
    }
  }

  return (
    <div className="divide-y-2 divide-ink/20 border-y-2 border-ink">
      {/* THÔNG BÁO ĐẨY — theo từng thiết bị, không phải theo tài khoản: bật ở máy này không bật ở máy khác */}
      <Khoi id="rieng-tu-day" tieuDe="Thông báo trên thiết bị này">
        <p className="mt-2 text-ink-soft max-w-[65ch]">
          Nhận thông báo về vé, buổi diễn và hoàn tiền ngay trên trình duyệt, kể cả khi không mở trang. Cài đặt này chỉ
          áp dụng cho thiết bị đang dùng.
        </p>
        {!laCauHinhDuPush ? (
          <p className="mt-3 text-ink-soft border-l-4 border-warning pl-3">
            Hệ thống chưa cấu hình thông báo đẩy (thiếu khoá VAPID của Firebase), nên chưa bật được.
          </p>
        ) : maThietBi ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-1.5 font-semibold"><Bell size={16} aria-hidden="true" /> Đang bật</p>
            <button type="button" onClick={tatThongBao} disabled={busy !== null} className={NUT_VIEN}>
              {busy === 'push-off' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <BellOff size={16} aria-hidden="true" />} Tắt thông báo
            </button>
          </div>
        ) : (
          <button type="button" onClick={batThongBao} disabled={busy !== null} className={`${NUT_VIEN} mt-4`}>
            {busy === 'push-on' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Bell size={16} aria-hidden="true" />} Bật thông báo
          </button>
        )}
      </Khoi>

      <Khoi id="rieng-tu-tai" tieuDe="Tải dữ liệu cá nhân">
        <p className="mt-2 text-ink-soft max-w-[65ch]">
          Tải về toàn bộ dữ liệu chúng tôi đang lưu về bạn: hồ sơ, vé đã mua, khiếu nại, lịch sử giao dịch (tệp JSON).
        </p>
        <button type="button" onClick={taiDuLieu} disabled={busy !== null} className={`${NUT_VIEN} mt-4`}>
          {busy === 'export' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />} Tải dữ liệu xuống
        </button>
      </Khoi>

      <Khoi id="rieng-tu-vo-hieu" tieuDe="Vô hiệu hoá tài khoản">
        <p className="mt-2 text-ink-soft max-w-[65ch]">
          Bạn sẽ bị đăng xuất và không dùng tài khoản này nữa. Dữ liệu vẫn được giữ lại — đây <strong className="text-ink">không phải</strong> là
          xoá dữ liệu. Muốn mở lại phải liên hệ quản trị viên.
        </p>
        <NutXacNhan onXacNhan={voHieuHoa} tieuDe="Vô hiệu hoá tài khoản?" nhanXacNhan="Vô hiệu hoá tài khoản" nhanGiu="Không, giữ tài khoản"
          noiDung="Bạn sẽ bị đăng xuất ngay và không đăng nhập lại được. Vé đã mua không bị huỷ, nhưng không đăng nhập thì bạn không mở được mã vào cửa. Muốn mở lại tài khoản phải liên hệ quản trị viên." disabled={busy !== null}
          className={`${NUT_VIEN} mt-4`}>
          {busy === 'deactivate' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Vô hiệu hoá tài khoản
        </NutXacNhan>
      </Khoi>

      <Khoi id="rieng-tu-xoa" tieuDe="Xoá dữ liệu cá nhân" nguyHiem>
        <p className="mt-2 text-ink-soft max-w-[65ch]">
          Khác hẳn với vô hiệu hoá: việc xoá chạy <strong className="text-ink">ngay khi bạn xác nhận</strong> và <strong className="text-danger">không hoàn tác được</strong>.
        </p>
        <ul className="mt-3 list-disc pl-5 space-y-1 text-ink-soft max-w-[65ch]">
          <li>Tên, email, số điện thoại, ảnh, giấy tờ đã nộp, sở thích, phòng trà đang theo dõi và danh sách yêu thích bị xoá.</li>
          <li>Tài khoản đóng lại: bạn bị đăng xuất và không đăng nhập lại được. Vé chưa dùng sẽ không mở được mã vào cửa nữa.</li>
          <li>Hồ sơ vé, thanh toán và tiền ủng hộ vẫn được giữ, không còn gắn với tên bạn — Luật Kế toán buộc lưu chứng từ 10 năm.</li>
        </ul>

        {!moXoa ? (
          <button type="button" onClick={() => setMoXoa(true)}
            className="mt-4 inline-flex items-center justify-center min-h-[44px] px-4 border-2 border-danger text-danger font-semibold hover:bg-danger hover:text-lamp transition-colors">
            Tôi muốn xoá dữ liệu
          </button>
        ) : (
          <form onSubmit={xoaDuLieu} noValidate className="mt-5 space-y-4 max-w-md">
            <OTruong nhan="Mật khẩu hiện tại" goiY="Để xác minh đúng là bạn. Tài khoản đăng nhập bằng Google thì bỏ trống.">
              {(p) => <input {...p} type="password" autoComplete="current-password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)} />}
            </OTruong>
            <OTruong nhan={`Gõ ${XAC_NHAN} để xác nhận`} batBuoc loi={loiXoa.xacNhan}>
              {(p) => <input {...p} autoComplete="off" value={goXacNhan} onChange={(e) => setGoXacNhan(e.target.value)} />}
            </OTruong>
            {loiXoa.chung && <p role="alert" className="border-2 border-danger p-4 font-semibold text-danger">{loiXoa.chung}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button type="button" onClick={dongXoa} disabled={busy !== null} className={NUT_VIEN}>Không, giữ dữ liệu</button>
              <button type="submit" disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 bg-danger text-lamp font-semibold hover:bg-ink disabled:opacity-60">
                {busy === 'erase' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />} Xoá vĩnh viễn dữ liệu của tôi
              </button>
            </div>
          </form>
        )}
      </Khoi>
    </div>
  )
}

export default PrivacyTab
