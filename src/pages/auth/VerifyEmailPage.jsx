// src/pages/auth/VerifyEmailPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — làm lại theo docs/design/TRANG-CHU-BRIEF.md. Đếm ngược dùng verificationCodeExpiresAt
// thật từ backend (qua router state), không phải giá trị bịa. Toàn bộ logic (6 ô số, tự nhảy ô, Backspace lùi,
// dán, gửi lại CHỈ khi mã hết hạn, gọi handleVerifyEmail) GIỮ NGUYÊN; chỉ đổi giao diện và câu chữ:
// - Đây là khoảnh khắc giao dịch: khách chỉ muốn nhập mã. Câu chữ phải RÕ trước ("Xác thực email", "mã gồm 6
//   số") rồi mới đến chất thơ — bản cũ dùng "Điền Mã Tri Âm", "Xác Nhận Khách Tri Âm" khiến người mới không
//   hiểu đây là ô nhập mã xác thực email.
// - Bỏ dòng "Khởi Lập 1972" ở header: đó là chi tiết bịa (nền tảng không có năm thành lập như vậy).
// - Bỏ nút gradient và các mã màu hex cứng của bảng màu tối cũ: dùng token trong src/index.css.
// - Dán mã vào BẤT KỲ ô nào cũng được (trước đây chỉ ô đầu nhận), vì người dùng hay dán khi đã bấm nhầm ô.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Mail, Timer, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import * as aServices from '../../services/aServices'

const formatCountdown = (secondsLeft) => {
  const m = Math.max(0, Math.floor(secondsLeft / 60))
  const s = Math.max(0, secondsLeft % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const VerifyEmailPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { handleVerifyEmail, isSubmitting } = useAuth()

  const [email] = useState(location.state?.email || '')
  const [expiresAt, setExpiresAt] = useState(location.state?.verificationCodeExpiresAt || null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [apiError, setApiError] = useState(null)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isExpired = expiresAt ? secondsLeft <= 0 : false

  const focusInput = (index) => inputRefs.current[index]?.focus()

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = clean
      return next
    })
    if (clean && index < 5) focusInput(index + 1)
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) focusInput(index - 1)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pasted) return
    setDigits((prev) => {
      const next = [...prev]
      pasted.split('').forEach((d, i) => { next[i] = d })
      return next
    })
    focusInput(Math.min(pasted.length, 5))
  }

  const handleResend = useCallback(async () => {
    if (!email) return
    setIsResending(true)
    try {
      const res = await aServices.resendVerificationCode(email)
      if (res.success && res.data?.verificationCodeExpiresAt) {
        setExpiresAt(res.data.verificationCodeExpiresAt)
        setDigits(['', '', '', '', '', ''])
        focusInput(0)
      }
    } finally {
      setIsResending(false)
    }
  }, [email])

  const code = digits.join('')

  const onSubmit = async (e) => {
    e.preventDefault()
    if (code.length < 6) return
    setApiError(null)
    try {
      await handleVerifyEmail(email, code)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.')
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink">
      <header className="w-full border-b border-line bg-card/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center">
          <Link to="/" aria-label="Phòng Trà Sài Gòn — về trang chủ" className="font-display text-xl sm:text-2xl leading-none tracking-tight text-ink inline-flex items-center min-h-[44px]">
            Phòng Trà <span className="text-brand-text ml-1.5">Sài Gòn</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-16">
        <div className="w-full max-w-lg">
          <div className="bg-card border border-line rounded-2xl shadow-soft p-6 sm:p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-brand/15 border border-brand/40 flex items-center justify-center mb-5">
                <Mail size={26} className="text-brand-text" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-3">Xác thực email</h1>
              <p className="text-sm sm:text-base leading-relaxed text-ink-soft max-w-sm">
                Chúng tôi vừa gửi mã gồm 6 số tới{' '}
                <span className="font-semibold text-ink break-all">{email}</span>.
                Nhập mã bên dưới để hoàn tất đăng ký.
              </p>
            </div>

            {apiError && (
              <div role="alert" className="mb-6 rounded-xl p-4 bg-danger/10 border border-danger/30 text-danger flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{apiError}</p>
              </div>
            )}
            {isExpired && !apiError && (
              <div role="alert" className="mb-6 rounded-xl p-4 bg-warning/10 border border-warning/30 text-warning flex items-start gap-3">
                <Timer size={20} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">Mã xác thực đã hết hiệu lực. Nhấn &quot;Gửi lại mã mới&quot; để nhận mã mới.</p>
              </div>
            )}

            <form onSubmit={onSubmit}>
              {/* min-w-0: fieldset mặc định KHÔNG co nhỏ hơn nội dung (min-width: min-content) nên trên màn hẹp cả biểu
                  mẫu bị đẩy tràn ra ngoài thẻ — lỗi kinh điển, chỉ lộ khi đo bằng khung 390px cố định. */}
              <fieldset className="border-0 p-0 m-0 min-w-0">
                <legend className="sr-only">Nhập mã xác thực 6 chữ số đã được gửi qua email</legend>
                <div className="flex justify-between items-center gap-2 sm:gap-3 mb-6" role="group" aria-label="6 ô nhập mã xác thực">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      aria-label={`Chữ số thứ ${i + 1} của mã xác thực`}
                      autoComplete="one-time-code"
                      autoFocus={i === 0}
                      value={d}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      className="flex-1 min-w-0 max-w-14 h-14 sm:h-16 text-center text-2xl font-display font-semibold bg-page border border-line-strong rounded-xl text-ink transition-colors focus:border-brand-text focus:bg-card focus:outline-none focus:ring-2 focus:ring-brand/40"
                    />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 rounded-xl border border-line bg-sunken/60 mb-6">
                  <div className="flex items-center gap-2 text-sm text-ink-soft">
                    <Timer size={17} className="text-brand-text" />
                    <span>Mã còn hiệu lực</span>
                    <span className="font-mono font-bold text-ink tabular-nums">{expiresAt ? formatCountdown(secondsLeft) : '--:--'}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isExpired || isResending}
                    onClick={handleResend}
                    className="min-h-[44px] px-2 text-sm font-semibold text-brand-text hover:text-ink disabled:text-ink-mute disabled:cursor-not-allowed underline-offset-2 enabled:hover:underline transition-colors"
                  >
                    {isResending ? 'Đang gửi lại…' : 'Gửi lại mã mới'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={code.length < 6 || isSubmitting}
                  className="w-full h-14 rounded-full bg-brand text-on-brand font-bold text-base flex items-center justify-center gap-2.5 hover:bg-brand-hover active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  <span>Xác nhận</span>
                </button>
              </fieldset>
            </form>

            <p className="mt-6 text-center text-xs text-ink-mute leading-relaxed">
              Chưa thấy thư? Hãy kiểm tra cả thư mục Spam. Bạn có thể gửi lại mã sau khi mã hiện tại hết hạn.
            </p>

            <div className="mt-6 pt-5 border-t border-line flex items-center justify-center">
              <Link to="/register" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-ink-soft hover:text-brand-text transition-colors">
                <ArrowLeft size={16} />
                <span>Dùng địa chỉ email khác</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default VerifyEmailPage
