// src/components/auth/AuthAlert.jsx

import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

const TONES = {
  danger: { icon: AlertCircle, box: 'bg-danger/10 border-danger/30', iconCls: 'text-danger', role: 'alert' },
  success: { icon: CheckCircle2, box: 'bg-success/10 border-success/30', iconCls: 'text-success', role: 'status' },
  info: { icon: Info, box: 'bg-sunken border-line', iconCls: 'text-brand-text', role: 'status' },
}

const AuthAlert = ({ tone = 'danger', title, children, className = '' }) => {
  const t = TONES[tone]
  const Icon = t.icon
  return (
    <div role={t.role} className={`rounded-xl border p-4 flex items-start gap-3 ${t.box} ${className}`}>
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${t.iconCls}`} />
      <div className="text-sm leading-relaxed text-ink min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5 text-ink-soft' : ''}>{children}</div>}
      </div>
    </div>
  )
}

export default AuthAlert