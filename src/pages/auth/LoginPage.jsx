// src/pages/auth/LoginPage.jsx
//
// ĐĂNG NHẬP. Logic (useAuth.handleLogin, schema, đăng nhập Google qua Firebase) giữ nguyên; làm lại 30/09/2026 trong
// thế giới "tờ chương trình".
// - Thông báo lỗi đăng nhập lấy NGUYÊN câu của backend: backend cố ý trả cùng một câu cho "sai mật khẩu" và "không có
//   tài khoản" (chống dò tài khoản) — giao diện không được tự đoán và nói rõ hơn.
// - Nút Google CHỈ hiện khi đã cấu hình. Bản cũ in nút "Tiếp tục với Google (chưa cấu hình)": một nút bấm vào không
//   làm được gì.
// - Ô email mang autocomplete="username": đó là giá trị trình quản lý mật khẩu dùng để ghép với current-password.
//   Không chặn dán, không giới hạn ký tự ở ô mật khẩu (WCAG 2.2 SC 3.3.8, NIST SP 800-63B).
// - Sau khi báo lỗi, focus về ô email để người dùng bàn phím sửa ngay, không phải dò lại từ đầu trang.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema } from '../../schemas/authSchema'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'
import { NUT_CHINH, NUT_PHU, LIEN_KET } from '../../components/auth/kieuNut'

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

  const { register, handleSubmit, setFocus, resetField, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched', // kiểm khi RỜI ô, và gỡ lỗi ngay khi gõ lại cho đúng — không báo lỗi giữa lúc đang gõ (NN/g, Baymard)
  })

  const onSubmit = async ({ email, password }) => {
    setApiError(null)
    try {
      await handleLogin(email, password)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng.')
      // Sai thì xoá ô mật khẩu (GOV.UK: không giữ lại mật khẩu sai), email giữ nguyên; focus về email để sửa ngay.
      resetField('password')
      setFocus('email')
    }
  }

  return (
    <AuthShell withAside>
      <h1 className="text-5xl text-ink mb-2">Đăng nhập</h1>
      <p className="text-ink-soft mb-7">Vé, chỗ ngồi và phòng trà bạn theo dõi vẫn ở đó.</p>

      {apiError && (
        <AuthAlert tone="danger" title="Đăng nhập không thành công" className="mb-6">{apiError}</AuthAlert>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          inputProps={register('email')}
          error={errors.email?.message}
        />
        <AuthField
          id="password"
          label="Mật khẩu"
          secret
          autoComplete="current-password"
          inputProps={register('password')}
          error={errors.password?.message}
        />
        <p className="-mt-2"><Link to="/forgot-password" className={LIEN_KET}>Quên mật khẩu?</Link></p>

        <button type="submit" disabled={isSubmitting} className={NUT_CHINH}>
          {isSubmitting ? <><Loader2 size={20} className="animate-spin" aria-hidden="true" /> Đang đăng nhập…</> : 'Đăng nhập'}
        </button>
      </form>

      {isGoogleLoginAvailable && (
        <>
          <p className="flex items-center gap-3 my-6 text-sm text-ink-mute" aria-hidden="true">
            <span className="flex-1 border-t border-ink/20" />hoặc<span className="flex-1 border-t border-ink/20" />
          </p>
          <button type="button" onClick={() => handleGoogleSignIn(false)} disabled={isSubmitting} className={NUT_PHU}>
            <GoogleIcon /> Tiếp tục với Google
          </button>
        </>
      )}

      <p className="mt-7 pt-5 border-t border-ink/20 text-ink-soft">
        Chưa có tài khoản? <Link to="/register" className={LIEN_KET}>Tạo tài khoản</Link>
      </p>
    </AuthShell>
  )
}

export default LoginPage
