// src/pages/owner/OwnerSubscriptionPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Đăng ký / gia hạn / đổi gói đều là thanh toán VNPay thật: API trả paymentUrl và trang này
//   chuyển hướng thẳng sang đó, giống luồng mua vé và donate. Không có khoản nào bị trừ tại chỗ.
// - Huỷ gói KHÔNG hoàn tiền: gói vẫn dùng tới hết kỳ đã trả, chỉ là không tự gia hạn nữa.
// - Đổi gói không hoàn tiền mặt phần còn lại của gói cũ — backend quy phần đó thành thời gian ở gói
//   mới và trả về ước tính (creditValue/creditDays/estimatedExpiresAt). Con số chốt lại lúc VNPay
//   xác nhận nên có thể lệch nhẹ so với ước tính; trang này hiển thị đúng nguyên văn cảnh báo đó.
import { useState, useEffect } from 'react'
import { Loader2, Check, Package, CalendarClock, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
  getPackages,
  getMySubscription,
  subscribeToPackage,
  renewSubscription,
  changePackage,
  cancelSubscription,
} from '../../services/packageServices'
import { ghiNhoThanhToan, LOAI_THANH_TOAN } from '../../utils/paymentContext'
import NutXacNhan from '../../components/shared/NutXacNhan'
import { TrangLoiTai } from '../../components/bang/KhungTai'
import NhanTrangThai from '../../components/shared/NhanTrangThai'

