// src/components/auth/AuthAlert.jsx
//
// Hộp thông báo trong biểu mẫu tài khoản. Trước đây lỗi dùng `text-white` trên nền danger/10 (trắng trên nền đỏ nhạt =
// gần như vô hình trên giao diện sáng) và thông báo thành công dùng nền xanh đậm mã hex cứng (#16301c) — một khối đen
// lạc tông giữa trang sáng. Nay: tiêu đề/nội dung dùng màu chữ chính, chỉ biểu tượng và viền mang màu trạng thái.
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
