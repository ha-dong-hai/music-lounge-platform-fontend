import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Ticket, ArrowLeft } from 'lucide-react'
import './PaymentResult.css'

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | failed

  useEffect(() => {
    // VNPay redirects back with query params like vnp_ResponseCode
    const responseCode = searchParams.get('vnp_ResponseCode')
    const txnRef = searchParams.get('vnp_TxnRef')

    // Simulate a brief loading state
    const timer = setTimeout(() => {
      if (responseCode === '00') {
        setStatus('success')
      } else if (responseCode) {
        setStatus('failed')
      } else {
        // No VNPay params — might be a direct navigation, assume success
        setStatus('success')
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card">
          <Loader2 size={64} className="payment-spinner" />
          <h1>Đang xử lý thanh toán...</h1>
          <p className="payment-subtitle">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card">
          <div className="payment-icon-wrapper failed">
            <XCircle size={64} />
          </div>
          <h1>Thanh toán thất bại</h1>
          <p className="payment-subtitle">
            Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
          </p>
          <div className="payment-actions">
            <Link to="/" className="payment-btn secondary">
              <ArrowLeft size={18} /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div className="payment-icon-wrapper success">
          <CheckCircle2 size={64} />
        </div>
        <h1>Thanh toán thành công!</h1>
        <p className="payment-subtitle">
          Vé của bạn đã được xác nhận. Kiểm tra email để nhận mã QR check-in.
        </p>

        <div className="payment-details">
          <div className="payment-detail-row">
            <span>Mã giao dịch</span>
            <span className="mono">{searchParams.get('vnp_TxnRef') || '—'}</span>
          </div>
          <div className="payment-detail-row">
            <span>Số tiền</span>
            <span className="highlight">
              {searchParams.get('vnp_Amount')
                ? `${(Number(searchParams.get('vnp_Amount')) / 100).toLocaleString('vi-VN')}đ`
                : '—'}
            </span>
          </div>
        </div>

        <div className="payment-actions">
          <Link to="/my-shows" className="payment-btn primary">
            <Ticket size={18} /> Xem vé của tôi
          </Link>
          <Link to="/" className="payment-btn secondary">
            <ArrowLeft size={18} /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