const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`

const OwnerSubscriptionPage = () => {
  const [packages, setPackages] = useState([])
  const [current, setCurrent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  // Lỗi tải dữ liệu nền: vẽ TrangLoiTai thay vì nhánh 'chưa có' (01/10/2026 — xem components/bang/KhungTai.jsx).
  const [loiTai, setLoiTai] = useState(false)
  const [busy, setBusy] = useState(null)

  const load = async () => {
    setIsLoading(true)
    setLoiTai(false)
    try {
      const [pkgRes, myRes] = await Promise.all([getPackages(true), getMySubscription()])
      if (!pkgRes.success) throw new Error('packages')
      if (pkgRes.success) {
        const list = Array.isArray(pkgRes.data) ? pkgRes.data : pkgRes.data?.items || []
        setPackages(list)
      }
      if (myRes.success) setCurrent(myRes.data)
    } catch {
      // Bản cũ chỉ bật toast rồi vẽ trang như thể chưa đăng ký gói nào — chủ phòng trà có thể mua trùng gói.
      setLoiTai(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => { await load() }
    run()
  }, [])

  // Cả 3 thao tác đều trả paymentUrl để chuyển sang VNPay — gom lại một chỗ cho khỏi lặp.
  const goToPayment = async (label, fn) => {
    setBusy(label)
    try {
      const res = await fn()
      if (res.success && res.data?.paymentUrl) {
        // Ghi lại đây là thanh toán GÓI DỊCH VỤ để trang /payment/success nói đúng luồng
        // (backend redirect về URL cố định, không kèm query param — xem utils/paymentContext.js).
        ghiNhoThanhToan(LOAI_THANH_TOAN.GOI)
        window.location.href = res.data.paymentUrl
        return
      }
      toast.error('Không nhận được liên kết thanh toán.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không khởi tạo được thanh toán.')
    } finally {
      setBusy(null)
    }
  }

  const handleCancel = async () => {
    setBusy('cancel')
    try {
      await cancelSubscription()
      toast.success('Đã huỷ gia hạn. Gói vẫn dùng được tới hết kỳ đã trả.')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không huỷ được.')
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 size={32} className="animate-spin text-ink" />
      </div>
    )
  }
  if (loiTai) return <TrangLoiTai tieuDe="Gói dịch vụ" tenVung="thông tin gói dịch vụ" taiLai={load} />

  const isExpiringSoon = current && dayjs(current.expiresAt).diff(dayjs(), 'day') <= 7

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-ink mb-1">Gói dịch vụ</h1>
        <p className="text-ink-soft text-sm">Gói quyết định số vé tối đa mỗi buổi diễn, quyền dùng poster AI và số cảnh tour 360°.</p>
      </div>

      {/* === GÓI ĐANG DÙNG === */}
      {current ? (
        <div className="bg-card border border-line p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package size={18} className="text-ink" />
                <h2 className="text-3xl text-ink">{current.packageName}</h2>
                {/* MLACP-619: nhãn trạng thái dùng chung; gói hết hạn/đã huỷ là đã kết thúc → 'tat'. */}
                <NhanTrangThai sacThai={current.status === 'Active' ? 'tot' : 'tat'}>
                  {{ Active: 'Đang hoạt động', Expired: 'Đã hết hạn', Cancelled: 'Đã huỷ' }[current.status] ?? current.status}
                </NhanTrangThai>
              </div>
              <p className="text-sm text-ink-soft flex items-center gap-1.5">
                <CalendarClock size={14} />
                Hiệu lực tới {dayjs(current.expiresAt).format('HH:mm DD/MM/YYYY')}
              </p>
              {current.cancelledAt && (
                <p className="text-xs text-warning mt-2">
                  Đã huỷ gia hạn lúc {dayjs(current.cancelledAt).format('DD/MM/YYYY')} — vẫn dùng được tới hết kỳ trên.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => goToPayment('renew', renewSubscription)}
                disabled={!!busy}
                className="inline-flex disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board"
              >
                {busy === 'renew' ? 'Đang chuyển...' : 'Gia hạn'}
              </button>
              {!current.cancelledAt && (
                <NutXacNhan
                  onXacNhan={handleCancel} tieuDe="Huỷ gia hạn gói dịch vụ?" nhanXacNhan="Huỷ gia hạn" nhanGiu="Không, giữ gia hạn"
            noiDung="Gói vẫn dùng được tới hết kỳ đã trả. Sau mốc đó gói hết hiệu lực; muốn dùng tiếp thì đăng ký lại."
                  disabled={!!busy}
                  className="inline-flex disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp"
                >
                  Huỷ gia hạn
                </NutXacNhan>
              )}
            </div>
          </div>

          {/* Hạn mức là bản chụp lúc đăng ký (snapshot) — Admin sửa gói sau đó không làm đổi gói đang chạy. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-line">
            <div>
              <p className="text-xs text-ink-mute">Vé tối đa/buổi diễn</p>
              <p className="text-ink font-bold mt-0.5">{current.maxTicketsPerEventSnapshot}</p>
            </div>
            <div>
              <p className="text-xs text-ink-mute">Poster AI</p>
              <p className="text-ink font-bold mt-0.5">{current.hasAiPosterSnapshot ? 'Có' : 'Không'}</p>
            </div>
            {/* ĐÃ DÙNG / TRẦN, không chỉ trần. Trần một mình không trả lời được câu duy nhất chủ phòng
                trà hỏi ở đây — "tôi còn mấy lượt". Trước MLACP-483 số còn lại chỉ có trong câu trả lời
                của chính lần bấm tạo poster, tức là muốn đọc một con số thì phải tiêu một lượt.
                Hai trường mới có thể chưa lên máy chủ đang chạy, nên kiểm kiểu trước: thiếu thì tự
                rơi về cách hiện cũ, không cần dọn dẹp gì sau khi backend deploy. */}
            <div>
              <p className="text-xs text-ink-mute">Poster AI tháng này</p>
              {typeof current.aiPostersUsedThisMonth === 'number' ? (
                <>
                  <p className="text-ink font-bold mt-0.5">
                    {current.aiPostersUsedThisMonth}/{current.maxAiPostersPerMonthSnapshot}
                  </p>
                  <p className={`text-xs mt-0.5 ${current.aiPostersRemainingThisMonth === 0 ? 'text-warning' : 'text-ink-mute'}`}>
                    {current.aiPostersRemainingThisMonth === 0
                      ? 'Hết lượt, làm mới đầu tháng sau'
                      : `còn ${current.aiPostersRemainingThisMonth}`}
                  </p>
                </>
              ) : (
                <p className="text-ink font-bold mt-0.5">{current.maxAiPostersPerMonthSnapshot}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-ink-mute">Cảnh tour 360°</p>
              <p className="text-ink font-bold mt-0.5">{current.maxTourScenesSnapshot}</p>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="mt-4 flex items-start gap-2 bg-warning/5 border border-warning/20 p-3">
              <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                Gói sắp hết hạn. Hết hạn mà chưa gia hạn thì các hạn mức trên sẽ không còn áp dụng.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-line p-6 text-center">
          <Package size={28} className="mx-auto text-ink-mute mb-2" />
          <p className="text-ink-soft text-sm">Bạn chưa đăng ký gói nào. Chọn một gói bên dưới để bắt đầu.</p>
        </div>
      )}

      {/* === DANH SÁCH GÓI === */}
      <div>
        <h2 className="font-sans font-bold text-sm text-ink-soft mb-3">Các gói đang mở bán</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((p) => {
            const isCurrent = current?.packageId === p.id
            return (
              <div
                key={p.id}
                className={`bg-card border p-5 flex flex-col ${isCurrent ? 'border-ink' : 'border-line'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-ink font-bold">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-ink/15 text-ink text-xs font-bold">Đang dùng</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-ink">{fmtMoney(p.price)}</p>
                <p className="text-xs text-ink-mute mb-4">
                  {{ Monthly: 'mỗi tháng', Quarterly: 'mỗi quý', Yearly: 'mỗi năm' }[p.billingCycle] ?? p.billingCycle}
                </p>
                {p.description && <p className="text-xs text-ink-soft mb-4">{p.description}</p>}

                <ul className="space-y-2 text-sm text-ink-soft mb-5">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-success" /> Tối đa {p.maxTicketsPerEvent} vé/buổi diễn
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className={p.hasAiPoster ? 'text-success' : 'text-ink-mute'} />
                    {p.hasAiPoster ? `Poster AI — ${p.maxAiPostersPerMonth}/tháng` : 'Không có poster AI'}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-success" /> {p.maxTourScenes} cảnh tour 360°
                  </li>
                </ul>

                <div className="mt-auto">
                  {isCurrent ? (
                    <button disabled className="inline-flex w-full cursor-default items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-sunken text-ink text-sm font-semibold">
                      Gói hiện tại
                    </button>
                  ) : current ? (
                    <button
                      onClick={() => goToPayment(`change-${p.id}`, () => changePackage(p.id))}
                      disabled={!!busy}
                      className="inline-flex w-full disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 border-2 border-ink bg-card text-ink text-sm font-semibold hover:bg-ink hover:text-lamp"
                    >
                      {busy === `change-${p.id}` ? 'Đang chuyển...' : 'Đổi sang gói này'}
                    </button>
                  ) : (
                    <button
                      onClick={() => goToPayment(`sub-${p.id}`, () => subscribeToPackage(p.id))}
                      disabled={!!busy}
                      className="inline-flex w-full disabled:opacity-50 items-center justify-center gap-2 min-h-[44px] px-4 bg-ink text-lamp text-sm font-semibold hover:bg-board"
                    >
                      {busy === `sub-${p.id}` ? 'Đang chuyển...' : 'Đăng ký'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-ink-mute mt-4">
          Đổi gói có hiệu lực ngay; phần thời gian còn lại của gói cũ được quy đổi thành thời gian ở gói mới,
          không hoàn tiền mặt.
        </p>
      </div>
    </div>
  )
}

export default OwnerSubscriptionPage
