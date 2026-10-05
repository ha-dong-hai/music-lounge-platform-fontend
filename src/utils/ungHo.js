// src/utils/ungHo.js
//
// Tạo khoản ủng hộ rồi chuyển sang VNPay. Ủng hộ nghệ sĩ CHỈ có trong màn xem trực tuyến, cạnh khung chat — quyết định
// của chủ dự án 05/10/2026: trang chi tiết buổi diễn KHÔNG có nút ủng hộ (MLACP-638 từng thêm, đã gỡ). Backend vẫn nhận
// ủng hộ cho mọi buổi ĐANG DIỄN (CreateDonationCommandHandler chỉ hỏi show.Status = Ongoing) — đó là giới hạn phía máy
// chủ, không phải lời mời mở thêm lối vào ở web. Tách khỏi LivestreamWatchPage để trang đó gọn và lỗi được ném ra rõ ràng.
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
