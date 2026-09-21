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
import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AudioLines, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Loader2, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../../services/aServices'
import { resetPasswordSchema } from '../../schemas/authSchema'

const inputCls = 'w-full pl-10 pr-11 py-3 bg-card border border-line-strong rounded-lg text-ink placeholder-[#BCAFA0] text-sm focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none transition-all'

// Khung ngoài dùng chung cho cả hai trạng thái của trang (có token / không token), tách ra ngoài
// component để không bị định nghĩa lại mỗi lần render.
const Khung = ({ children }) => (
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
          {children}
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

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [apiError, setApiError] = useState(null)
  const [isBusy, setIsBusy] = useState(false)
  const [hienMk, setHienMk] = useState(false)
  const [hienXacNhan, setHienXacNhan] = useState(false)

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
      <Khung>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-danger/10 border border-danger/40 flex items-center justify-center">
            <AlertCircle size={26} className="text-danger" />
          </div>
          <h1 className="text-2xl text-ink mt-5 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Thiếu đường dẫn đặt lại
          </h1>
          <p className="text-sm text-ink-soft leading-relaxed">
            Trang này chỉ mở được từ đường dẫn trong email đặt lại mật khẩu. Nếu bạn dán đường dẫn bằng
            tay, có thể đã bị thiếu một đoạn — hãy bấm thẳng vào đường dẫn trong email, hoặc xin một
            đường dẫn mới.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 w-full py-3.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-ink font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Xin đường dẫn mới <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="mt-5 text-sm text-brand-text hover:underline inline-flex items-center gap-1.5">
            <ArrowLeft size={15} /> Về trang đăng nhập
          </Link>
        </div>
      </Khung>
    )
  }

  return (
    <Khung>
      <div className="mb-6">
        <span className="text-xs text-brand-text tracking-widest uppercase block mb-1">Đặt Lại Lối Vào</span>
        <h1 className="text-2xl sm:text-3xl text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mật Khẩu Mới
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          Chọn mật khẩu mới cho tài khoản của bạn. Đường dẫn này dùng một lần.
        </p>
      </div>

      {apiError && (
        <div role="alert" className="mb-6 p-3.5 rounded-lg bg-danger/10 border border-danger/40 text-white flex items-start gap-3">
          <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-snug">
            <p className="font-semibold">Không đặt lại được</p>
            <p className="text-danger mt-0.5 leading-relaxed">{apiError}</p>
            <Link to="/forgot-password" className="text-brand-text hover:underline inline-block mt-2">
              Xin đường dẫn mới
            </Link>
          </div>
        </div>
      )}

      {/* Gợi ý độ dài đặt TRƯỚC ô nhập: nói sau khi người dùng gõ xong mới báo lỗi là bắt gõ lại. */}
      <div className="mb-5 p-4 rounded-lg bg-card border border-line-strong/50">
        <p className="text-xs text-ink-soft flex items-start gap-2 leading-relaxed">
          <KeyRound size={14} className="text-brand-text flex-shrink-0 mt-px" />
          <span>
            Mật khẩu cần <strong className="text-ink">từ 15 đến 64 ký tự</strong>. Không bắt buộc chữ hoa,
            số hay ký tự đặc biệt — một cụm từ dễ nhớ vừa dài vừa an toàn hơn chuỗi ký tự rối, ví dụ
            <em className="text-ink"> &ldquo;toi thich nghe nhac trinh&rdquo;</em>.
          </span>
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="block text-xs text-ink mb-2 uppercase tracking-wider" htmlFor="newPassword">
            Mật Khẩu Mới <span className="text-brand-text">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-mute">
              <Lock size={18} />
            </div>
            <input
              {...register('newPassword')}
              id="newPassword"
              type={hienMk ? 'text' : 'password'}
              autoFocus
              placeholder="Cụm từ dễ nhớ của bạn"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setHienMk((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-mute hover:text-brand-text"
              aria-label={hienMk ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {hienMk ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="block text-xs text-ink mb-2 uppercase tracking-wider" htmlFor="confirmPassword">
            Nhập Lại Mật Khẩu <span className="text-brand-text">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-mute">
              <Lock size={18} />
            </div>
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={hienXacNhan ? 'text' : 'password'}
              placeholder="Nhập lại cho chắc"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setHienXacNhan((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-mute hover:text-brand-text"
              aria-label={hienXacNhan ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {hienXacNhan ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="w-full py-3.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-ink font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {isBusy
            ? <><Loader2 size={20} className="animate-spin" /> Đang đặt lại...</>
            : <><CheckCircle2 size={18} /> Đặt lại mật khẩu</>}
        </button>
      </form>

      <div className="mt-7 text-center pt-5 border-t border-line-strong/30">
        <Link to="/login" className="text-sm text-brand-text hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft size={15} /> Về trang đăng nhập
        </Link>
      </div>
    </Khung>
  )
}

export default ResetPasswordPage
