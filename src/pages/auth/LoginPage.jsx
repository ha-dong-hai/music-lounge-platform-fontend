// src/pages/auth/LoginPage.jsx
//
// GHI CHÚ CHO ĐỘI FE — làm lại theo docs/design/TRANG-CHU-BRIEF.md. Logic (react-hook-form + loginSchema, handleLogin,
// handleGoogleSignIn, thông báo lỗi từ backend) GIỮ NGUYÊN; chỉ đổi giao diện và câu chữ:
// - Tiêu đề rõ nghĩa ("Đăng nhập") thay cho "Đăng Nhập Khách Tri Âm", nút "Đăng nhập" thay cho "Đăng Nhập Đêm Nay":
//   đây là khoảnh khắc giao dịch, người dùng phải hiểu ngay bấm vào đâu. Chất thơ để ở dòng phụ.
// - Khung/ô nhập/hộp lỗi dùng chung (components/auth) để 4 trang tài khoản đồng bộ.
// - Bỏ 3 điều bịa ở tấm bảng bên trái (xem AuthShell); bỏ mã hex cứng #120e0a, #BCAFA0.
// - Lỗi từng ô (email/mật khẩu) gắn aria-invalid; hộp lỗi máy chủ không còn chữ trắng trên nền nhạt.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema } from '../../schemas/authSchema'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
)

const LoginPage = () => {
  const { handleLogin, handleGoogleSignIn, isSubmitting, isGoogleLoginAvailable } = useAuth()
  const [apiError, setApiError] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async ({ email, password }) => {
    setApiError(null)
    try {
      await handleLogin(email, password)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng.')
    }
  }

  return (
    <AuthShell withAside>
      <div className="mb-7">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-2">Đăng nhập</h1>
        <p className="text-ink-soft text-sm sm:text-base">Chào bạn quay lại. Vé, chỗ ngồi và phòng trà đã theo dõi vẫn ở đó.</p>
      </div>

      {apiError && (
        <AuthAlert tone="danger" title="Đăng nhập không thành công" className="mb-6">
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
          placeholder="ban@example.com"
          inputProps={register('email')}
          error={errors.email?.message}
        />
        <AuthField
          id="password"
          label="Mật khẩu"
          icon={Lock}
          secret
          autoComplete="current-password"
          placeholder="Nhập mật khẩu của bạn"
          inputProps={register('password')}
          error={errors.password?.message}
          action={
            <Link to="/forgot-password" className="inline-flex items-center min-h-[44px] -my-3 text-sm text-brand-text hover:underline">
              Quên mật khẩu?
            </Link>
          }
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[52px] rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-base flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><span>Đăng nhập</span><ArrowRight size={18} /></>}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6" role="separator">
        <span className="flex-1 border-t border-line" />
        <span className="text-xs text-ink-mute">hoặc</span>
        <span className="flex-1 border-t border-line" />
      </div>

      <button
        type="button"
        onClick={() => handleGoogleSignIn(false)}
        disabled={isSubmitting}
        className="w-full min-h-[48px] px-4 rounded-full bg-card hover:bg-sunken border border-line-strong text-ink font-medium text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        <span>{isGoogleLoginAvailable ? 'Tiếp tục với Google' : 'Tiếp tục với Google (chưa cấu hình)'}</span>
      </button>

      <p className="mt-7 pt-5 border-t border-line text-center text-sm text-ink-soft">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="inline-flex items-center min-h-[44px] text-brand-text font-semibold hover:underline underline-offset-4">
          Đăng ký
        </Link>
      </p>
    </AuthShell>
  )
}

export default LoginPage
