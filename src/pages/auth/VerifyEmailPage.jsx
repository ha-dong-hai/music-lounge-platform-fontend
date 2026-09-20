// src/pages/auth/VerifyEmailPage.jsx
// Port từ Stitch (cùng design system "Phòng Trà Acoustic & Lounge"). Đếm ngược dùng
// verificationCodeExpiresAt thật từ backend (qua router state), không phải giá trị bịa.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Mail, Timer, AlertCircle, CheckCircle2, ArrowLeft, Loader2, Music2 } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col bg-[#0e0c0a] text-[#f5eedc]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header className="w-full border-b border-[#3d3229]/50 bg-[#120f0d]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full border border-[#e5a93c]/40 bg-[#1e1813] flex items-center justify-center text-[#fbbf24]">
              <Music2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl tracking-wider text-[#f5eedc] font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Phòng Trà Sài Gòn</span>
              <span className="text-[11px] tracking-[0.2em] text-[#d6c7b2] uppercase font-medium">MusicLounge • Khởi Lập 1972</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-16 relative">
        <div className="relative w-full max-w-xl mx-auto z-10">
          <div className="bg-[#17130f] border border-[#3d3229] rounded-2xl shadow-2xl p-8 sm:p-12 lg:p-14 relative">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-full border border-[#fbbf24]/50 bg-gradient-to-b from-[#251e18] to-[#17130f] flex items-center justify-center">
                  <Mail size={28} className="text-[#fbbf24]" />
                </div>
              </div>
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-[#fbbf24] mb-2 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                Sổ Vàng Tri Âm • Xác Thực Phong Thư
              </span>
              <h1 className="text-3xl sm:text-4xl text-[#fbf7ee] font-normal tracking-tight mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Điền Mã Tri Âm
              </h1>
              <p className="text-sm leading-relaxed text-[#d6c7b2] max-w-md">
                Mã xác thực đã được gửi tới{' '}
                <span className="font-semibold text-[#fbbf24] border-b border-[#fbbf24]/40 pb-0.5">{email}</span>
              </p>
            </div>

            {apiError && (
              <div role="alert" className="mb-6 rounded-xl p-4 bg-[#3b1212] border border-[#991b1b] text-[#fecaca] flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-[#f87171]" />
                <p className="text-sm">{apiError}</p>
              </div>
            )}
            {isExpired && !apiError && (
              <div role="alert" className="mb-6 rounded-xl p-4 bg-[#2f1f0a] border border-[#b45309] text-[#fef3c7] flex items-start gap-3">
                <Timer size={20} className="flex-shrink-0 mt-0.5 text-[#fbbf24]" />
                <p className="text-sm">Mã xác thực đã hết hiệu lực. Nhấn &quot;Gửi lại mã mới&quot; để nhận phong thư mới.</p>
              </div>
            )}

            <form onSubmit={onSubmit}>
              <fieldset className="border-0 p-0 m-0">
                <legend className="sr-only">Nhập mã xác thực 6 chữ số đã được gửi qua email</legend>
                <div className="flex justify-between items-center gap-2 sm:gap-3.5 mb-8" role="group" aria-label="6 ô nhập mã xác thực">
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
                      onPaste={i === 0 ? handlePaste : undefined}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-[#110d0a] border border-[#4a3d31] rounded-xl text-[#fbf7ee] transition-all focus:border-[#fbbf24] focus:bg-[#231d17] focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/40"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-5 rounded-xl border border-[#3d3229] bg-[#120f0c] mb-8">
                  <div className="flex items-center gap-2.5 text-sm text-[#e8ded0]">
                    <Timer size={18} className="text-[#fbbf24]" />
                    <span>Thời hạn phong thư:</span>
                    <span className="font-mono font-bold text-[#fbbf24]">{expiresAt ? formatCountdown(secondsLeft) : '--:--'}</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isExpired || isResending}
                    onClick={handleResend}
                    className="text-sm font-semibold text-[#fbbf24] hover:text-[#fde68a] disabled:text-[#786b5c] disabled:cursor-not-allowed underline-offset-2 enabled:hover:underline transition-colors"
                  >
                    {isResending ? 'Đang gửi lại...' : 'Gửi lại mã mới'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={code.length < 6 || isSubmitting}
                  className="w-full h-14 rounded-xl text-[#14100d] font-semibold text-base tracking-wide shadow-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #e5a93c 0%, #d4952b 100%)' }}
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                  <span>Xác Nhận Khách Tri Âm</span>
                </button>
              </fieldset>
            </form>

            <div className="mt-8 pt-6 border-t border-[#3d3229]/60 flex items-center justify-between text-sm text-[#d6c7b2]">
              <Link to="/register" className="inline-flex items-center gap-1.5 text-[#e8ded0] hover:text-[#fbbf24] transition-colors">
                <ArrowLeft size={16} />
                <span>Đổi địa chỉ thư điện tử</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#3d3229]/50 bg-[#120f0d] py-8 text-[#d6c7b2] text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-center">
          <span>© 2026 Phòng Trà Sài Gòn • MusicLounge</span>
        </div>
      </footer>
    </div>
  )
}

export default VerifyEmailPage
