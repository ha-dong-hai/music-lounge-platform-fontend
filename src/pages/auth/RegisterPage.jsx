// src/pages/auth/RegisterPage.jsx
// Port từ Stitch (cùng design system "Phòng Trà Acoustic & Lounge" với LoginPage).
//
// GHI CHÚ CHO ĐỘI FE — VÌ SAO TRANG NÀY PHẢI CHO CHỌN VAI TRÒ:
// Backend cho tự đăng ký một trong HAI vai trò (RegisterCommandValidator: "Role tự đăng ký chỉ có
// thể là 'Audience' hoặc 'Owner'"), và KHÔNG có endpoint nào đổi vai trò về sau. Trang này trước đây
// không gửi trường `role`, nên mọi người đăng ký đều thành khán giả và KHÔNG AI trở thành chủ phòng
// trà được — cả nhánh nghiệp vụ phòng trà (tạo hồ sơ, bán vé, quyết toán) là ngõ cụt từ bước đầu.
// Vì không đổi lại được, lựa chọn này phải nói rõ hệ quả TRƯỚC khi bấm, không phải một ô chọn lặng lẽ.
//
// MỞ CỬA Ở ĐÂY LÀ AN TOÀN vì hàng rào nằm PHÍA SAU chứ không nằm ở bước đăng ký (đã xác nhận với
// backend): đăng ký Owner xong mới chỉ có tài khoản, chưa có phòng trà; tạo hồ sơ phòng trà rồi phải
// chờ Admin duyệt (MLACP-307); và bán vé còn một cửa nữa là xác minh danh tính người bán (MLACP-397).
// Một tài khoản Owner chưa qua hai cửa đó thì không làm được gì có hậu quả.
// Mô tả bên dưới phải nói đủ CẢ HAI cửa — nói một cửa là để người ta tưởng sắp bán được ngay.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Music2, User, Mail, Phone, Lock, Eye, EyeOff, Shield, AlertCircle, ArrowRight, Loader2, Store, Ticket } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { registerSchema } from '../../schemas/authSchema'

