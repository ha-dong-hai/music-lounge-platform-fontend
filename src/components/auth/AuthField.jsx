// src/components/auth/AuthField.jsx
//
// MỘT Ô NHẬP CỦA FORM TÀI KHOẢN: nhãn luôn nhìn thấy phía trên ô, gợi ý và lỗi nằm dưới ô và được nối với ô bằng
// aria-describedby; ô lỗi mang aria-invalid. Ô mật khẩu có nút Hiện/Ẩn bằng CHỮ (không chỉ một biểu tượng con mắt).
// Viền ô là mực đậm 2px: DESIGN.md quy định viền ô nhập phải đậm hơn đường kẻ trang trí (đường kẻ nhạt không đạt
// 3:1 của WCAG 1.4.11 cho ranh giới của một điều khiển).
// Nhãn của nút Hiện/Ẩn mang TÊN Ô ("Hiện mật khẩu mới", "Hiện nhập lại mật khẩu mới"): trang có hai ô mật khẩu thì hai
// nút phải đọc khác nhau (GOV.UK Design System, password input).
// `icon` vẫn nhận để các trang cũ không phải sửa lời gọi, nhưng KHÔNG vẽ nữa: biểu tượng trong ô là trang trí, và nó
// lấy mất 28px bề ngang của ô trên màn 390px.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const AuthField = ({
  id,
  label,
  icon: _icon, // eslint-disable-line no-unused-vars
  error,
  hint,
  optional = false,
  secret = false,
  inputProps,
  action,
  type = 'text',
  className: lopThem = '',
  ...rest
}) => {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="font-semibold text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-ink-mute">{t('(không bắt buộc)')}</span>}
        </label>
        {action}
      </div>
      {/* Gợi ý đứng TRƯỚC ô và luôn hiện (kể cả khi đang có lỗi): người dùng cần đọc luật trước khi gõ, và khi sai
          thì càng cần thấy luật. */}
      {hint && <p id={`${id}-hint`} className="mb-1.5 text-sm text-ink-soft">{hint}</p>}
      <div className="relative">
        <input
          {...inputProps}
          {...rest}
          id={id}
          type={secret ? (show ? 'text' : 'password') : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={`w-full min-h-[48px] pl-4 ${secret ? 'pr-20' : 'pr-4'} bg-card border-2 text-ink text-base placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-card ${error ? 'border-danger' : 'border-ink'} ${lopThem}`}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
            aria-label={show ? t('Ẩn {{x}}', { x: String(label).toLowerCase() }) : t('Hiện {{x}}', { x: String(label).toLowerCase() })}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 min-w-[64px] h-11 px-3 text-sm font-semibold text-ink underline underline-offset-4 hover:bg-ink hover:text-lamp hover:no-underline transition-colors"
          >
            {show ? t('Ẩn') : t('Hiện')}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-danger">{error}</p>}
    </div>
  )
}

export default AuthField
