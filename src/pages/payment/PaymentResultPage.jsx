// src/pages/payment/PaymentResultPage.jsx

// Trang trình duyệt của khách được backend Redirect() tới sau khi xử lý callback VNPay
// Dùng chung cho cả 4 luồng thanh toán (vé/donate/F&B/gói dịch vụ)

import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, ArrowLeft, LifeBuoy } from 'lucide-react'
import Reveal from '../../components/shared/Reveal'

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    ring: 'text-success bg-success/10 border-success/30',
    title: 'Thanh toán thành công',
    message: 'Giao dịch của bạn đã được ghi nhận. Nếu bạn vừa mua vé, vé sẽ có trong mục Vé của tôi.',
    primary: { to: '/my-shows', label: 'Xem vé của tôi' },
    secondary: { to: '/', label: 'Về trang chủ', icon: ArrowLeft },
  },
  failed: {
    icon: XCircle,
    ring: 'text-danger bg-danger/10 border-danger/30',
    title: 'Thanh toán chưa hoàn tất',
    message: 'Giao dịch không thành công và bạn chưa bị trừ tiền. Bạn có thể thử lại bất cứ lúc nào.',
    primary: { to: '/', label: 'Về trang chủ' },
    secondary: { to: '/complaints', label: 'Cần hỗ trợ? Gửi khiếu nại', icon: LifeBuoy },
  },
  processing: {
    icon: Clock,
    ring: 'text-warning bg-warning/10 border-warning/30',
    title: 'Đã nhận thanh toán, đang chờ xác nhận',
    message:
      'Thanh toán của bạn đã thành công nhưng chúng tôi chưa kịp xác nhận vé (có thể vé vừa hết ngay trước khi thanh toán hoàn tất). Đội ngũ sẽ kiểm tra lại — vui lòng xem mục Vé của tôi sau ít phút, hoặc liên hệ hỗ trợ nếu sau 24 giờ vẫn chưa thấy vé.',
    primary: { to: '/my-shows', label: 'Xem vé của tôi' },
    secondary: { to: '/complaints', label: 'Liên hệ hỗ trợ', icon: LifeBuoy },
  },
}

const PaymentResultPage = ({ status }) => {
  const variant = VARIANTS[status] ?? VARIANTS.failed
  const Icon = variant.icon
  const SecondaryIcon = variant.secondary.icon

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 sm:px-6 py-10">
      <Reveal className="w-full max-w-md" role="status" aria-live="polite">
        <div className="bg-card border border-line rounded-3xl p-8 sm:p-10 text-center shadow-glow">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border ${variant.ring}`}>
            <Icon size={38} strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink mb-3 leading-tight">{variant.title}</h1>
          <p className="text-ink-soft leading-relaxed mb-8">{variant.message}</p>

          <Link
            to={variant.primary.to}
            className="flex items-center justify-center w-full min-h-[52px] bg-brand text-on-brand rounded-full font-bold hover:bg-brand-hover active:scale-[0.99] transition-all"
          >
            {variant.primary.label}
          </Link>
          <Link
            to={variant.secondary.to}
            className="mt-3 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 text-sm text-ink-soft hover:text-brand-text transition-colors"
          >
            <SecondaryIcon size={15} /> {variant.secondary.label}
          </Link>
        </div>
      </Reveal>
    </div>
  )
}

export default PaymentResultPage
