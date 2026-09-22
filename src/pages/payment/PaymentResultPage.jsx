// src/pages/payment/PaymentResultPage.jsx
//
// Trang trình duyệt của khách được backend Redirect() tới sau khi xử lý callback VNPay
// (PaymentsController/DonationsController/FnbOrdersController/SubscriptionsController đều dùng
// chung VnPayIpnProtocol.BuyerLandingUrl) — dùng chung cho cả 4 luồng thanh toán (vé/donate/F&B/
// gói dịch vụ). Backend không đính kèm query param nào khi redirect (Redirect() chỉ trả URL cấu
// hình sẵn trong Business:PaymentSuccessUrl/PaymentFailedUrl/PaymentProcessingUrl), nên trang này
// thuần hiển thị theo route, không đọc state gì từ URL.
//
// "processing" là trạng thái thứ 3 cố ý khác "failed": VNPay xác nhận thành công nhưng quá muộn để
// cấp vé (hold đã hết hạn/vé đã hết) — khách đã bị trừ tiền, không phải giao dịch thất bại.
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react'

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success border-green-500/30 bg-green-500/10',
    title: 'Thanh toán thành công',
    message: 'Vé của bạn đã được xác nhận. Bạn xem vé trong mục Vé của tôi.',
    ctaLabel: 'Xem vé của tôi',
    ctaTo: '/my-shows',
  },
  failed: {
    icon: XCircle,
    iconClass: 'text-danger border-red-500/30 bg-red-500/10',
    title: 'Thanh toán không thành công',
    message: 'Thanh toán chưa hoàn tất và bạn chưa bị trừ tiền. Bạn có thể thử lại.',
    ctaLabel: 'Về trang chủ',
    ctaTo: '/',
  },
  processing: {
    icon: Clock,
    iconClass: 'text-warning border-yellow-500/30 bg-yellow-500/10',
    title: 'Đã nhận thanh toán, vé đang chờ xác nhận',
    message:
      'Thanh toán của bạn đã thành công nhưng chúng tôi chưa kịp xác nhận vé (có thể vé vừa hết ngay trước khi thanh toán hoàn tất). Đội ngũ sẽ kiểm tra lại — vui lòng xem mục Vé của tôi sau ít phút, hoặc liên hệ hỗ trợ nếu sau 24 giờ vẫn chưa thấy vé.',
    ctaLabel: 'Xem vé của tôi',
    ctaTo: '/my-shows',
  },
}

const PaymentResultPage = ({ status }) => {
  const variant = VARIANTS[status] ?? VARIANTS.failed
  const Icon = variant.icon

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-card border border-line rounded-2xl p-8 text-center">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 border ${variant.iconClass}`}>
          <Icon size={32} />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-3">{variant.title}</h1>
        <p className="text-ink-soft mb-8">{variant.message}</p>
        <Link
          to={variant.ctaTo}
          className="inline-block w-full py-3 bg-brand text-on-brand rounded-lg font-bold hover:bg-brand-hover transition-colors"
        >
          {variant.ctaLabel}
        </Link>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 text-sm text-ink-mute hover:text-brand-text transition-colors"
        >
          <ArrowLeft size={14} /> Về trang chủ
        </Link>
      </div>
    </div>
  )
}

export default PaymentResultPage
