// src/components/auth/AuthField.jsx
//
// Một ô nhập cho biểu mẫu tài khoản — nhãn, biểu tượng, gợi ý, lỗi, nút hiện/ẩn mật khẩu.
// Vì sao viết lại (docs/design/TRANG-CHU-BRIEF.md):
// - Nhãn cũ viết HOA + giãn chữ ("ĐỊA CHỈ EMAIL") — với tiếng Việt có dấu, chữ hoa giãn cách khó đọc hơn và trông như
//   biểu mẫu hành chính. Nhãn thường, đậm vừa, cỡ 14px.
// - Ô cao 48px (đủ ngón tay); nút hiện/ẩn mật khẩu 44px và có aria-pressed (trước đây nút 20px, nhãn cố định
//   "Bật tắt xem mật khẩu" không nói trạng thái).
// - Lỗi gắn với ô bằng aria-invalid + aria-describedby để trình đọc màn hình đọc lỗi cùng ô đó.
// - Màu placeholder dùng token thay cho mã hex cứng #BCAFA0.
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const AuthField = ({
  id,
  label,
  icon: Icon,
  error,
  hint,
  optional = false,
  secret = false,
  inputProps,
  action,
  type = 'text',
  ...rest
}) => {
  const [show, setShow] = useState(false)
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-ink-mute">(không bắt buộc)</span>}
        </label>
        {action}
      </div>
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-mute">
            <Icon size={18} />
          </span>
        )}
        <input
          {...inputProps}
          {...rest}
          id={id}
          type={secret ? (show ? 'text' : 'password') : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full min-h-[48px] ${Icon ? 'pl-11' : 'pl-4'} ${secret ? 'pr-12' : 'pr-4'} bg-card border rounded-xl text-ink text-base sm:text-sm placeholder:text-ink-mute transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 ${error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-brand-text'}`}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-ink-mute hover:text-brand-text transition-colors"
          >
            {show ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft leading-relaxed">{hint}</p>
      )}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}

export default AuthField
