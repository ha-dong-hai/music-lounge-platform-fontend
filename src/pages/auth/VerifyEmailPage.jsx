// src/pages/auth/VerifyEmailPage.jsx
//
// XÁC THỰC EMAIL BẰNG MÃ 6 SỐ. Đếm ngược dùng verificationCodeExpiresAt thật từ backend (qua router state).
//
// LÀM LẠI 30/09/2026 (thế giới "tờ chương trình" + nghiên cứu form, reports/Form lọc vé và màn vận hành.md):
// - MỘT Ô NHẬP thay cho sáu ô một-chữ-số. Sáu ô phải tự viết lại việc nhảy ô, lùi ô, dán; trình đọc màn hình đọc sáu
//   trường rời; và `autocomplete="one-time-code"` chỉ điền được khi mã nằm trong MỘT trường.
//   Dán mã có lẫn dấu cách hay gạch nối vẫn nhận: chỉ giữ lại chữ số.
// - Nút "Gửi lại mã" chỉ bật khi mã hết hạn (luật của backend, giữ nguyên) — nay NÓI RÕ điều đó bên cạnh nút thay
//   vì để một nút mờ không lời giải thích. Gửi lại hỏng thì báo lỗi (bản cũ nuốt lỗi).
// - Nút "Xác nhận" luôn bấm được; thiếu số thì báo lỗi bằng chữ. Nút mờ không nói cho người dùng biết còn thiếu gì.
// - Dùng chung khung AuthShell với bốn trang tài khoản còn lại.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import * as aServices from '../../services/aServices'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'
import { NUT_CHINH, LIEN_KET, LIEN_KET_NHE } from '../../components/auth/kieuNut'

const SO_CHU_SO = 6

const formatCountdown = (secondsLeft) => {
  const m = Math.max(0, Math.floor(secondsLeft / 60))
  const s = Math.max(0, secondsLeft % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const chiSo = (chuoi) => String(chuoi ?? '').replace(/[^0-9]/g, '').slice(0, SO_CHU_SO)

const VerifyEmailPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { handleVerifyEmail, isSubmitting } = useAuth()

  const [email] = useState(location.state?.email || '')
  const [expiresAt, setExpiresAt] = useState(location.state?.verificationCodeExpiresAt || null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [code, setCode] = useState('')
  const [apiError, setApiError] = useState(null)
  const [isResending, setIsResending] = useState(false)
  const [daGuiLai, setDaGuiLai] = useState(false)
  const oMa = useRef(null)

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

  const handleResend = useCallback(async () => {
    if (!email) return
    setIsResending(true)
    setApiError(null)
    setDaGuiLai(false)
    try {
      const res = await aServices.resendVerificationCode(email)
      if (res.success && res.data?.verificationCodeExpiresAt) {
        setExpiresAt(res.data.verificationCodeExpiresAt)
        setCode('')
        setDaGuiLai(true)
        oMa.current?.focus()
      } else {
        setApiError(res.message || 'Chưa gửi lại được mã. Hãy thử lại sau ít phút.')
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Chưa gửi lại được mã. Hãy thử lại sau ít phút.')
    } finally {
      setIsResending(false)
    }
  }, [email])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (code.length < SO_CHU_SO) {
      setApiError(`Mã xác thực gồm đủ ${SO_CHU_SO} chữ số.`)
      oMa.current?.focus()
      return
    }
    setApiError(null)
    try {
      await handleVerifyEmail(email, code)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.')
      oMa.current?.focus()
    }
  }

  if (!email) return null

  return (
    <AuthShell>
      <h1 className="text-4xl text-ink mb-3">Xác thực email</h1>
      <p className="leading-relaxed text-ink-soft mb-6">
        Chúng tôi vừa gửi mã gồm {SO_CHU_SO} chữ số tới <span className="font-semibold text-ink break-all">{email}</span>. Nhập mã để hoàn tất đăng ký.
      </p>

      {isExpired && !apiError && (
        <AuthAlert tone="info" title="Mã đã hết hiệu lực" className="mb-5">Bấm “Gửi lại mã” để nhận mã mới.</AuthAlert>
      )}
      {daGuiLai && !apiError && !isExpired && (
        <AuthAlert tone="success" className="mb-5">Đã gửi mã mới tới email của bạn.</AuthAlert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <AuthField
          id="ma-xac-thuc"
          label="Mã xác thực"
          hint={`${SO_CHU_SO} chữ số trong thư vừa gửi.`}
          error={apiError}
          ref={oMa}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={SO_CHU_SO}
          autoFocus
          value={code}
          onChange={(e) => setCode(chiSo(e.target.value))}
          onPaste={(e) => { e.preventDefault(); setCode(chiSo(e.clipboardData.getData('text'))) }}
          className="font-mono text-2xl tracking-[0.35em]"
        />

        <button type="submit" disabled={isSubmitting} className={NUT_CHINH}>
          {isSubmitting ? <><Loader2 size={20} className="animate-spin" aria-hidden="true" /> Đang xác nhận…</> : 'Xác nhận'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-ink/20">
        <p className="text-ink-soft">
          Mã còn hiệu lực <span className="font-mono font-semibold text-ink">{expiresAt ? formatCountdown(secondsLeft) : '--:--'}</span>.
          {' '}Chưa thấy thư thì xem cả thư mục Spam.
        </p>
        <button type="button" disabled={!isExpired || isResending} onClick={handleResend}
          className={`${LIEN_KET} disabled:no-underline disabled:text-ink-mute disabled:cursor-not-allowed`}>
          {isResending ? 'Đang gửi lại…' : 'Gửi lại mã'}
        </button>
        {!isExpired && <p className="text-sm text-ink-mute">Gửi lại được khi mã hiện tại hết hiệu lực.</p>}
      </div>

      <p className="mt-5 pt-4 border-t border-ink/20">
        <Link to="/register" className={LIEN_KET_NHE}><ArrowLeft size={16} aria-hidden="true" /> Dùng địa chỉ email khác</Link>
      </p>
    </AuthShell>
  )
}

export default VerifyEmailPage
