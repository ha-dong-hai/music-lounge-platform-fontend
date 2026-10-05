// src/utils/ungHo.js
//
// MỘT nơi tạo khoản ủng hộ rồi chuyển sang VNPay — dùng chung cho trang xem trực tuyến và trang buổi diễn tại chỗ
// (MLACP-638). Trước đó logic này chỉ nằm trong LivestreamWatchPage, nên khán giả ngồi tại phòng trà không có đường nào
// để ủng hộ dù backend nhận ủng hộ cho mọi buổi ĐANG DIỄN (CreateDonationCommandHandler chỉ hỏi show.Status = Ongoing).
//
// NÉM lỗi có câu tiếng Việt để DonateModal in ngay trong hộp (01/10/2026): bản cũ tự toast rồi nuốt lỗi, nên hộp vẫn báo
// thành công dù khoản ủng hộ chưa được tạo. Thành công thì chuyển hẳn trang sang VNPay — không trả về gì.
import { createDonation } from '../services/donationServices'
import { ghiNhoThanhToan, LOAI_THANH_TOAN } from './paymentContext'

export async function guiUngHoQuaVnPay(performers, performerId, amount, message) {
  const performance = (performers ?? []).find((p) => p.id === performerId)
  if (!performance?.performanceId) throw new Error('Không xác định được phần trình diễn của nghệ sĩ này.')
  let res
  try {
    res = await createDonation({ performanceId: performance.performanceId, amount, message: message || null, isMessagePublic: true })
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Chưa tạo được khoản ủng hộ. Hãy thử lại.', { cause: err })
  }
  if (!res.success || !res.data?.paymentUrl) throw new Error(res.message || 'Chưa nhận được đường dẫn thanh toán. Hãy thử lại.')
  ghiNhoThanhToan(LOAI_THANH_TOAN.UNG_HO)
  window.location.href = res.data.paymentUrl
}
