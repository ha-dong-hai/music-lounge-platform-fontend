// src/pages/auth/ForgotPasswordPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - LoginPage đã link tới /forgot-password từ trước nhưng KHÔNG có route — bấm vào là trang trắng,
//   nghĩa là ai quên mật khẩu thì mất tài khoản. Trang này vá chỗ đó.
// - BACKEND CỐ TÌNH TRẢ 204 KỂ CẢ KHI EMAIL KHÔNG TỒN TẠI (giống LoginCommandHandler). Vì vậy giao
//   diện TUYỆT ĐỐI KHÔNG được nói "email này chưa đăng ký": nói ra là biến trang này thành công cụ
//   dò xem ai có tài khoản. Gửi xong luôn hiện đúng một câu trung tính.
// - Link đặt lại có dạng {PasswordResetUrl}?token=... và sống 30 PHÚT, DÙNG MỘT LẦN. Nói rõ cả hai
//   trong màn hình, vì người dùng thường mở mail muộn rồi không hiểu vì sao link báo lỗi.
// - Schema forgotPasswordSchema đã có sẵn trong src/schemas/authSchema.js, dùng lại chứ không tự
//   viết kiểm tra email mới.
// - LÀM LẠI GIAO DIỆN (docs/design/TRANG-CHU-BRIEF.md): dùng khung/ô nhập/hộp thông báo chung của components/auth. Hộp
//   "đã gửi" trước đây là khối xanh đen mã hex cứng (#16301c) giữa trang sáng; nay dùng token success. Logic giữ nguyên.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, ArrowRight, Loader2, Clock } from 'lucide-react'
import { forgotPassword } from '../../services/aServices'
import { forgotPasswordSchema } from '../../schemas/authSchema'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'

const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState(null)
  const [daGui, setDaGui] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async ({ email }) => {
    setApiError(null)
    setIsBusy(true)
    try {
      await forgotPassword(email)
      // Thành công ở đây KHÔNG có nghĩa là email tồn tại — backend trả 204 cho cả hai trường hợp.
      setDaGui(true)
    } catch (err) {
      // Chỉ lỗi thật (mạng, 429 quá nhiều lần, 500) mới vào đây.
      setApiError(err.response?.data?.message || 'Không gửi được yêu cầu. Thử lại sau ít phút.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">Quên mật khẩu</h1>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          Nhập email đã đăng ký. Chúng tôi gửi cho bạn một đường dẫn để đặt lại mật khẩu.
        </p>
      </div>

      {daGui ? (
        <>
          {/* Câu này trung tính có chủ đích: không tiết lộ email có tồn tại hay không. */}
          <AuthAlert tone="success" title="Đã gửi yêu cầu">
            Nếu <span className="font-medium text-ink break-all">{getValues('email')}</span> là email đã đăng ký, bạn sẽ nhận
            được đường dẫn đặt lại mật khẩu trong vài phút. Nhớ xem cả hộp thư rác.
          </AuthAlert>

          <p className="mt-4 rounded-xl border border-line bg-sunken/60 p-4 text-xs text-ink-soft flex items-start gap-2 leading-relaxed">
            <Clock size={15} className="text-brand-text flex-shrink-0 mt-px" />
            <span>
              Đường dẫn chỉ dùng được <strong className="text-ink">một lần</strong> và hết hạn sau{' '}
              <strong className="text-ink">30 phút</strong>. Quá hạn thì quay lại đây xin đường dẫn mới.
            </span>
          </p>

          <button
            type="button"
            onClick={() => setDaGui(false)}
            className="mt-6 w-full min-h-[48px] px-4 rounded-full bg-card hover:bg-sunken border border-line-strong text-ink font-medium text-sm transition-colors"
          >
            Gửi lại cho email khác
          </button>
        </>
      ) : (
        <>
          {apiError && (
            <AuthAlert tone="danger" title="Không gửi được" className="mb-6">
              {apiError}
            </AuthAlert>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <AuthField
              id="email"
              label="Email"
              icon={Mail}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="ban@example.com"
              inputProps={register('email')}
              error={errors.email?.message}
            />

            <button
              type="submit"
              disabled={isBusy}
              className="w-full min-h-[52px] rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-base flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBusy ? <><Loader2 size={20} className="animate-spin" /> Đang gửi…</> : <>Gửi đường dẫn đặt lại <ArrowRight size={18} /></>}
            </button>
          </form>
        </>
      )}

      <div className="mt-7 pt-5 border-t border-line text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-ink-soft hover:text-brand-text transition-colors">
          <ArrowLeft size={16} /> Về trang đăng nhập
        </Link>
      </div>
    </AuthShell>
  )
}

export default ForgotPasswordPage
