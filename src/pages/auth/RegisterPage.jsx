// src/pages/auth/RegisterPage.jsx
// Port từ Stitch (cùng design system "Phòng Trà Acoustic & Lounge" với LoginPage).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Music2, User, Mail, Phone, Lock, Eye, EyeOff, Shield, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { registerSchema } from '../../schemas/authSchema'

const RegisterPage = () => {
  const { handleRegister, isSubmitting } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  })

  const onSubmit = async ({ fullName, email, phone, password, acceptTerms }) => {
    setApiError(null)
    try {
      await handleRegister({ email, password, fullName, phone: phone || null, acceptTerms })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#17130f] text-[#ebe1d9]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-[#17130f]/90 backdrop-blur-md border-b border-[#504535]/30">
        <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-7xl mx-auto h-20">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#2e2925] border border-[#ffc665]/40 flex items-center justify-center text-[#ffc665]">
              <Music2 size={18} />
            </span>
            <span className="text-xl text-[#ffc665] tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Phòng Trà Sài Gòn</span>
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[#ffc665]/40 text-[#ffc665] hover:border-[#ffc665] hover:bg-[#ffc665]/10 text-sm transition-all">
            Đăng Nhập
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-10 md:py-16 px-4 md:px-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#504535]/20 text-sm text-[#d4c4b0]">
            <span>Sổ Vàng Tri Âm / <span className="text-[#ffc665] font-medium">Ghi Danh Mới</span></span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* LEFT: CHAMBER VISUAL */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-[#110d0a] p-6 md:p-8 border border-[#e5a93c]/20 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#231f1a] border border-[#e5a93c]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffc665]" />
                  <span className="text-[#ffc665] text-xs tracking-widest uppercase">Thư Mời Tri Âm</span>
                </div>
                <span className="italic text-[#ffc665]/70 text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Khởi lập 1972</span>
              </div>
              <div className="relative rounded-lg overflow-hidden shadow-2xl my-auto">
                <img
                  alt="Không gian phòng trà thính phòng Sài Gòn xưa"
                  className="w-full h-80 lg:h-96 object-cover brightness-90"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1UfzZ082tfIivj9M-SfhdGYc34otisy4pxBQDV6homP1gw-qgjqx8xQWqbJabHqXTeEBkeokhWwR3b3hBAX9OXjrDcfMWP_v8mYZJouvBZtK6kztcQ1YDU2YK8rF-GlvLR7G_gwLUuooOX74KrFDA8UbOmfFEs1NjxGqxwZ7Phfcl0WhNvl2gQdxVIzcoUZG7FgEcAmxLvlKMgPjtI_TV3u1QK5DuaheHzCzKjRKpdQlNo3hT4VjAOurMpk"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#110d0a] via-[#110d0a]/30 to-transparent" />
              </div>
              <div className="mt-6 pt-6 border-t border-[#504535]/20">
                <blockquote className="italic text-lg leading-relaxed mb-3 text-[#ebe1d9]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;Người về ngồi lắng tiếng tơ xưa,<br />Khói quyện bàn con ấm bóng dừa...&rdquo;
                </blockquote>
                <p className="text-[#d4c4b0] text-sm">
                  Đặc quyền giữ góc bàn quen, thưởng thức các danh ca thính phòng và tuyển tập nhạc tờ nguyên bản từ những năm tháng vàng son.
                </p>
              </div>
            </div>

            {/* RIGHT: REGISTER FORM */}
            <div className="lg:col-span-7 flex flex-col justify-center rounded-xl bg-[#1f1b17] p-6 md:p-10 border border-[#504535]/40">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl text-[#ffc665] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ghi Danh Khách Tri Âm</h1>
                <p className="text-[#d4c4b0] text-sm">Mở lối riêng để thưởng thức những đêm nhạc thính phòng và lưu lại góc bàn quen.</p>
              </div>

              {apiError && (
                <div role="alert" className="mb-6 p-4 rounded-lg bg-[#3d1414] border border-[#832420] text-sm flex items-start gap-3">
                  <AlertCircle size={20} className="text-[#ffb4ac] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5 text-white">Thông báo từ ban quản trị:</span>
                    <span className="text-[#ffcdd2]">{apiError}</span>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#d4c4b0] uppercase tracking-wider" htmlFor="fullName">
                    Họ và tên tri âm <span className="text-[#ffc665]">*</span>
                  </label>
                  <div className="relative flex items-center rounded-lg bg-[#110d0a] border border-[#504535]/60 focus-within:border-[#ffc665]">
                    <span className="pl-4 text-[#9d8f7c] flex items-center pointer-events-none"><User size={18} /></span>
                    <input {...register('fullName')} id="fullName" type="text" placeholder="Ví dụ: Trịnh Thái An" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-4 text-[#ebe1d9] placeholder:text-[#9d8f7c]/70 focus:ring-0 text-sm rounded-lg" />
                  </div>
                  {errors.fullName && <p className="text-xs text-[#ffb4ac]">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#d4c4b0] uppercase tracking-wider" htmlFor="email">
                    Địa chỉ thư điện tử <span className="text-[#ffc665]">*</span>
                  </label>
                  <div className="relative flex items-center rounded-lg bg-[#110d0a] border border-[#504535]/60 focus-within:border-[#ffc665]">
                    <span className="pl-4 text-[#9d8f7c] flex items-center pointer-events-none"><Mail size={18} /></span>
                    <input {...register('email')} id="email" type="email" placeholder="triam@musiclounge.vn" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-4 text-[#ebe1d9] placeholder:text-[#9d8f7c]/70 focus:ring-0 text-sm rounded-lg" />
                  </div>
                  {errors.email && <p className="text-xs text-[#ffb4ac]">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#d4c4b0] uppercase tracking-wider" htmlFor="phone">
                    Số điện thoại liên lạc (Không bắt buộc)
                  </label>
                  <div className="relative flex items-center rounded-lg bg-[#110d0a] border border-[#504535]/60 focus-within:border-[#ffc665]">
                    <span className="pl-4 text-[#9d8f7c] flex items-center pointer-events-none"><Phone size={18} /></span>
                    <input {...register('phone')} id="phone" type="tel" placeholder="090 ••• ••••" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-4 text-[#ebe1d9] placeholder:text-[#9d8f7c]/70 focus:ring-0 text-sm rounded-lg" />
                  </div>
                  {errors.phone && <p className="text-xs text-[#ffb4ac]">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#d4c4b0] uppercase tracking-wider" htmlFor="password">
                    Mật khẩu tri âm <span className="text-[#ffc665]">*</span>
                  </label>
                  <div className="relative flex items-center rounded-lg bg-[#110d0a] border border-[#504535]/60 focus-within:border-[#ffc665]">
                    <span className="pl-4 text-[#9d8f7c] flex items-center pointer-events-none"><Lock size={18} /></span>
                    <input {...register('password')} id="password" type={showPassword ? 'text' : 'password'} placeholder="•••••••••••••••" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-12 text-[#ebe1d9] placeholder:text-[#9d8f7c]/70 focus:ring-0 text-sm rounded-lg" />
                    <button type="button" aria-label="Bật tắt xem mật khẩu" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 text-[#9d8f7c] hover:text-[#ffc665]">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-[#d4c4b0] flex items-start gap-1.5 pt-1">
                    <Shield size={16} className="text-[#ffc665] flex-shrink-0 mt-0.5" />
                    <span>Ít nhất 15 ký tự — một cụm từ dễ nhớ thường an toàn hơn chuỗi ký tự ngắn phức tạp.</span>
                  </p>
                  {errors.password && <p className="text-xs text-[#ffb4ac]">{errors.password.message}</p>}
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input {...register('acceptTerms')} type="checkbox" className="mt-1 w-4 h-4 rounded text-[#e5a93c] bg-[#110d0a] border-[#504535]/60 focus:ring-[#ffc665]" />
                    <span className="text-sm text-[#d4c4b0] group-hover:text-[#ebe1d9] leading-relaxed">
                      Tôi đồng ý với <a className="text-[#ffc665] hover:underline font-medium" href="/terms" target="_blank" rel="noreferrer">Điều khoản dịch vụ</a> và{' '}
                      <a className="text-[#ffc665] hover:underline font-medium" href="/privacy" target="_blank" rel="noreferrer">Chính sách bảo mật</a>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="text-xs text-[#ffb4ac] mt-1">{errors.acceptTerms.message}</p>}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-lg bg-[#e5a93c] hover:bg-[#ffc665] text-[#281900] font-semibold text-base flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.99] disabled:opacity-70"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                      <>
                        <span>Khởi Tạo Thư Tri Âm</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-3">
                  <p className="text-sm text-[#d4c4b0]">
                    Đã có sổ tri âm?{' '}
                    <Link to="/login" className="text-[#ffc665] font-semibold underline underline-offset-4">Đăng nhập ngay</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#110d0a] border-t border-[#504535]/20 mt-auto py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#d4c4b0]">
          <span>© 2026 Phòng Trà Sài Gòn Tri Âm. Giữ trọn thanh âm trữ tình &amp; bolero xưa.</span>
        </div>
      </footer>
    </div>
  )
}

export default RegisterPage
