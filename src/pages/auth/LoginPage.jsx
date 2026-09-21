// src/pages/auth/LoginPage.jsx
// Port từ Stitch (design system "Phòng Trà Acoustic & Lounge") — giữ nguyên cấu trúc/nội dung do
// Stitch tạo, chỉ thay hành vi JS thuần bằng React state thật + nối API thật qua useAuth.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AudioLines, MapPin, Mail, Lock, Eye, EyeOff, AlertCircle, Coffee, Music2, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema } from '../../schemas/authSchema'

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
)

const LoginPage = () => {
  const { handleLogin, handleGoogleSignIn, isSubmitting, isGoogleLoginAvailable } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen flex flex-col justify-between bg-page text-ink" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* HEADER */}
      <header className="bg-card sticky top-0 z-50 w-full shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-brand-text">
            <AudioLines size={24} />
            <span className="text-xl tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Phòng Trà Sài Gòn • MusicLounge</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-ink-soft text-sm">
              <MapPin size={16} /> Sài Gòn
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* LEFT: FOCAL PANEL */}
          <div className="lg:col-span-7 relative rounded-xl overflow-hidden min-h-[460px] lg:min-h-[640px] flex flex-col justify-end p-8 sm:p-12 shadow-2xl bg-espresso border border-cream/30">
            <div role="img" aria-label="Không gian phòng trà acoustic Sài Gòn" className="absolute inset-0 w-full h-full object-cover object-center  bg-[radial-gradient(ellipse_at_25%_15%,rgb(212_160_58/0.38),transparent_55%),radial-gradient(ellipse_at_85%_85%,rgb(138_90_18/0.40),transparent_50%)] bg-espresso-soft" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-espresso/70 via-transparent to-transparent hidden lg:block" />
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-espresso-soft/80 backdrop-blur-md border border-cream/40 mb-5">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                <span className="text-cream-mute text-xs tracking-wider uppercase">Đêm Nhạc Acoustic Trữ Tình</span>
              </div>
              <blockquote className="text-2xl sm:text-3xl italic leading-relaxed tracking-tight mb-4 text-cream" style={{ fontFamily: "'Playfair Display', serif" }}>
                &ldquo;Người đến phòng trà để lắng lại bên tách cà phê ấm và tiếng đàn mộc.&rdquo;
              </blockquote>
              <p className="text-cream-mute text-sm leading-relaxed max-w-lg">
                Nơi từng nốt nhạc Trịnh, khúc tình ca Bolero và điệu guitar mộc đưa tâm hồn về lại một Sài Gòn nguyên sơ, trầm mặc và lắng đọng.
              </p>
              <div className="mt-8 flex items-center gap-6 pt-6 border-t border-cream/30 text-cream-mute">
                <div className="flex items-center gap-2">
                  <Coffee size={18} className="text-brand-on-dark" />
                  <span className="text-xs font-medium">Cà phê &amp; Trà mạn ấm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music2 size={18} className="text-brand-on-dark" />
                  <span className="text-xs font-medium">Sân khấu mộc không điện tử</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: LOGIN CARD */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-card rounded-xl p-8 sm:p-10 border border-line-strong/40 shadow-2xl relative">
              <div className="mb-6">
                <span className="text-xs text-brand-text tracking-widest uppercase block mb-1">Lối Vào Phòng Trà</span>
                <h1 className="text-2xl sm:text-3xl text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Đăng Nhập Khách Tri Âm</h1>
                <p className="text-sm text-ink-soft">Bước vào không gian quen, giữ chỗ quen trước giờ thắp nến.</p>
              </div>

              {apiError && (
                <div role="alert" className="mb-6 p-3.5 rounded-lg bg-danger/10 border border-danger/40 text-white flex items-start gap-3">
                  <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                  <div className="text-sm leading-snug">
                    <p className="font-semibold">Đăng nhập không thành công</p>
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
                      placeholder="nhap.email@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-card border border-line-strong rounded-lg text-ink placeholder-[#BCAFA0] text-sm focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none transition-all"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs text-ink uppercase tracking-wider" htmlFor="password">
                      Mật Khẩu <span className="text-brand-text">*</span>
                    </label>
                    <Link to="/forgot-password" className="text-xs text-brand-text hover:underline">Quên mật khẩu?</Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-mute">
                      <Lock size={18} />
                    </div>
                    <input
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu của bạn"
                      className="w-full pl-10 pr-11 py-3 bg-card border border-line-strong rounded-lg text-ink placeholder-[#BCAFA0] text-sm focus:border-brand focus:ring-2 focus:ring-brand/40 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      aria-label="Hiển thị hoặc ẩn mật khẩu"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-mute hover:text-brand-text transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg bg-brand hover:bg-brand-hover text-[#120e0a] font-semibold text-base flex items-center justify-center gap-2 shadow-lg border border-brand/40 transition-all active:scale-[0.99] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>Đăng Nhập Đêm Nay</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line-strong/40" /></div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-card text-ink-soft lowercase">hoặc tiếp tục với</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGoogleSignIn(false)}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-card hover:bg-sunken border border-line-strong/60 text-ink font-medium text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
              >
                <GoogleIcon />
                <span>{isGoogleLoginAvailable ? 'Tiếp tục với Google' : 'Tiếp tục với Google (chưa cấu hình)'}</span>
              </button>

              <div className="mt-7 text-center pt-5 border-t border-line-strong/30">
                <p className="text-sm text-ink-soft">
                  Chưa có tài khoản tri âm?{' '}
                  <Link to="/register" className="text-brand-text hover:underline font-semibold">Đăng ký đặt bàn mới</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-8 px-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 bg-card border-t border-line-strong/20">
        <p className="text-xs text-ink-soft text-center md:text-left">
          © 2026 MusicLounge Sài Gòn. Bản quyền thuộc về Phòng Trà Trữ Tình &amp; Acoustic Ca Nhạc.
        </p>
      </footer>
    </div>
  )
}

export default LoginPage
