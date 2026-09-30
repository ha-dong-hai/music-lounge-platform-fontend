// src/components/auth/AuthAlert.jsx
//
// HỘP BÁO của form tài khoản. Ba mức phân biệt bằng BIỂU TƯỢNG + CHỮ + vạch trái, không chỉ bằng màu (WCAG 1.4.1).
// Lỗi dùng role="alert" để trình đọc màn hình đọc ngay; hai mức còn lại dùng role="status".
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const TONES = {
  danger: { icon: AlertCircle, box: 'border-danger bg-danger-soft', iconCls: 'text-danger', role: 'alert' },
  success: { icon: CheckCircle2, box: 'border-success bg-card', iconCls: 'text-success', role: 'status' },
  info: { icon: Info, box: 'border-ink bg-sunken', iconCls: 'text-ink', role: 'status' },
}

const AuthAlert = ({ tone = 'danger', title, children, className = '' }) => {
  const t = TONES[tone]
  const Icon = t.icon
  return (
    <div role={t.role} className={`border-l-4 p-4 flex items-start gap-3 ${t.box} ${className}`}>
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${t.iconCls}`} aria-hidden="true" />
      <div className="leading-relaxed text-ink min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-ink-soft' : ''}>{children}</div>}
      </div>
    </div>
  )
}

export default AuthAlert
