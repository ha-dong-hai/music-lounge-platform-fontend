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
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AudioLines, Mail, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Clock } from 'lucide-react'
import { forgotPassword } from '../../services/aServices'
import { forgotPasswordSchema } from '../../schemas/authSchema'

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
    <div className="min-h-screen flex flex-col justify-between bg-page text-ink" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header className="bg-card sticky top-0 z-50 w-full shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-brand-text">
            <AudioLines size={24} />
            <span className="text-xl tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              Phòng Trà Sài Gòn • MusicLounge
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl p-8 sm:p-10 border border-line-strong/40 shadow-2xl">
            <div className="mb-6">
              <span className="text-xs text-brand-text tracking-widest uppercase block mb-1">Lấy Lại Lối Vào</span>
              <h1 className="text-2xl sm:text-3xl text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Quên Mật Khẩu
              </h1>
              <p className="text-sm text-ink-soft leading-relaxed">
                Nhập email đã đăng ký. Chúng tôi gửi cho bạn một đường dẫn để đặt lại mật khẩu.
              </p>
            </div>

            {daGui ? (
              <>
                {/* Câu này trung tính có chủ đích: không tiết lộ email có tồn tại hay không. */}
                <div role="status" className="p-4 rounded-lg bg-[#16301c] border border-[#2f6b3a] flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#8fe3a4] flex-shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed">
                    <p className="font-semibold text-ink">Đã gửi yêu cầu</p>
                    <p className="text-[#c5e6cd] mt-1">
                      Nếu <span className="font-medium">{getValues('email')}</span> là email đã đăng ký, bạn sẽ nhận
                      được đường dẫn đặt lại mật khẩu trong vài phút. Nhớ xem cả hộp thư rác.
                    </p>
                  </div>
                </div>

                <div className="mt-5 p-4 rounded-lg bg-card border border-line-strong/50">
                  <p className="text-xs text-ink-soft flex items-start gap-2 leading-relaxed">
                    <Clock size={14} className="text-brand-text flex-shrink-0 mt-px" />
                    Đường dẫn chỉ dùng được <strong className="text-ink">một lần</strong> và hết hạn sau{' '}
                    <strong className="text-ink">30 phút</strong>. Quá hạn thì quay lại đây xin đường dẫn mới.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDaGui(false)}
                  className="mt-6 w-full py-3 px-4 rounded-lg bg-card hover:bg-sunken border border-line-strong/60 text-ink font-medium text-sm transition-colors"
                >
                  Gửi lại cho email khác
                </button>
              </>
            ) : (
              <>
                {apiError && (
                  <div role="alert" className="mb-6 p-3.5 rounded-lg bg-danger/10 border border-danger/40 text-white flex items-start gap-3">
                    <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                    <div className="text-sm leading-snug">
                      <p className="font-semibold">Không gửi được</p>
                      <p className="text-danger">{apiError}</p>
                    </div>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div>
                    <label className="block text-xs text-ink mb-2 uppercase tracking-wider" htmlFor="email">
                      Địa Chỉ Email <span className="text-brand-text">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-mute">
                        <Mail size={18} />
                      </div>
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        autoFocus
                        placeholder="nhap.email@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-card border border-line-strong rounded-lg text-ink placeholder-[#BCAFA0] text-sm focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none transition-all"
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-3.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-ink font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isBusy ? <><Loader2 size={20} className="animate-spin" /> Đang gửi...</> : <>Gửi đường dẫn đặt lại <ArrowRight size={20} /></>}
                  </button>
                </form>
              </>
            )}

            <div className="mt-7 text-center pt-5 border-t border-line-strong/30">
              <Link to="/login" className="text-sm text-brand-text hover:underline inline-flex items-center gap-1.5">
                <ArrowLeft size={15} /> Về trang đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 px-6 max-w-7xl mx-auto bg-card border-t border-line-strong/20">
        <p className="text-xs text-ink-soft text-center">
          © 2026 MusicLounge Sài Gòn. Bản quyền thuộc về Phòng Trà Trữ Tình &amp; Acoustic Ca Nhạc.
        </p>
      </footer>
    </div>
  )
}

export default ForgotPasswordPage
