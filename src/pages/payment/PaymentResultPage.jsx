// src/pages/payment/PaymentResultPage.jsx

// Trang trình duyệt của khách được backend Redirect() tới sau khi xử lý callback VNPay
// (PaymentsController/DonationsController/FnbOrdersController/SubscriptionsController đều dùng
// chung VnPayIpnProtocol.BuyerLandingUrl) — dùng chung cho cả 4 luồng thanh toán (vé/donate/F&B/
// gói dịch vụ). Backend không đính kèm query param nào khi redirect (Redirect() chỉ trả URL cấu
// hình sẵn trong Business:PaymentSuccessUrl/PaymentFailedUrl/PaymentProcessingUrl), nên trang này
// thuần hiển thị theo route, không đọc state gì từ URL.
//
// "processing" là trạng thái thứ 3 cố ý khác "failed": VNPay xác nhận thành công nhưng quá muộn để
// cấp vé (hold đã hết hạn/vé đã hết) — khách đã bị trừ tiền, không phải giao dịch thất bại.
//
// LỖI ĐÃ SỬA — báo từ ảnh chụp thật: chủ phòng trà gia hạn GÓI DỊCH VỤ xong lại đọc được
// "Nếu bạn vừa mua vé, vé sẽ có trong mục Vé của tôi" kèm một nút "Xem vé của tôi".
// - Bản trước đành nói chung chung vì trang không biết mình đang ở luồng nào: backend redirect về
//   một URL CỐ ĐỊNH, không kèm query param (đã kiểm lại: `Business:PaymentSuccessUrl` trong
//   appsettings, đi qua `VnPayIpnProtocol.BuyerLandingUrl`). Câu chữ chung tuy không sai, nhưng với
//   người vừa trả tiền gói thì vẫn là nói về thứ họ không mua, và nút bấm dẫn đi sai chỗ.
// - Nay chính trang khởi tạo thanh toán ghi lại nó đang bán gì (utils/paymentContext.js) ngay trước
//   khi chuyển sang VNPay, trang này đọc lại và nói đúng luồng. Mất ngữ cảnh (khách quay về ở tab
//   khác, hoặc mở thẳng URL này) thì rơi về bản chữ chung như cũ — vẫn đúng, chỉ kém cụ thể.
// - Sửa TẬN GỐC vẫn thuộc backend: gắn `?type=ticket|donation|fnb|subscription` vào ba URL
//   Business:Payment*Url. Khi có rồi thì đọc query param TRƯỚC, sessionStorage chỉ còn là dự phòng.
// - "Khi thanh toán không thành công" khách cần một lối thoát: thêm liên kết tới trang khiếu nại công khai.
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, ArrowLeft, LifeBuoy } from 'lucide-react'
import Reveal from '../../components/shared/Reveal'
import { layThanhToan, xoaThanhToan, LOAI_THANH_TOAN } from '../../utils/paymentContext'

// Bản chữ chung — dùng khi không biết khách vừa trả tiền cho cái gì.
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

// Bản chữ riêng cho từng luồng. Chỉ đè khi có điều gì đúng hơn để nói. Trạng thái `failed` giữ
// nguyên cho cả bốn luồng vì câu "chưa bị trừ tiền, thử lại được" đã đúng sẵn với mọi loại.
const THEO_LOAI = {
  [LOAI_THANH_TOAN.GOI]: {
    success: {
      title: 'Đã kích hoạt gói dịch vụ',
      message:
        'Thanh toán đã được ghi nhận và gói dịch vụ của phòng trà đã được kích hoạt. Hạn dùng cùng quyền lợi mới hiển thị trong trang Gói dịch vụ.',
      primary: { to: '/owner/subscription', label: 'Xem gói dịch vụ' },
    },
    processing: {
      title: 'Đã nhận thanh toán, đang chờ kích hoạt gói',
      message:
        'Thanh toán đã thành công nhưng gói chưa kích hoạt xong. Vui lòng mở lại trang Gói dịch vụ sau ít phút; nếu sau 24 giờ vẫn chưa thấy, hãy liên hệ hỗ trợ.',
      primary: { to: '/owner/subscription', label: 'Xem gói dịch vụ' },
    },
  },
  [LOAI_THANH_TOAN.VE]: {
    success: {
      title: 'Đặt vé thành công',
      message: 'Vé của bạn đã được xác nhận. Mã QR vào cửa nằm trong mục Vé của tôi.',
      primary: { to: '/my-shows', label: 'Xem vé của tôi' },
    },
  },
  [LOAI_THANH_TOAN.UNG_HO]: {
    success: {
      title: 'Cảm ơn bạn đã ủng hộ',
      message:
        'Khoản ủng hộ đã được ghi nhận và sẽ chuyển tới nghệ sĩ. Bạn xem lại trong mục Vé & danh sách của tôi.',
      primary: { to: '/my-shows', label: 'Xem lịch sử ủng hộ' },
    },
    processing: {
      title: 'Đã nhận thanh toán, đang chờ xác nhận',
      message:
        'Khoản ủng hộ đã thanh toán thành công nhưng chưa ghi nhận xong. Vui lòng kiểm tra lại sau ít phút, hoặc liên hệ hỗ trợ nếu sau 24 giờ vẫn chưa thấy.',
      primary: { to: '/my-shows', label: 'Xem lịch sử ủng hộ' },
    },
  },
  [LOAI_THANH_TOAN.GOI_MON]: {
    success: {
      title: 'Đã thanh toán đơn gọi món',
      message: 'Đơn của bạn đã được gửi tới quầy. Nhân viên phòng trà sẽ mang đồ ra bàn của bạn.',
    },
    processing: {
      title: 'Đã nhận thanh toán, đang chờ xác nhận đơn',
      message:
        'Thanh toán đã thành công nhưng đơn chưa xác nhận xong. Nếu sau ít phút vẫn chưa thấy đơn, vui lòng báo nhân viên tại quầy.',
    },
  },
}

const PaymentResultPage = ({ status }) => {
  // Đọc một lần lúc khởi tạo state. `layThanhToan` là hàm THUẦN nên React có chạy lại hàm khởi tạo
  // (StrictMode) cũng vô hại. Việc xoá tách riêng xuống effect — đọc-rồi-xoá ngay trong thân render
  // sẽ làm lần render thứ hai không còn gì để đọc.
  const [nguCanh] = useState(layThanhToan)
  useEffect(() => {
    xoaThanhToan()
  }, [])

  const chung = VARIANTS[status] ?? VARIANTS.failed
  const rieng = nguCanh ? THEO_LOAI[nguCanh.loai]?.[status] : null
  // `quayVe` hiện chỉ dùng cho luồng gọi món — đưa khách về đúng thực đơn của quán họ đang ngồi,
  // thay vì đẩy ra trang chủ.
  const quayVe =
    nguCanh?.loai === LOAI_THANH_TOAN.GOI_MON && nguCanh.quayVe
      ? { to: nguCanh.quayVe, label: 'Quay lại thực đơn' }
      : null

  const variant = { ...chung, ...rieng, primary: rieng?.primary ?? quayVe ?? chung.primary }
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
