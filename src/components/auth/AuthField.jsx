// src/components/auth/AuthField.jsx

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-ink-mute">{t('auth.optional')}</span>}
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
            aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-ink-mute hover:text-brand-text transition-colors"
          >
            {show ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft leading-relaxed">{hint}</p>
      )}
      {/* `error` có thể là key dịch (lỗi zod trong authSchema) hoặc câu sẵn — t() trả nguyên văn nếu không phải key. */}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{t(error)}</p>}
    </div>
  )
}

export default AuthField