const RegisterPage = () => {
  const { handleRegister, isSubmitting } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  // Vai trò KHÔNG nằm trong zod schema vì nó không phải dữ liệu người dùng gõ — nó là một lựa chọn
  // hai nhánh, luôn có giá trị, không thể sai định dạng.
  const [role, setRole] = useState('Audience')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  })

  const onSubmit = async ({ fullName, email, phone, password, acceptTerms }) => {
    setApiError(null)
    try {
      await handleRegister({ email, password, fullName, phone: phone || null, acceptTerms, role })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-page text-ink" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-page/90 backdrop-blur-md border-b border-line-strong/30">
        <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-7xl mx-auto h-20">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-sunken border border-brand/40 flex items-center justify-center text-brand-text">
              <Music2 size={18} />
            </span>
            <span className="text-xl text-brand-text tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>Phòng Trà Sài Gòn</span>
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-brand/40 text-brand-text hover:border-brand hover:bg-brand-hover/10 text-sm transition-all">
            Đăng Nhập
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-10 md:py-16 px-4 md:px-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-line-strong/20 text-sm text-ink-soft">
            <span>Sổ Vàng Tri Âm / <span className="text-brand-text font-medium">Ghi Danh Mới</span></span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* LEFT: CHAMBER VISUAL */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-espresso p-6 md:p-8 border border-brand/20 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-espresso-soft border border-brand/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <span className="text-brand-on-dark text-xs tracking-widest uppercase">Thư Mời Tri Âm</span>
                </div>
                <span className="italic text-brand-on-dark/70 text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Khởi lập 1972</span>
              </div>
              <div className="relative rounded-lg overflow-hidden shadow-2xl my-auto">
                <div role="img" aria-label="Không gian phòng trà thính phòng Sài Gòn xưa" className="w-full h-80 lg:h-96 object-cover  bg-[radial-gradient(ellipse_at_25%_15%,rgb(212_160_58/0.38),transparent_55%),radial-gradient(ellipse_at_85%_85%,rgb(138_90_18/0.40),transparent_50%)] bg-espresso-soft" />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/30 to-transparent" />
              </div>
              <div className="mt-6 pt-6 border-t border-cream/20">
                <blockquote className="italic text-lg leading-relaxed mb-3 text-cream" style={{ fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;Người về ngồi lắng tiếng tơ xưa,<br />Khói quyện bàn con ấm bóng dừa...&rdquo;
                </blockquote>
                <p className="text-cream-mute text-sm">
                  Đặc quyền giữ góc bàn quen, thưởng thức các danh ca thính phòng và tuyển tập nhạc tờ nguyên bản từ những năm tháng vàng son.
                </p>
              </div>
            </div>

            {/* RIGHT: REGISTER FORM */}
            <div className="lg:col-span-7 flex flex-col justify-center rounded-xl bg-card p-6 md:p-10 border border-line-strong/40">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl text-brand-text mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ghi Danh Khách Tri Âm</h1>
                <p className="text-ink-soft text-sm">Mở lối riêng để thưởng thức những đêm nhạc thính phòng và lưu lại góc bàn quen.</p>
              </div>

              {apiError && (
                <div role="alert" className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/40 text-sm flex items-start gap-3">
                  <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5 text-ink">Thông báo từ ban quản trị:</span>
                    <span className="text-danger">{apiError}</span>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* CHỌN VAI TRÒ — đặt ĐẦU form vì nó quyết định mọi thứ phía sau, và KHÔNG đổi lại
                    được sau khi đăng ký (backend không có endpoint đổi vai trò). */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-ink-soft uppercase tracking-wider">
                    Bạn đăng ký với tư cách <span className="text-brand-text">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        value: 'Audience',
                        icon: Ticket,
                        ten: 'Khán giả',
                        mo: 'Mua vé, xem buổi diễn, tặng tiền nghệ sĩ.',
                      },
                      {
                        value: 'Owner',
                        icon: Store,
                        ten: 'Chủ phòng trà',
                        mo: 'Mở phòng trà, tổ chức buổi diễn, bán vé. Sau khi đăng ký còn hai bước nữa: hồ sơ phòng trà phải được duyệt, và bạn phải xác minh danh tính.',
                      },
                    ].map(({ value, icon: Icon, ten, mo }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRole(value)}
                        className={`text-left p-3.5 rounded-lg border transition-colors ${
                          role === value
                            ? 'border-brand bg-brand/10'
                            : 'border-line-strong/60 hover:border-line-strong'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-bold text-ink">
                          <Icon size={16} className={role === value ? 'text-brand-text' : 'text-ink-mute'} />
                          {ten}
                        </span>
                        <span className="block text-xs text-ink-soft mt-1 leading-relaxed">{mo}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-brand-text/90 leading-relaxed pt-1">
                    Chọn xong không đổi lại được. Cần cả hai thì đăng ký hai tài khoản với hai email khác nhau.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-ink-soft uppercase tracking-wider" htmlFor="fullName">
                    Họ và tên tri âm <span className="text-brand-text">*</span>
                  </label>
                  <div className="relative flex items-center rounded-lg bg-card border border-line-strong/60 focus-within:border-brand">
                    <span className="pl-4 text-ink-mute flex items-center pointer-events-none"><User size={18} /></span>
                    <input {...register('fullName')} id="fullName" type="text" placeholder="Ví dụ: Trịnh Thái An" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-4 text-ink placeholder:text-ink-mute/70 focus:ring-0 text-sm rounded-lg" />
                  </div>
                  {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-ink-soft uppercase tracking-wider" htmlFor="email">
                    Địa chỉ thư điện tử <span className="text-brand-text">*</span>
                  </label>
                  <div className="relative flex items-center rounded-lg bg-card border border-line-strong/60 focus-within:border-brand">
                    <span className="pl-4 text-ink-mute flex items-center pointer-events-none"><Mail size={18} /></span>
                    <input {...register('email')} id="email" type="email" placeholder="triam@musiclounge.vn" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-4 text-ink placeholder:text-ink-mute/70 focus:ring-0 text-sm rounded-lg" />
                  </div>
                  {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-ink-soft uppercase tracking-wider" htmlFor="phone">
                    Số điện thoại liên lạc (Không bắt buộc)
                  </label>
                  <div className="relative flex items-center rounded-lg bg-card border border-line-strong/60 focus-within:border-brand">
                    <span className="pl-4 text-ink-mute flex items-center pointer-events-none"><Phone size={18} /></span>
                    <input {...register('phone')} id="phone" type="tel" placeholder="090 ••• ••••" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-4 text-ink placeholder:text-ink-mute/70 focus:ring-0 text-sm rounded-lg" />
                  </div>
                  {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-ink-soft uppercase tracking-wider" htmlFor="password">
                    Mật khẩu tri âm <span className="text-brand-text">*</span>
                  </label>
                  <div className="relative flex items-center rounded-lg bg-card border border-line-strong/60 focus-within:border-brand">
                    <span className="pl-4 text-ink-mute flex items-center pointer-events-none"><Lock size={18} /></span>
                    <input {...register('password')} id="password" type={showPassword ? 'text' : 'password'} placeholder="•••••••••••••••" className="w-full bg-transparent border-0 py-3.5 pl-3 pr-12 text-ink placeholder:text-ink-mute/70 focus:ring-0 text-sm rounded-lg" />
                    <button type="button" aria-label="Bật tắt xem mật khẩu" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 text-ink-mute hover:text-brand-text">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-ink-soft flex items-start gap-1.5 pt-1">
                    <Shield size={16} className="text-brand-text flex-shrink-0 mt-0.5" />
                    <span>Ít nhất 15 ký tự — một cụm từ dễ nhớ thường an toàn hơn chuỗi ký tự ngắn phức tạp.</span>
                  </p>
                  {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input {...register('acceptTerms')} type="checkbox" className="mt-1 w-4 h-4 rounded text-brand-text bg-card border-line-strong/60 focus:ring-brand" />
                    <span className="text-sm text-ink-soft group-hover:text-ink leading-relaxed">
                      Tôi đồng ý với <a className="text-brand-text hover:underline font-medium" href="/terms" target="_blank" rel="noreferrer">Điều khoản dịch vụ</a> và{' '}
                      <a className="text-brand-text hover:underline font-medium" href="/privacy" target="_blank" rel="noreferrer">Chính sách bảo mật</a>
                    </span>
                  </label>
                  {errors.acceptTerms && <p className="text-xs text-danger mt-1">{errors.acceptTerms.message}</p>}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-lg bg-brand hover:bg-brand-hover text-on-brand font-semibold text-base flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.99] disabled:opacity-70"
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
                  <p className="text-sm text-ink-soft">
                    Đã có sổ tri âm?{' '}
                    <Link to="/login" className="text-brand-text font-semibold underline underline-offset-4">Đăng nhập ngay</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-card border-t border-line-strong/20 mt-auto py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ink-soft">
          <span>© 2026 Phòng Trà Sài Gòn Tri Âm. Giữ trọn thanh âm trữ tình &amp; bolero xưa.</span>
        </div>
      </footer>
    </div>
  )
}

export default RegisterPage
