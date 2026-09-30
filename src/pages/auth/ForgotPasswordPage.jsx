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
import { ArrowLeft, Loader2 } from 'lucide-react'
import { forgotPassword } from '../../services/aServices'
import { forgotPasswordSchema } from '../../schemas/authSchema'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'
import { NUT_CHINH, NUT_PHU, LIEN_KET_NHE } from '../../components/auth/kieuNut'

const ForgotPasswordPage = () => {
  const [apiError, setApiError] = useState(null)
  const [daGui, setDaGui] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
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
      <h1 className="text-4xl text-ink mb-3">Quên mật khẩu</h1>
      <p className="text-ink-soft leading-relaxed mb-6">
        Nhập email đã đăng ký. Chúng tôi gửi cho bạn một đường dẫn để đặt lại mật khẩu.
      </p>

      {daGui ? (
        <>
          {/* Câu này trung tính có chủ đích: không tiết lộ email có tồn tại hay không. */}
          <AuthAlert tone="success" title="Đã gửi yêu cầu">
            Nếu <span className="font-semibold text-ink break-all">{getValues('email')}</span> là email đã đăng ký, bạn sẽ nhận
            được đường dẫn đặt lại mật khẩu trong vài phút. Nhớ xem cả hộp thư rác.
          </AuthAlert>

          <p className="mt-4 border-l-4 border-ink bg-sunken p-4 text-ink-soft leading-relaxed">
            Đường dẫn chỉ dùng được <strong className="text-ink">một lần</strong> và hết hạn sau{' '}
            <strong className="text-ink">30 phút</strong>. Quá hạn thì quay lại đây xin đường dẫn mới.
          </p>

          <button type="button" onClick={() => setDaGui(false)} className={`${NUT_PHU} mt-6`}>Gửi cho email khác</button>
        </>
      ) : (
        <>
          {apiError && (
            <AuthAlert tone="danger" title="Không gửi được" className="mb-6">{apiError}</AuthAlert>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <AuthField
              id="email"
              label="Email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="email"
              autoFocus
              inputProps={register('email')}
              error={errors.email?.message}
            />

            <button type="submit" disabled={isBusy} className={NUT_CHINH}>
              {isBusy ? <><Loader2 size={20} className="animate-spin" aria-hidden="true" /> Đang gửi…</> : 'Gửi đường dẫn đặt lại'}
            </button>
          </form>
        </>
      )}

      <p className="mt-7 pt-5 border-t border-ink/20">
        <Link to="/login" className={LIEN_KET_NHE}><ArrowLeft size={16} aria-hidden="true" /> Về trang đăng nhập</Link>
      </p>
    </AuthShell>
  )
}

export default ForgotPasswordPage
