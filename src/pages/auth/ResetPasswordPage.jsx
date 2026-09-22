// src/pages/auth/ResetPasswordPage.jsx
//
// GHI CHÚ CHO ĐỘI FE:
// - Người dùng tới đây BẰNG LINK TRONG EMAIL: {PasswordResetUrl}?token=... Token nằm ở query string,
//   không phải path param. Không có token thì không hiện form — hiện lời giải thích, vì form không
//   token là form chắc chắn thất bại.
// - Backend trả 401 cho cả ba trường hợp: token sai, token đã dùng, token hết hạn. KHÔNG phân biệt
//   được từ phía FE, nên câu thông báo phải phủ cả ba thay vì đoán một cái.
// - 401 ở đây KHÔNG kích hoạt luồng tự đăng xuất của interceptor: config/axios.js bỏ qua mọi URL
//   chứa '/auth/'. Kiểm lại nếu có ai đổi điều kiện đó, vì đổi là màn này mất thông báo lỗi.
// - Mật khẩu 15–64 ký tự, KHÔNG có yêu cầu chữ hoa/số/ký tự đặc biệt (NIST SP 800-63B). Ngưỡng này
//   khớp cứng với lúc đăng ký — đừng nới ở đây, vì nới là ai cũng đi vòng qua ngưỡng đăng ký được
//   bằng một lượt "Quên mật khẩu". Dùng resetPasswordSchema có sẵn.
// - Đặt lại xong KHÔNG tự đăng nhập: backend chỉ trả 204, không phát token. Đưa người dùng sang
//   trang đăng nhập là đúng luồng, đừng cố tự gọi login bằng mật khẩu mới.
// - LÀM LẠI GIAO DIỆN (docs/design/TRANG-CHU-BRIEF.md): dùng khung/ô nhập/hộp thông báo chung của components/auth (bỏ chữ
//   trắng trên nền nhạt, mã hex #BCAFA0). Logic, thông báo 401 gộp ba trường hợp và ngưỡng 15–64 ký tự giữ nguyên.
import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../../services/aServices'
import { resetPasswordSchema } from '../../schemas/authSchema'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'

const backLink = (
  <div className="mt-7 pt-5 border-t border-line text-center">
    <Link to="/login" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-ink-soft hover:text-brand-text transition-colors">
      <ArrowLeft size={16} /> Về trang đăng nhập
    </Link>
  </div>
)

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [apiError, setApiError] = useState(null)
  const [isBusy, setIsBusy] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async ({ newPassword }) => {
    setApiError(null)
    setIsBusy(true)
    try {
      await resetPassword({ token, newPassword })
      toast.success('Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.')
      navigate('/login', { replace: true })
    } catch (err) {
      // 401 gộp ba trường hợp: sai / đã dùng / hết hạn. Nói cả ba thay vì đoán một cái.
      const laTokenLoi = err.response?.status === 401
      setApiError(laTokenLoi
        ? 'Đường dẫn này không dùng được nữa: có thể đã hết hạn (30 phút), đã được dùng một lần, hoặc bị sao chép thiếu. Hãy xin đường dẫn mới.'
        : err.response?.data?.message || 'Không đặt lại được mật khẩu. Thử lại sau ít phút.')
    } finally {
      setIsBusy(false)
    }
  }

  // KHÔNG TOKEN — không hiện form, vì form không token là form chắc chắn thất bại.
  if (!token) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
            <AlertCircle size={26} className="text-danger" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-5 mb-2">Thiếu đường dẫn đặt lại</h1>
          <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
            Trang này chỉ mở được từ đường dẫn trong email đặt lại mật khẩu. Nếu bạn dán đường dẫn bằng
            tay, có thể đã bị thiếu một đoạn — hãy bấm thẳng vào đường dẫn trong email, hoặc xin một
            đường dẫn mới.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 w-full min-h-[52px] rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            Xin đường dẫn mới <ArrowRight size={18} />
          </Link>
        </div>
        {backLink}
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">Đặt mật khẩu mới</h1>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          Chọn mật khẩu mới cho tài khoản của bạn. Đường dẫn này dùng một lần.
        </p>
      </div>

      {apiError && (
        <AuthAlert tone="danger" title="Không đặt lại được" className="mb-6">
          {apiError}
          <Link to="/forgot-password" className="flex items-center min-h-[44px] text-brand-text font-medium hover:underline">
            Xin đường dẫn mới
          </Link>
        </AuthAlert>
      )}

      {/* Gợi ý độ dài đặt TRƯỚC ô nhập: nói sau khi người dùng gõ xong mới báo lỗi là bắt gõ lại. */}
      <p className="mb-5 rounded-xl border border-line bg-sunken/60 p-4 text-xs text-ink-soft flex items-start gap-2 leading-relaxed">
        <KeyRound size={15} className="text-brand-text flex-shrink-0 mt-px" />
        <span>
          Mật khẩu cần <strong className="text-ink">từ 15 đến 64 ký tự</strong>. Không bắt buộc chữ hoa,
          số hay ký tự đặc biệt — một cụm từ dễ nhớ vừa dài vừa an toàn hơn chuỗi ký tự rối, ví dụ
          <em className="text-ink"> &ldquo;toi thich nghe nhac trinh&rdquo;</em>.
        </span>
      </p>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          id="newPassword"
          label="Mật khẩu mới"
          icon={Lock}
          secret
          autoComplete="new-password"
          autoFocus
          placeholder="Cụm từ dễ nhớ của bạn"
          inputProps={register('newPassword')}
          error={errors.newPassword?.message}
        />
        <AuthField
          id="confirmPassword"
          label="Nhập lại mật khẩu"
          icon={Lock}
          secret
          autoComplete="new-password"
          placeholder="Nhập lại cho chắc"
          inputProps={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isBusy}
          className="w-full min-h-[52px] rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-base flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isBusy
            ? <><Loader2 size={20} className="animate-spin" /> Đang đặt lại…</>
            : <><CheckCircle2 size={18} /> Đặt lại mật khẩu</>}
        </button>
      </form>

      {backLink}
    </AuthShell>
  )
}

export default ResetPasswordPage
