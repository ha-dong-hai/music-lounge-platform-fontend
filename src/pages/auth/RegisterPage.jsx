// src/pages/auth/RegisterPage.jsx
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
//
// LÀM LẠI GIAO DIỆN (docs/design/TRANG-CHU-BRIEF.md) — logic (form, schema, vai trò, gửi `role`) GIỮ NGUYÊN:
// - Tiêu đề/nhãn/nút nói thẳng việc: "Tạo tài khoản", "Họ và tên", "Mật khẩu", "Tạo tài khoản" (bản cũ: "Ghi Danh Khách
//   Tri Âm", "Họ và tên tri âm", "Khởi Tạo Thư Tri Âm" — người lạ không đoán được đây là nút gì). Chất thơ chỉ còn ở
//   tấm bảng bên trái (chỉ hiện từ màn lớn).
// - Bỏ dòng "Khởi lập 1972" (chi tiết bịa) và câu "nhạc tờ nguyên bản" (nền tảng không có tính năng đó).
// - Chọn vai trò là radio thật (bàn phím: mũi tên; trình đọc màn hình đọc "nhóm 2 lựa chọn"), không còn hai nút giả radio.
// - Ô nhập/hộp lỗi dùng chung components/auth.
//
// 30/09/2026 — chuyển sang thế giới "tờ chương trình": góc vuông, viền mực, ô chọn vai trò là hai ô giấy có dấu chọn
// bằng CHỮ ("Đã chọn") chứ không chỉ đổi màu viền; luật mật khẩu in TRƯỚC ô và luôn hiện; bỏ chữ mẫu trong ô (chữ mẫu
// biến mất khi gõ và hay bị tưởng là ô đã điền).
//
// TỒN ĐỌNG (không thuộc FE quyết): liên kết "Điều khoản dịch vụ" (/terms) và "Chính sách bảo mật" (/privacy) HIỆN CHƯA
// CÓ TRANG — AppRouter không khai báo route nên bấm vào rơi về trang 404. Nội dung pháp lý phải do bên vận hành cung cấp;
// FE không tự bịa. Backend lại bắt buộc acceptTerms, nên đừng gỡ ô này.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { registerSchema } from '../../schemas/authSchema'
import AuthShell from '../../components/auth/AuthShell'
import AuthField from '../../components/auth/AuthField'
import AuthAlert from '../../components/auth/AuthAlert'
import { NUT_CHINH, LIEN_KET } from '../../components/auth/kieuNut'

const ROLES = [
  {
    value: 'Audience',
    ten: 'Khán giả',
    mo: 'Mua vé, xem buổi diễn, tặng tiền nghệ sĩ.',
  },
  {
    value: 'Owner',
    ten: 'Chủ phòng trà',
    mo: 'Mở phòng trà, tổ chức buổi diễn, bán vé. Sau khi đăng ký còn hai bước nữa: hồ sơ phòng trà phải được duyệt, và bạn phải xác minh danh tính.',
  },
]

const RegisterPage = () => {
  const { handleRegister, isSubmitting } = useAuth()
  const [apiError, setApiError] = useState(null)
  // Vai trò KHÔNG nằm trong zod schema vì nó không phải dữ liệu người dùng gõ — nó là một lựa chọn
  // hai nhánh, luôn có giá trị, không thể sai định dạng.
  const [role, setRole] = useState('Audience')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
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
    <AuthShell withAside>
      <h1 className="text-5xl text-ink mb-2">Tạo tài khoản</h1>
      <p className="text-ink-soft mb-7">Mất chưa đến một phút. Bạn sẽ nhận mã xác thực qua email.</p>

      {apiError && (
        <AuthAlert tone="danger" title="Không tạo được tài khoản" className="mb-6">{apiError}</AuthAlert>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* CHỌN VAI TRÒ — đặt ĐẦU form vì nó quyết định mọi thứ phía sau, và KHÔNG đổi lại
            được sau khi đăng ký (backend không có endpoint đổi vai trò). */}
        {/* min-w-0: fieldset mặc định không co nhỏ hơn nội dung (xem VerifyEmailPage). KHÔNG đặt m-0: Tailwind preflight đã
            đưa margin fieldset về 0, còn `space-y-5` của form đặt khoảng cách bằng margin-bottom — m-0 sẽ xoá mất khoảng
            cách đó (lỗi đã gặp: chú thích dính sát nhãn "Họ và tên"). */}
        <fieldset className="min-w-0">
          <legend className="font-semibold text-ink mb-1.5">Bạn đăng ký với tư cách</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLES.map(({ value, ten, mo }) => (
              <label
                key={value}
                className={`relative block cursor-pointer border-2 border-ink p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 ${
                  role === value ? 'bg-ink text-lamp' : 'bg-card text-ink hover:bg-sunken'
                }`}
              >
                <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl leading-none">{ten}</span>
                  {role === value && <span className="font-mono text-xs">Đã chọn</span>}
                </span>
                <span className={`block text-sm mt-2 leading-relaxed ${role === value ? 'text-lamp-mute' : 'text-ink-soft'}`}>{mo}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-ink-soft leading-relaxed mt-2">
            Chọn xong không đổi lại được. Cần cả hai thì đăng ký hai tài khoản với hai email khác nhau.
          </p>
        </fieldset>

        <AuthField id="fullName" label="Họ và tên" autoComplete="name" inputProps={register('fullName')} error={errors.fullName?.message} />
        <AuthField id="email" label="Email" type="email" inputMode="email" autoCapitalize="none" spellCheck={false} autoComplete="email"
          inputProps={register('email')} error={errors.email?.message} />
        <AuthField id="phone" label="Số điện thoại" optional type="tel" inputMode="tel" autoComplete="tel"
          inputProps={register('phone')} error={errors.phone?.message} />
        <AuthField
          id="password"
          label="Mật khẩu"
          secret
          autoComplete="new-password"
          hint="Từ 15 đến 64 ký tự. Không bắt buộc chữ hoa, số hay ký tự đặc biệt: một cụm từ dễ nhớ là đủ."
          inputProps={register('password')}
          error={errors.password?.message}
        />

        <div>
          {/* Cả dòng là vùng bấm: nhãn cao tối thiểu 44px (ô tích 20px một mình quá nhỏ cho ngón tay). */}
          <label className="flex items-start gap-3 cursor-pointer select-none min-h-[44px] py-2.5">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              aria-invalid={errors.acceptTerms ? 'true' : undefined}
              aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
              className="mt-0.5 w-5 h-5 border-2 border-ink accent-ink flex-shrink-0"
            />
            <span className="text-ink-soft leading-relaxed">
              Tôi đồng ý với{' '}
              <a className="text-ink font-semibold underline underline-offset-4" href="/terms" target="_blank" rel="noreferrer">Điều khoản dịch vụ</a>{' '}
              và{' '}
              <a className="text-ink font-semibold underline underline-offset-4" href="/privacy" target="_blank" rel="noreferrer">Chính sách bảo mật</a>
            </span>
          </label>
          {errors.acceptTerms && <p id="acceptTerms-error" className="text-sm font-semibold text-danger mt-1.5">{errors.acceptTerms.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className={NUT_CHINH}>
          {isSubmitting ? <><Loader2 size={20} className="animate-spin" aria-hidden="true" /> Đang tạo tài khoản…</> : 'Tạo tài khoản'}
        </button>
      </form>

      <p className="mt-7 pt-5 border-t border-ink/20 text-ink-soft">
        Đã có tài khoản? <Link to="/login" className={LIEN_KET}>Đăng nhập</Link>
      </p>
    </AuthShell>
  )
}

export default RegisterPage
